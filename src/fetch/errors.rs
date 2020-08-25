// FetchErrors are returned by both the rust and browser versions of fetch. Since
// lower level errors in each case will be coming from two different places,
// FetchError is lossy of the error types underneath: it holds an error string.
#[derive(Debug)]
pub enum FetchError {
    ErrorReadingResponseBodyAsString(String),
    ErrorReadingResponseBody(String),
    FailedToWrapHttpResponse(String),
    InvalidRequestBody(String),
    InvalidRequestHeader(String),
    InvalidResponseFromJS,
    NoWindow,
    RequestFailed(String),
    UnableToCreateRequest(String),
    UnableToSetRequestHeader(String),
}
