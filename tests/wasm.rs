use replicache_client::wasm;
use wasm_bindgen_test::wasm_bindgen_test_configure;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_new() {
    wasm::new_replicache("foo".to_string()).await;
}
