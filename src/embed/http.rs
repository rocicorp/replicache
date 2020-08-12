use std::convert::TryFrom;
use std::error::Error;
use std::fmt;
use std::str;
use wasm_bindgen::JsCast;
use wasm_bindgen::JsValue;
use wasm_bindgen_futures::JsFuture;
use web_sys::{RequestInit, RequestMode};

// browser_fetch makes and HTTP request over the network via the browser's Fetch API.
// It is intended to be used in wasm; it won't work in regular rust. The response contains
// the status and body, it doesn't populate response headers (though it easily could).
// Since we can't run a web server in wasm land and this fn doesn't work in rust land
// this fn is tested manually in tests/wasm.rs.
//
// TODO timeout/abort
// TODO log request/response
pub async fn browser_fetch(
    http_req: &http::Request<String>,
) -> Result<http::Response<String>, FetchError> {
    let mut opts = RequestInit::new();
    opts.method(http_req.method().as_str());
    opts.mode(RequestMode::Cors);
    let js_body = JsValue::from_str(http_req.body());
    opts.body(Some(&js_body));
    let web_sys_req = web_sys::Request::new_with_str_and_init(&http_req.uri().to_string(), &opts)?;
    let h = web_sys_req.headers();
    for (k, v) in http_req.headers().iter() {
        h.set(k.as_ref(), v.to_str().unwrap())?;
    }

    let window = web_sys::window().ok_or(FetchError::new("could not get window"))?;
    let http_req_promise = window.fetch_with_request(&web_sys_req);
    let http_req_future = JsFuture::from(http_req_promise);
    let js_web_sys_resp = http_req_future.await?;
    if !js_web_sys_resp.is_instance_of::<web_sys::Response>() {
        return Err(FetchError::new("result from future not a Response"));
    }
    let web_sys_resp: web_sys::Response = js_web_sys_resp.dyn_into().unwrap();
    let body_js_value = JsFuture::from(web_sys_resp.text()?).await?;
    let resp_body = body_js_value.as_string().ok_or(FetchError::new(
        "could not get http response body as string",
    ))?;

    let builder = http::response::Builder::new();
    let http_resp = builder.status(web_sys_resp.status()).body(resp_body)?;
    Ok(http_resp)
}

// FetchErrors are returned by both the rust and browser versions of fetch. Since
// lower level errors in each case will be coming from two different places I implemented
// FetchError as lossy of the error types underneath: it holds an error string.
#[derive(Debug)]
pub struct FetchError {
    msg: String,
}

impl FetchError {
    fn new(msg: &str) -> FetchError {
        FetchError {
            msg: msg.to_string(),
        }
    }
}

impl fmt::Display for FetchError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{}", self.msg)
    }
}

impl Error for FetchError {
    fn description(&self) -> &str {
        &self.msg
    }
}

impl From<JsValue> for FetchError {
    fn from(err: JsValue) -> FetchError {
        match js_sys::Error::try_from(err) {
            Ok(e) => FetchError::new(&format!("{:?}", e)),
            Err(_) => FetchError::new("could not convert to js_sys::Error"),
        }
    }
}

impl From<http::Error> for FetchError {
    fn from(err: http::Error) -> FetchError {
        FetchError::new(&format!("{:?}", err))
    }
}
