use replicache_client::wasm;
use wasm_bindgen_test::wasm_bindgen_test_configure;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_new() {
    wasm::new_replicache("foo".to_string()).await;
}

async fn dispatch(db: &str, rpc: &str, data: &str) -> Result<String, String> {
    match wasm::dispatch(db.to_string(), rpc.to_string(), data.to_string()).await {
        Ok(v) => Ok(v),
        Err(v) => Err(v.as_string().unwrap()),
    }
}

#[wasm_bindgen_test]
async fn test_dispatch() {
    assert_eq!(dispatch("", "debug", "open_dbs").await.unwrap(), "[]");
    assert_eq!(
        dispatch("", "open", "").await.unwrap_err(),
        "db_name must be non-empty"
    );
    assert_eq!(dispatch("db", "open", "").await.unwrap(), "");
    assert_eq!(dispatch("", "debug", "open_dbs").await.unwrap(), "[\"db\"]");
    assert_eq!(dispatch("db2", "open", "").await.unwrap(), "");
    assert_eq!(
        dispatch("", "debug", "open_dbs").await.unwrap(),
        "[\"db\", \"db2\"]"
    );
    assert_eq!(dispatch("db", "close", "").await.unwrap(), "");
    assert_eq!(dispatch("db", "close", "").await.unwrap(), "");
    assert_eq!(
        dispatch("", "debug", "open_dbs").await.unwrap(),
        "[\"db2\"]"
    );
    assert_eq!(dispatch("db2", "close", "").await.unwrap(), "");
    assert_eq!(dispatch("", "debug", "open_dbs").await.unwrap(), "[]");
}
