use wasm_bindgen::{JsCast, JsValue};

pub fn global_property<T>(property: &str) -> Result<T, JsValue>
where
    T: wasm_bindgen::JsCast,
{
    let global = js_sys::global();
    let key = JsValue::from_str(property);
    js_sys::Reflect::get(&global, &key)?.dyn_into()
}
