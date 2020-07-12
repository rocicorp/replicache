use replicache_client::wasm;
use wasm_bindgen_test::wasm_bindgen_test_configure;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bindgen_test]
async fn test_dag() {
    wasm::exercise_prolly().await;
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

#[wasm_bindgen_test]
async fn test_get_put() {
    assert_eq!(
        dispatch("db", "put", "{\"k\", \"v\"}").await.unwrap_err(),
        "\"db\" not open"
    );
    assert_eq!(dispatch("db", "open", "").await.unwrap(), "");

    // Check request parsing, both missing and unexpected fields.
    assert_eq!(
        dispatch("db", "put", "{}").await.unwrap_err(),
        "Failed to parse request"
    );
    // With serde we can use #[serde(deny_unknown_fields)] to parse strictly,
    // but that's not available with nanoserde.
    assert_eq!(
        dispatch("db", "get", "{\"key\": \"Hello\", \"value\": \"世界\"}")
            .await
            .unwrap(),
        "{\"has\":false}", // unwrap_err() == "Failed to parse request"
    );

    // Simple put then get test.
    // TODO(nate): Resolve how to pass non-UTF-8 sequences through the API.
    assert_eq!(
        dispatch("db", "put", "{\"key\": \"Hello\", \"value\": \"世界\"}")
            .await
            .unwrap(),
        ""
    );
    assert_eq!(
        dispatch("db", "get", "{\"key\": \"Hello\"}").await.unwrap(),
        "{\"value\":\"世界\",\"has\":true}"
    );

    // Verify functioning of non-ASCII keys.
    assert_eq!(
        dispatch("db", "has", "{\"key\": \"你好\"}").await.unwrap(),
        "{\"has\":false}"
    );
    assert_eq!(
        dispatch("db", "get", "{\"key\": \"你好\"}").await.unwrap(),
        "{\"has\":false}"
    );
    assert_eq!(
        dispatch("db", "put", "{\"key\": \"你好\", \"value\": \"world\"}")
            .await
            .unwrap(),
        ""
    );
    assert_eq!(
        dispatch("db", "has", "{\"key\": \"你好\"}").await.unwrap(),
        "{\"has\":true}"
    );
    assert_eq!(
        dispatch("db", "get", "{\"key\": \"你好\"}").await.unwrap(),
        "{\"value\":\"world\",\"has\":true}"
    );

    assert_eq!(dispatch("db", "close", "").await.unwrap(), "");
}
