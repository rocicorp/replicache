#[cfg(not(target_arch = "wasm32"))]
use crate::fetch::errors::FetchError;
#[cfg(not(target_arch = "wasm32"))]
use std::future::Future;
#[cfg(not(target_arch = "wasm32"))]
use std::time::Duration;

#[cfg(not(target_arch = "wasm32"))]
pub async fn with_timeout<F>(
    request_future: F,
    timeout: Duration,
) -> Result<http::Response<String>, FetchError>
where
    F: Future<Output = Result<http::Response<String>, FetchError>>,
{
    use crate::fetch::errors::FetchError::*;
    let timeout_future = async_std::future::timeout(timeout, request_future);
    match timeout_future.await {
        Err(e) => Err(RequestTimeout(e)),
        Ok(r) => r,
    }
}
