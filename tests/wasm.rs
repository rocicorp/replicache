#![recursion_limit = "256"]

use futures::join;
use nanoserde::{DeJson, SerJson};
use rand::Rng;
#[allow(unused_imports)]
use replicache_client::embed::sync;
use replicache_client::embed::types::*;
#[allow(unused_imports)]
use replicache_client::fetch;
use replicache_client::wasm;
use wasm_bindgen_test::wasm_bindgen_test_configure;
use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

fn random_db() -> String {
    let mut rng = rand::thread_rng();
    std::iter::repeat(())
        .map(|_| rng.sample(rand::distributions::Alphanumeric))
        .take(12)
        .collect()
}

#[wasm_bindgen_test]
async fn dag() {
    wasm::exercise_prolly().await;
}

async fn dispatch(db: &str, rpc: &str, data: &str) -> Result<String, String> {
    match wasm::dispatch(db.to_string(), rpc.to_string(), data.to_string()).await {
        Ok(v) => Ok(v),
        Err(v) => Err(v.as_string().unwrap()),
    }
}

async fn open_transaction(db_name: &str, fn_name: Option<String>) -> u32 {
    let req = SerJson::serialize_json(&OpenTransactionRequest { name: fn_name });
    let resp: OpenTransactionResponse =
        DeJson::deserialize_json(&dispatch(db_name, "openTransaction", &req).await.unwrap())
            .unwrap();
    resp.transaction_id
}

async fn put(db_name: &str, txn_id: u32, key: &str, value: &str) {
    assert_eq!(
        dispatch(
            db_name,
            "put",
            &format!(
                "{{\"transactionId\": {}, \"key\": \"{}\", \"value\": \"{}\"}}",
                txn_id, key, value
            )
        )
        .await
        .unwrap(),
        "{}"
    );
}

async fn has(db_name: &str, txn_id: u32, key: &str) -> bool {
    let result = dispatch(
        db_name,
        "get",
        &format!("{{\"transactionId\": {}, \"key\": \"{}\"}}", txn_id, key),
    )
    .await
    .unwrap();
    let response: GetResponse = DeJson::deserialize_json(&result).unwrap();
    response.has
}

async fn get(db_name: &str, txn_id: u32, key: &str) -> Option<String> {
    let result = dispatch(
        db_name,
        "get",
        &format!("{{\"transactionId\": {}, \"key\": \"{}\"}}", txn_id, key),
    )
    .await
    .unwrap();
    let response: GetResponse = DeJson::deserialize_json(&result).unwrap();
    match response.has {
        true => Some(response.value.unwrap()),
        false => None,
    }
}

async fn commit(db_name: &str, txn_id: u32) -> Result<(), String> {
    dispatch(
        db_name,
        "commitTransaction",
        &format!("{{\"transactionId\": {}}}", txn_id),
    )
    .await
    .map(|_| ())
}

async fn abort(db_name: &str, txn_id: u32) {
    dispatch(
        db_name,
        "closeTransaction",
        &format!("{{\"transactionId\": {}}}", txn_id),
    )
    .await
    .unwrap();
}

