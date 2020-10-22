use wasm_bindgen::JsValue;

// FetchErrors are returned by both the rust and browser versions of fetch. Since
// lower level errors in each case will be coming from two different places,
// FetchError is lossy of the error types underneath: it holds an error string.
#[derive(Debug)]
pub enum FetchError {
    ErrorReadingResponseBody(String),
    ErrorReadingResponseBodyAsString(String),
    FailedToWrapHttpResponse(String),
    FetchFailed(JsValue),
    InvalidRequestBody(String),
    InvalidRequestHeader(String),
    InvalidResponseFromJs(JsValue),
    NoFetch(JsValue),
    RequestFailed(String),
    RequestTimeout(async_std::future::TimeoutError),
    UnableToCreateRequest(String),
    UnableToSetRequestHeader(String),
}
