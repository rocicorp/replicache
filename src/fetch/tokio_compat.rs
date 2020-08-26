// Portions of the code in this file originate from
// https://github.com/leo-lb/hyper-async-std/blob/master/src/main.rs and
// https://github.com/stjepang/smol/blob/master/examples/hyper-client.rs.
// This source file is released under the MIT license:
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

use async_native_tls::TlsStream;
use async_std::{io, net::TcpStream, task};
use futures_io::{AsyncRead, AsyncWrite};
use http::Uri;
use hyper::{
    client::connect::{Connected, Connection},
    rt::Executor,
    service::Service,
};
use std::net::{Shutdown, ToSocketAddrs};
use std::{
    future::Future,
    pin::Pin,
    result::Result,
    task::{Context, Poll},
};

/// A TCP or TCP+TLS connection.
pub enum AsyncStdStream {
    /// A plain TCP connection.
    Plain(TcpStream),

    /// A TCP connection secured by TLS.
    Tls(TlsStream<TcpStream>),
}

impl Connection for AsyncStdStream {
    fn connected(&self) -> Connected {
        Connected::new()
    }
}

impl tokio::io::AsyncRead for AsyncStdStream {
    fn poll_read(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &mut [u8],
    ) -> Poll<io::Result<usize>> {
        match &mut *self {
            AsyncStdStream::Plain(s) => AsyncRead::poll_read(Pin::new(s), cx, buf),
            AsyncStdStream::Tls(s) => AsyncRead::poll_read(Pin::new(s), cx, buf),
        }
    }
}

impl tokio::io::AsyncWrite for AsyncStdStream {
    fn poll_write(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &[u8],
    ) -> Poll<io::Result<usize>> {
        match &mut *self {
            AsyncStdStream::Plain(s) => AsyncWrite::poll_write(Pin::new(s), cx, buf),
            AsyncStdStream::Tls(s) => AsyncWrite::poll_write(Pin::new(s), cx, buf),
        }
    }

    fn poll_flush(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<io::Result<()>> {
        match &mut *self {
            AsyncStdStream::Plain(s) => AsyncWrite::poll_flush(Pin::new(s), cx),
            AsyncStdStream::Tls(s) => AsyncWrite::poll_flush(Pin::new(s), cx),
        }
    }

    fn poll_shutdown(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<io::Result<()>> {
        match &mut *self {
            AsyncStdStream::Plain(s) => {
                s.shutdown(Shutdown::Write)?;
                Poll::Ready(Ok(()))
            }
            AsyncStdStream::Tls(s) => AsyncWrite::poll_close(Pin::new(s), cx),
        }
    }
}

pub struct AsyncStdExecutor;

impl<F> Executor<F> for AsyncStdExecutor
where
    F: Future + Send + 'static,
    F::Output: Send + 'static,
{
    fn execute(&self, fut: F) {
        task::spawn(async move { fut.await });
    }
}

#[derive(Clone)]
pub struct AsyncStdTcpConnector;

// Aliased to avoid Clippy type-complexity warning on Future below.
type ServiceOutput = Result<AsyncStdStream, io::Error>;

impl Service<Uri> for AsyncStdTcpConnector {
    type Response = AsyncStdStream;
    type Error = io::Error;
    type Future = Pin<Box<dyn Future<Output = ServiceOutput> + Send>>;

    fn poll_ready(&mut self, _: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        Poll::Ready(Ok(()))
    }

    fn call(&mut self, uri: Uri) -> Self::Future {
        Box::pin(async move {
            let host = match uri.host() {
                Some(host) => host,
                _ => return Err(io::Error::new(io::ErrorKind::Other, "missing host in Uri")),
            };

            match uri.scheme_str() {
                Some("http") => {
                    let port = uri.port_u16().unwrap_or(80);
                    let stream = TcpStream::connect((host, port)).await?;
                    Ok(AsyncStdStream::Plain(stream))
                }
                Some("https") => {
                    // In case of HTTPS, establish a secure TLS connection first.
                    let socket_addr = {
                        let host = host.to_string();
                        let port = uri.port_u16().unwrap_or(443);
                        // This is blocking, but async_std says that's okay:
                        // https://async.rs/blog/stop-worrying-about-blocking-the-new-async-std-runtime/.
                        match (host.as_str(), port).to_socket_addrs() {
                            Err(e) => return Err(io::Error::new(io::ErrorKind::Other, e)),
                            Ok(mut v) => v.next().unwrap(),
                        }
                    };
                    let stream = TcpStream::connect(socket_addr).await?;
                    let stream = async_native_tls::connect(host, stream).await.map_err(|e| {
                        io::Error::new(io::ErrorKind::Other, format!("TLS error: {:?}", e))
                    })?;
                    Ok(AsyncStdStream::Tls(stream))
                }
                scheme => Err(io::Error::new(
                    io::ErrorKind::Other,
                    format!("unsupported scheme: {:?}", scheme),
                )),
            }
        })
    }
}
