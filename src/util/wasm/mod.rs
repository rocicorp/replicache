use wasm_bindgen::prelude::*;

#[wasm_bindgen(module = "/src/util/wasm/mod.js")]
extern "C" {
    #[wasm_bindgen(js_name = performanceNow)]
    pub fn performance_now() -> f64;
}
