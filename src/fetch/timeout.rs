use crate::fetch::errors::FetchError;
use crate::fetch::errors::FetchError::*;
use std::future::Future;
use std::time::Duration;

pub async fn with_timeout<F>(
    request_future: F,
    timeout: Duration,
) -> Result<http::Response<String>, FetchError>
where
    F: Future<Output = Result<http::Response<String>, FetchError>>,
{
    let timeout_future = async_std::future::timeout(timeout, request_future);
    match timeout_future.await {
        Err(e) => Err(RequestTimeout(e)),
        Ok(r) => r,
    }
}
