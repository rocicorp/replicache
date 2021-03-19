use wasm_bindgen::prelude::*;
use wasm_bindgen::{JsCast, JsValue};

pub fn global_property<T>(property: &str) -> Result<T, JsValue>
where
    T: wasm_bindgen::JsCast,
{
    let global = js_sys::global();
    let key = JsValue::from_str(property);
    js_sys::Reflect::get(&global, &key)?.dyn_into()
}

#[wasm_bindgen(module = "/src/util/wasm/mod.js")]
extern "C" {
    #[wasm_bindgen(js_name = performanceNow)]
    pub fn performance_now() -> f64;
}
