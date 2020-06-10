use replicache_client::wasm;
use wasm_bindgen_test::*;
use wasm_bindgen_test::wasm_bindgen_test_configure;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
fn test_hash() {
    assert_eq!("rmnjb8cjc5tblj21ed4qs821649eduie", wasm::hash("abc"));
}
