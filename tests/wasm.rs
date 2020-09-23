#![recursion_limit = "256"]

use futures::join;
use rand::Rng;
use replicache_client::embed::types::*;
#[allow(unused_imports)]
use replicache_client::fetch;
#[allow(unused_imports)]
use replicache_client::sync;
use replicache_client::util::rlog;
use replicache_client::util::to_debug;
use replicache_client::wasm;
use serde_json::json;
use str_macro::str;
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

async fn dispatch(db: &str, rpc: &str, data: &str) -> Result<String, String> {
    match wasm::dispatch(db.to_string(), rpc.to_string(), data.to_string()).await {
        Ok(v) => Ok(v),
        Err(v) => Err(v.as_string().unwrap()),
    }
}

async fn open_transaction(
    db_name: &str,
    fn_name: Option<String>,
    args: Option<serde_json::Value>,
    rebase_opts: Option<RebaseOpts>,
) -> OpenTransactionResponse {
    let resp: OpenTransactionResponse = serde_json::from_str(
        &open_transaction_result(db_name, fn_name, args, rebase_opts)
            .await
            .unwrap(),
    )
    .unwrap();
    resp
}

async fn open_transaction_result(
    db_name: &str,
    fn_name: Option<String>,
    args: Option<serde_json::Value>,
    rebase_opts: Option<RebaseOpts>,
) -> Result<String, String> {
    let req = serde_json::to_string(&OpenTransactionRequest {
        name: fn_name,
        args,
        rebase_opts: rebase_opts,
    })
    .unwrap();
    dispatch(db_name, "openTransaction", &req).await
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
    let response: HasResponse = serde_json::from_str(&result).unwrap();
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
    let response: GetResponse = serde_json::from_str(&result).unwrap();
    match response.has {
        true => Some(response.value.unwrap()),
        false => None,
    }
}

async fn scan(
    db_name: &str,
    txn_id: u32,
    prefix: &str,
    start_key: &str,
    start_index: u32,
) -> String {
    dispatch(
        db_name,
        "scan",
        &json!({
            "transactionId": txn_id,
            "opts": {
                "prefix": prefix,
                "start": {
                    "id": {
                        "value": start_key,
                        "exclusive": false,
                    },
                    "index": start_index,
                }
            }
        })
        .to_string(),
    )
    .await
    .unwrap()
}

async fn del(db_name: &str, txn_id: u32, key: &str) -> bool {
    let result = dispatch(
        db_name,
        "del",
        &format!("{{\"transactionId\": {}, \"key\": \"{}\"}}", txn_id, key),
    )
    .await
    .unwrap();
    let response: DelResponse = serde_json::from_str(&result).unwrap();
    response.had
}

