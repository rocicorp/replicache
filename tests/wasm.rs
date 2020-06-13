use replicache_client::wasm;
use wasm_bindgen_test::*;
use wasm_bindgen_test::wasm_bindgen_test_configure;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_new() {
    wasm::newReplicache("foo".to_string()).await;
}
