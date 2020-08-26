use crate::fetch::errors::FetchError;
use crate::fetch::errors::FetchError::*;
use http::Request;

mod tokio_compat;

// s makes map_err calls nicer by mapping a error to its debug-printed string.
fn s<D: std::fmt::Debug>(err: D) -> String {
    format!("{:?}", err)
}

pub struct Client {
    hyper_client: hyper::Client<tokio_compat::AsyncStdTcpConnector>,
}

impl Default for Client {
    fn default() -> Self {
        Client::new()
    }
}

impl Client {
    pub fn new() -> Client {
        Client {
            hyper_client: hyper::Client::builder()
                .executor(tokio_compat::AsyncStdExecutor)
                .build::<_, hyper::Body>(tokio_compat::AsyncStdTcpConnector),
        }
    }

    // request() makes an HTTP request using a native rust HTTP client, as opposed
    // to using the browser's Fetch API in wasm. It consumes its request input by design.
    // The response returned will have the status and body set but not the headers,
    // but only because we haven't writtent that code. Non-200 status code does not
    // constitute an Err Result.
    //
    // IF YOU CHANGE THE BEHAVIOR OR CAPABILITIES OF THIS FUNCTION please be sure to reflect
    // the same changes into the rust client.
    //
    // TODO TLS
    // TODO timeout/abort
    // TODO log req/resp
    // TODO understand what if any tokio runtime assumptions are implied here
    pub async fn request(
        &self,
        http_req: Request<String>,
    ) -> Result<http::Response<String>, FetchError> {
        let (parts, req_body) = http_req.into_parts();
        let mut builder = hyper::Request::builder()
            .method(parts.method.as_str())
            .uri(&parts.uri.to_string());
        for (k, v) in parts.headers.iter() {
            builder = builder.header(k, v.to_str().map_err(|e| InvalidRequestHeader(s(e)))?);
        }
        let hyper_req = builder
            .body(hyper::Body::from(req_body))
            .map_err(|e| InvalidRequestBody(s(e)))?;

        let mut hyper_resp = self
            .hyper_client
            .request(hyper_req)
            .await
            .map_err(|e| RequestFailed(s(e)))?;
        let http_resp_builder = http::response::Builder::new();
        let http_resp_bytes = hyper::body::to_bytes(hyper_resp.body_mut())
            .await
            .map_err(|e| ErrorReadingResponseBody(s(e)))?;
        let http_resp_string = String::from_utf8(http_resp_bytes.to_vec()) // Copies :(
            .map_err(|e| ErrorReadingResponseBodyAsString(s(e)))?;
        let http_resp = http_resp_builder
            .status(hyper_resp.status())
            .body(http_resp_string)
            .map_err(|e| FailedToWrapHttpResponse(s(e)))?;
        Ok(http_resp)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use async_std::net::TcpListener;
    use tide::{Body, Response};

    #[async_std::test]
    async fn test_rust_fetch() {
        struct Case<'a> {
            pub name: &'a str,
            pub path: &'a str,
            pub body: &'a str,
            pub status: u16,
        }
        let cases = [
            Case {
                name: "ok",
                path: "/",
                body: "body",
                status: 200,
            },
            Case {
                name: "ok no body",
                path: "/",
                body: "",
                status: 200,
            },
            Case {
                name: "404",
                path: "/404",
                body: "",
                status: 404,
            },
        ];

        let mut app = tide::new();
        app.at("/").post(|mut req: tide::Request<()>| async move {
            assert_eq!(
                "Header Value",
                req.header("X-Header-Name").unwrap().as_str()
            );
            Ok(Response::builder(200).body(Body::from_string(req.body_string().await?)))
        });
        app.at("/404").post(|_| async { Ok(Response::new(404)) });
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        let handle = async_std::task::spawn_local(app.listen(listener));

        for c in cases.iter() {
            let req = http::request::Builder::new()
                .method("POST")
                .uri(format!("http://{}{}", addr, c.path))
                .header("X-Header-Name", "Header Value")
                .body(c.body.to_string())
                .unwrap();
            let resp = Client::new().request(req).await.unwrap();
            assert_eq!(c.status, resp.status());
            assert_eq!(c.body, resp.body());
        }
        handle.cancel().await;
    }

    #[async_std::test]
    async fn rust_tls_fetch() {
        let resp = Client::new()
            .request(Request::get("http://quip.com").body("".to_owned()).unwrap())
            .await
            .unwrap();
        assert_eq!(301, resp.status());

        let resp = Client::new()
            .request(
                Request::get("https://quip.com")
                    .body("".to_owned())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(200, resp.status());
    }

    #[async_std::test]
    async fn dns_error() {
        for host in vec!["http://roci.invalid", "https://roci.invalid"] {
            let err = Client::new()
                .request(Request::get(host).body("".to_owned()).unwrap())
                .await
                .unwrap_err();
            assert!(s(err).contains("failed to lookup address"));
        }
    }
}
