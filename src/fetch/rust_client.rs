use crate::fetch::errors::FetchError;
use crate::fetch::errors::FetchError::*;

// s makes map_err calls nicer by mapping a error to its debug-printed string.
fn s<D: std::fmt::Debug>(err: D) -> String {
    format!("{:?}", err)
}

pub struct Client {
    hyper_client: hyper::Client<hyper::client::HttpConnector>,
}

impl Default for Client {
    fn default() -> Self {
        Client::new()
    }
}

impl Client {
    pub fn new() -> Client {
        Client {
            hyper_client: hyper::Client::new(),
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
        http_req: http::Request<String>,
    ) -> Result<http::Response<String>, FetchError> {
        let (parts, req_body) = http_req.into_parts();
        let mut builder = hyper::Request::builder()
            .method(parts.method.as_str())
            .uri(&parts.uri.to_string());
        for (k, v) in parts.headers.iter() {
            builder = builder.header(
                k,
                v.to_str().map_err(|e| InvalidRequestHeader(Box::new(e)))?,
            );
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
    use httptest::{matchers::*, Expectation, Server};

    #[tokio::test]
    async fn test_rust_fetch() {
        let path = "/test";
        struct Case<'a> {
            pub name: &'a str,
            pub req_body: &'a str,
            pub resp_status: u16,
            pub resp_body: &'a str,
            pub exp_error: Option<FetchError>,
            pub exp_status: u16,
            pub exp_body: &'a str,
        }
        let cases = [
            Case {
                name: "ok",
                req_body: "body",
                resp_status: 200,
                resp_body: "hello",
                exp_error: None,
                exp_status: 200,
                exp_body: "hello",
            },
            Case {
                name: "ok no body",
                req_body: "",
                resp_status: 200,
                resp_body: "",
                exp_error: None,
                exp_status: 200,
                exp_body: "",
            },
            Case {
                name: "404",
                req_body: "",
                resp_status: 404,
                resp_body: "",
                exp_error: None,
                exp_status: 404,
                exp_body: "",
            },
        ];
        for c in cases.iter() {
            let server = Server::run();
            let resp = http::Response::builder()
                .status(c.resp_status)
                .body(c.resp_body)
                .unwrap();
            server.expect(
                Expectation::matching(all_of![
                    request::method_path("POST", path),
                    // sic lowercase header below; it does that apparently though http request
                    // headers are supposed to be case-insensitive.
                    request::headers(contains(("x-header-name", "Header Value"))),
                    request::body(c.req_body.to_string()),
                ])
                .respond_with(resp),
            );

            let mut req_builder = http::request::Builder::new();
            req_builder = req_builder
                .method("POST")
                .uri(server.url(path))
                .header("X-Header-Name", "Header Value");
            let req = req_builder.body(c.req_body.to_string()).unwrap();
            let client = Client::new();
            let resp = client.request(req).await;

            // Is there a simpler way to write this?
            match &c.exp_error {
                None => {
                    if let Err(e) = &resp {
                        assert!(false, "expected no error, got {:?}", e);
                    }
                    let got = resp.unwrap();
                    assert_eq!(c.exp_status, got.status());
                    assert_eq!(c.exp_body, got.body());
                }
                Some(e) => {
                    if let Ok(_) = resp {
                        assert!(false, "expected {:?}, got Ok", e);
                    }
                }
            }
        }
    }
}