#[wasm_bindgen_test]
async fn open_close() {
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
async fn dispatch_concurrency() {
    let db = &random_db();
    let window = web_sys::window().expect("should have a window in this context");
    let performance = window
        .performance()
        .expect("performance should be available");

    assert_eq!(dispatch(db, "open", "").await.unwrap(), "");
    let txn_id = open_transaction(db, "foo".to_string().into()).await;
    let now_ms = performance.now();
    join!(
        async {
            get(db, txn_id, "sleep100").await;
        },
        async {
            get(db, txn_id, "sleep100").await;
        }
    );
    let elapsed_ms = performance.now() - now_ms;
    abort(db, txn_id).await;
    assert_eq!(dispatch(db, "close", "").await.unwrap(), "");
    assert_eq!(elapsed_ms >= 100., true);
    assert_eq!(elapsed_ms < 200., true);
}

#[wasm_bindgen_test]
async fn write_concurrency() {
    let db = &random_db();

    dispatch(db, "open", "").await.unwrap();
    let txn_id = open_transaction(db, "foo".to_string().into()).await;
    put(db, txn_id, "value", "1").await;
    commit(db, txn_id).await.unwrap();

    // TODO(nate): Strengthen test to prove these open waits overlap.
    join!(
        async {
            let txn_id = open_transaction(db, "foo".to_string().into()).await;
            let value = get(db, txn_id, "value")
                .await
                .unwrap()
                .parse::<u32>()
                .unwrap();
            put(db, txn_id, "value", &(value + 2).to_string()).await;
            commit(db, txn_id).await.unwrap();
        },
        async {
            let txn_id = open_transaction(db, "foo".to_string().into()).await;
            let value = get(db, txn_id, "value")
                .await
                .unwrap()
                .parse::<u32>()
                .unwrap();
            put(db, txn_id, "value", &(value + 3).to_string()).await;
            commit(db, txn_id).await.unwrap();
        }
    );
    let txn_id = open_transaction(db, "foo".to_string().into()).await;
    assert_eq!(
        get(db, txn_id, "value")
            .await
            .unwrap()
            .parse::<u32>()
            .unwrap(),
        6
    );
    abort(db, txn_id).await;

    assert_eq!(dispatch(db, "close", "").await.unwrap(), "");
}

#[wasm_bindgen_test]
async fn get_put() {
    let db = &random_db();

    assert_eq!(
        dispatch(db, "put", "{\"k\", \"v\"}").await.unwrap_err(),
        format!("\"{}\" not open", db)
    );
    assert_eq!(dispatch(db, "open", "").await.unwrap(), "");

    // Check request parsing, both missing and unexpected fields.
    assert_eq!(
        dispatch(db, "put", "{}").await.unwrap_err(),
        "InvalidJson(Json Deserialize error: Key not found transaction_id, line:1 col:3)"
    );

    let txn_id = open_transaction(db, "foo".to_string().into()).await;

    // With serde we can use #[serde(deny_unknown_fields)] to parse strictly,
    // but that's not available with nanoserde.
    assert_eq!(
        dispatch(
            db,
            "get",
            &format!(
                "{{\"transactionId\": {}, \"key\": \"Hello\", \"value\": \"世界\"}}",
                txn_id,
            )
        )
        .await
        .unwrap(),
        "{\"has\":false}", // unwrap_err() == "Failed to parse request"
    );

    // Simple put then get test.
    // TODO(nate): Resolve how to pass non-UTF-8 sequences through the API.
    put(db, txn_id, "Hello", "世界").await;
    assert_eq!(get(db, txn_id, "Hello").await.unwrap(), "世界");
    commit(db, txn_id).await.unwrap();

    // Open new transaction, and verify write is persistent.
    let txn_id = open_transaction(db, "foo".to_string().into()).await;
    assert_eq!(get(db, txn_id, "Hello").await.unwrap(), "世界");

    // Verify functioning of non-ASCII keys.
    assert_eq!(has(db, txn_id, "你好").await, false);
    assert_eq!(get(db, txn_id, "你好").await, None);
    put(db, txn_id, "你好", "world").await;
    assert_eq!(has(db, txn_id, "你好").await, true);
    assert_eq!(get(db, txn_id, "你好").await, Some("world".into()));

    commit(db, txn_id).await.unwrap();
    let txn_id = open_transaction(db, "foo".to_string().into()).await;
    assert_eq!(has(db, txn_id, "你好").await, true);
    assert_eq!(get(db, txn_id, "你好").await, Some("world".into()));

    assert_eq!(dispatch(db, "close", "").await.unwrap(), "");
}

// We can't run a web server in wasm-in-the-browser so this is the next
// best thing: a manual test that FETCHES OVER THE NETWORK. To run it:
// 1. uncomment it out
// 2. wasm-pack test --chrome -- --test wasm
// 3. open developer tools in a browser window
// 4. navigate to 127.0.0.1:8000
// 5. verify the request and response by inspection:
//     - method
//     - http headers
//     - outgoing and incoming body
//
// #[wasm_bindgen_test]
// async fn test_browser_fetch() {
//     let pull_req = sync::PullRequest {
//         ..Default::default()
//     };
//     let http_req = sync::new_pull_http_request(
//         &pull_req,
//         "https://account-service.rocicorp.now.sh/api/hello",
//         "auth",
//     )
//     .unwrap();
//     let client = fetch::client::Client::new();
//     let resp = client.request(http_req).await.unwrap();
//     assert!(resp.body().contains("Well hello to you"));
// }