async fn commit(db_name: &str, txn_id: u32) -> Result<String, String> {
    dispatch(
        db_name,
        "commitTransaction",
        &format!("{{\"transactionId\": {}}}", txn_id),
    )
    .await
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
async fn test_open_close() {
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
async fn test_drop() {
    assert_eq!(dispatch("db", "open", "").await.unwrap(), "");
    assert_eq!(dispatch("", "debug", "open_dbs").await.unwrap(), "[\"db\"]");

    let txn_id = open_transaction("db", "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;
    put("db", txn_id, "value", "1").await;
    commit("db", txn_id).await.unwrap();

    assert_eq!(dispatch("db", "close", "").await.unwrap(), "");

    // drop db
    assert_eq!(dispatch("db", "drop", "").await.unwrap(), "");

    // re-open, should be empty
    assert_eq!(dispatch("db", "open", "").await.unwrap(), "");
    let txn_id = open_transaction("db", None, None, None)
        .await
        .transaction_id;
    assert_eq!(has("db", txn_id, "foo").await, false);
    assert_eq!(dispatch("db", "close", "").await.unwrap(), "");
}

#[wasm_bindgen_test]
async fn test_dispatch_concurrency() {
    let db = &random_db();
    let window = web_sys::window().expect("should have a window in this context");
    let performance = window
        .performance()
        .expect("performance should be available");

    assert_eq!(dispatch(db, "open", "").await.unwrap(), "");
    let txn_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;
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
async fn test_write_concurrency() {
    let db = &random_db();

    dispatch(db, "open", "").await.unwrap();
    let txn_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;
    put(db, txn_id, "value", "1").await;
    commit(db, txn_id).await.unwrap();

    // TODO(nate): Strengthen test to prove these open waits overlap.
    join!(
        async {
            let txn_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
                .await
                .transaction_id;
            let value = get(db, txn_id, "value")
                .await
                .unwrap()
                .parse::<u32>()
                .unwrap();
            put(db, txn_id, "value", &(value + 2).to_string()).await;
            commit(db, txn_id).await.unwrap();
        },
        async {
            let txn_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
                .await
                .transaction_id;
            let value = get(db, txn_id, "value")
                .await
                .unwrap()
                .parse::<u32>()
                .unwrap();
            put(db, txn_id, "value", &(value + 3).to_string()).await;
            commit(db, txn_id).await.unwrap();
        }
    );
    let txn_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;
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
async fn test_get_put_del() {
    let db = &random_db();

    assert_eq!(
        dispatch(db, "put", "{\"k\", \"v\"}").await.unwrap_err(),
        format!("\"{}\" not open", db)
    );
    assert_eq!(dispatch(db, "open", "").await.unwrap(), "");

    // Check request parsing, both missing and unexpected fields.
    assert_eq!(
        dispatch(db, "put", "{}").await.unwrap_err(),
        "InvalidJson(missing field `transactionId` at line 1 column 2)"
    );

    let txn_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;

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
    let txn_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;
    assert_eq!(get(db, txn_id, "Hello").await.unwrap(), "世界");

    // Verify functioning of non-ASCII keys.
    assert_eq!(has(db, txn_id, "你好").await, false);
    assert_eq!(get(db, txn_id, "你好").await, None);
    put(db, txn_id, "你好", "world").await;
    assert_eq!(has(db, txn_id, "你好").await, true);
    assert_eq!(get(db, txn_id, "你好").await, Some("world".into()));

    commit(db, txn_id).await.unwrap();
    let txn_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;
    assert_eq!(has(db, txn_id, "你好").await, true);
    assert_eq!(get(db, txn_id, "你好").await, Some("world".into()));
    abort(db, txn_id).await;

    // Delete a key
    let txn_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;
    assert_eq!(del(db, txn_id, "Hello").await, true);
    assert_eq!(has(db, txn_id, "Hello").await, false);
    assert_eq!(del(db, txn_id, "Hello").await, false);
    commit(db, txn_id).await.unwrap();

    let txn_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;
    assert_eq!(has(db, txn_id, "Hello").await, false);
    abort(db, txn_id).await;

    assert_eq!(dispatch(db, "close", "").await.unwrap(), "");
}

#[wasm_bindgen_test]
async fn test_scan() {
    let db = &random_db();

    dispatch(db, "open", "").await.unwrap();
    let txn_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;

    put(db, txn_id, "foo", "bar").await;
    put(db, txn_id, "foopa", "baz").await;
    put(db, txn_id, "hot", "dog").await;
    put(db, txn_id, "hoota", "daz").await;

    assert_eq!(
        scan(db, txn_id, "", "", 0).await,
        r#"{"items":[{"key":"foo","value":"bar"},{"key":"foopa","value":"baz"},{"key":"hoota","value":"daz"},{"key":"hot","value":"dog"}]}"#
    );
    assert_eq!(
        scan(db, txn_id, "f", "", 0).await,
        r#"{"items":[{"key":"foo","value":"bar"},{"key":"foopa","value":"baz"}]}"#
    );
    assert_eq!(
        scan(db, txn_id, "", "foopa", 0).await,
        r#"{"items":[{"key":"foopa","value":"baz"},{"key":"hoota","value":"daz"},{"key":"hot","value":"dog"}]}"#
    );
    assert_eq!(
        scan(db, txn_id, "", "foopa", 3).await,
        r#"{"items":[{"key":"hot","value":"dog"}]}"#
    );

    abort(db, txn_id).await;
    dispatch(db, "close", "").await.unwrap();
}

#[wasm_bindgen_test]
async fn test_get_root() {
    let db = &random_db();
    assert_eq!(
        format!(r#""{}" not open"#, db),
        dispatch(db, "getRoot", "{}").await.unwrap_err()
    );

    assert_eq!(dispatch(db, "open", "").await.unwrap(), "");
    assert_eq!(
        dispatch(db, "getRoot", "{}").await.unwrap(),
        "{\"root\":\"b3l9pgiide3am771eu08kfgg5sprjs2e\"}"
    );
    let txn_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;
    put(db, txn_id, "foo", "bar").await;
    let _ = commit(db, txn_id).await;
    assert_eq!(
        dispatch(db, "getRoot", "{}").await.unwrap(),
        "{\"root\":\"ug6tod81n4l0fm8ob1iud4hetomibm02\"}"
    );
    assert_eq!(dispatch(db, "close", "").await.unwrap(), "");
}

#[wasm_bindgen_test]
fn test_browser_timer() {
    let timer = rlog::Timer::new().unwrap();
    // Sleep is a PITA so we'll leave it at "it doesn't error".
    timer.elapsed_ms();
}

// We can't run a web server in wasm-in-the-browser so this is the next
// best thing: a manual test that FETCHES OVER THE NETWORK. To run it:
// 1. uncomment the #[wasm_bindgen_test] line
// 2. wasm-pack test --chrome -- --test wasm
// 3. open developer tools in a browser window
// 4. navigate to 127.0.0.1:8000
// 5. verify the request and response by inspection:
//     - method
//     - http headers
//     - outgoing and incoming body
//
//#[wasm_bindgen_test]
#[allow(dead_code)]
async fn test_browser_fetch() {
    let pull_req = sync::PullRequest {
        ..Default::default()
    };
    let http_req = sync::new_pull_http_request(
        &pull_req,
        "https://account-service.rocicorp.now.sh/api/hello",
        "auth",
        "sync_id",
    )
    .unwrap();
    let client = fetch::client::Client::new();
    let resp = client.request(http_req).await.unwrap();
    assert!(resp.body().contains("Well hello to you"));
}

// See note above about wasm fetch tests.
//#[wasm_bindgen_test]
#[allow(dead_code)]
async fn test_browser_fetch_timeout() {
    let req = http::request::Builder::new()
        .method("GET")
        .uri("https://yahoo.com/") // Safe bet it is slow as anything.
        .body(str!(""))
        .unwrap();

    let mut client = fetch::client::Client::new();
    client.timeout = std::time::Duration::from_millis(1);
    let err = client.request(req).await.unwrap_err();
    assert!(to_debug(err).contains("Timeout"));
}
