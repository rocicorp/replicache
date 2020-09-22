use crate::fetch::errors::FetchError;
use crate::fetch::errors::FetchError::*;
use crate::fetch::timeout::with_timeout;
use crate::util::to_debug;
use std::convert::TryFrom;
use std::time::Duration;
use wasm_bindgen::JsCast;
use wasm_bindgen::JsValue;
use wasm_bindgen_futures::JsFuture;
use web_sys::{RequestInit, RequestMode};

// js makes request() map_err calls nicer by converting opaque JsValue errors
// into js_sys::Error's and debug-printing their content.
fn js(err: JsValue) -> String {
    match js_sys::Error::try_from(err) {
        Ok(e) => to_debug(e),
        Err(_) => "unknown JS error: could not conver to js_sys::Error".to_string(),
    }
}

pub struct Client {
    pub timeout: Duration,
}

impl Default for Client {
    fn default() -> Self {
        Client::new()
    }
}

impl Client {
    pub fn new() -> Client {
        Client {
            timeout: Duration::from_secs(super::DEFAULT_FETCH_TIMEOUT_SECS),
        }
    }

    // request() makes an HTTP request over the network via the browser's Fetch API.
    // It is intended to be used in wasm; it won't work in regular rust. The response contains
    // the status and body but not the response headers bc we haven't written that code.
    // This function consumes the request by design. Non-200 status code is not an Err.
    // Since there is no web server in wasm and we can't run this function in rust you have
    // to run the manual test in tests/wasm.rs to test changes.
    //     _ _   ____  ________          __     _____  ______   _ _
    //    | | | |  _ \|  ____\ \        / /\   |  __ \|  ____| | | |
    //    | | | | |_) | |__   \ \  /\  / /  \  | |__) | |__    | | |
    //    | | | |  _ <|  __|   \ \/  \/ / /\ \ |  _  /|  __|   | | |
    //    |_|_| | |_) | |____   \  /\  / ____ \| | \ \| |____  |_|_|
    //    (_|_) |____/|______|   \/  \/_/    \_\_|  \_\______| (_|_)
    //
    // IF YOU CHANGE THE BEHAVIOR OR CAPABILITIES OF THIS FUNCTION please be sure to reflect
    // the same changes into the rust client.
    //
    // TODO log request/response
    pub async fn request(
        &self,
        http_req: http::Request<String>,
    ) -> Result<http::Response<String>, FetchError> {
        with_timeout(self.request_impl(http_req), self.timeout).await
    }

    async fn request_impl(
        &self,
        http_req: http::Request<String>,
    ) -> Result<http::Response<String>, FetchError> {
        let mut opts = RequestInit::new();
        opts.method(http_req.method().as_str());
        opts.mode(RequestMode::Cors);
        let js_body = JsValue::from_str(http_req.body());
        opts.body(Some(&js_body));
        let web_sys_req =
            web_sys::Request::new_with_str_and_init(&http_req.uri().to_string(), &opts)
                .map_err(|e| UnableToCreateRequest(js(e)))?;
        let h = web_sys_req.headers();
        for (k, v) in http_req.headers().iter() {
            h.set(
                k.as_ref(),
                v.to_str().map_err(|e| InvalidRequestHeader(to_debug(e)))?,
            )
            .map_err(|e| UnableToSetRequestHeader(to_debug(e)))?;
        }

        let window = web_sys::window().ok_or_else(|| NoWindow)?;
        let http_req_promise = window.fetch_with_request(&web_sys_req);
        let http_req_future = JsFuture::from(http_req_promise);
        let js_web_sys_resp = http_req_future.await.map_err(|e| RequestFailed(js(e)))?;
        if !js_web_sys_resp.is_instance_of::<web_sys::Response>() {
            return Err(InvalidResponseFromJS);
        }
        let web_sys_resp: web_sys::Response = js_web_sys_resp.dyn_into().unwrap();
        let body_js_value = JsFuture::from(
            web_sys_resp
                .text()
                .map_err(|e| ErrorReadingResponseBodyAsString(js(e)))?,
        )
        .await
        .map_err(|e| ErrorReadingResponseBody(js(e)))?;
        let resp_body = body_js_value
            .as_string()
            .ok_or_else(|| ErrorReadingResponseBodyAsString("".to_string()))?;

        let builder = http::response::Builder::new();
        let http_resp = builder
            .status(web_sys_resp.status())
            .body(resp_body)
            .map_err(|e| FailedToWrapHttpResponse(to_debug(e)))?;
        Ok(http_resp)
    }
}
