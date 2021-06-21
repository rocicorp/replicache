use serde::de::DeserializeOwned;
use serde::Serialize;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen::JsValue;
use wasm_bindgen_futures::JsFuture;

#[wasm_bindgen]
extern "C" {
    type Request;

    #[wasm_bindgen(constructor)]
    fn new(url: &str, init: &JsValue) -> Request;
}

pub async fn call_js_request<Body, Response, Error>(
    func: &js_sys::Function,
    url: &str,
    body: Body,
    auth: &str,
    request_id: &str,
) -> Result<Response, Error>
where
    Body: Serialize,
    Response: DeserializeOwned,
    Error: From<JsValue> + From<serde_wasm_bindgen::Error>,
{
    #[derive(Serialize)]
    struct Headers<'a> {
        #[serde(rename = "Content-type")]
        content_type: &'a str,
        #[serde(rename = "Authorization")]
        authorization: &'a str,
        #[serde(rename = "X-Replicache-RequestID")]
        request_id: &'a str,
    }

    #[derive(Serialize)]
    struct Init<'a> {
        headers: Headers<'a>,
        body: &'a str,
        method: &'a str,
    }

    // We control body
    let body = serde_json::to_string(&body).unwrap();
    let init = Init {
        headers: Headers {
            content_type: "application/json",
            authorization: auth,
            request_id,
        },
        body: &body,
        method: "POST",
    };

    // We control init
    let js_init = serde_wasm_bindgen::to_value(&init).unwrap();
    let request = Request::new(url, &js_init);
    let p: js_sys::Promise = func.call1(&JsValue::UNDEFINED, &request)?.dyn_into()?;
    let js_res = JsFuture::from(p).await?;
    let res = serde_wasm_bindgen::from_value(js_res)?;
    Ok(res)
}
