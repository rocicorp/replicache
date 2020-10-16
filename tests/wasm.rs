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
use serde::de::DeserializeOwned;
use serde::Serialize;
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

// TODO: Can we deserialize back to the original enum?
async fn dispatch<Request, Response>(db: &str, rpc: &str, req: Request) -> Result<Response, String>
where
    Request: Serialize,
    Response: DeserializeOwned,
{
    let req = serde_wasm_bindgen::to_value(&req).unwrap();
    let resp = wasm::dispatch(db.to_string(), rpc.to_string(), req).await;
    resp.map(|v| serde_wasm_bindgen::from_value(v).unwrap())
        .map_err(|e| serde_wasm_bindgen::from_value(e).unwrap())
}

async fn open_transaction(
    db_name: &str,
    fn_name: Option<String>,
    args: Option<serde_json::Value>,
    rebase_opts: Option<RebaseOpts>,
) -> OpenTransactionResponse {
    dispatch(
        db_name,
        "openTransaction",
        &OpenTransactionRequest {
            name: fn_name,
            args: Some(serde_json::to_string(&args).unwrap()),
            rebase_opts: rebase_opts,
        },
    )
    .await
    .unwrap()
}

async fn put(db_name: &str, transaction_id: u32, key: &str, value: &str) {
    let _: PutResponse = dispatch(
        db_name,
        "put",
        &PutRequest {
            transaction_id,
            key: key.to_string(),
            value: value.to_string(),
        },
    )
    .await
    .unwrap();
}

async fn has(db_name: &str, txn_id: u32, key: &str) -> bool {
    let response: HasResponse = dispatch(
        db_name,
        "has",
        &HasRequest {
            transaction_id: txn_id,
            key: key.to_string(),
        },
    )
    .await
    .unwrap();
    response.has
}

async fn get(db_name: &str, txn_id: u32, key: &str) -> Option<String> {
    let response: GetResponse = dispatch(
        db_name,
        "get",
        &GetRequest {
            transaction_id: txn_id,
            key: key.to_string(),
        },
    )
    .await
    .unwrap();
    response.value
}

#[allow(dead_code)]
async fn scan(
    db_name: &str,
    txn_id: u32,
    prefix: &str,
    start_key: &str,
    start_index: u64,
) -> ScanResponse {
    dispatch(
        db_name,
        "scan",
        &ScanRequest {
            transaction_id: txn_id,
            opts: ScanOptions {
                prefix: Some(prefix.to_string()),
                start: Some(ScanBound {
                    key: Some(ScanKey {
                        value: start_key.to_string(),
                        exclusive: false,
                    }),
                    index: Some(start_index),
                }),
                limit: None,
                index_name: None,
            },
        },
    )
    .await
    .unwrap()
}

async fn del(db_name: &str, txn_id: u32, key: &str) -> bool {
    let response: DelResponse = dispatch(
        db_name,
        "del",
        &DelRequest {
            transaction_id: txn_id,
            key: key.to_string(),
        },
    )
    .await
    .unwrap();
    response.had
}

async fn commit(db_name: &str, transaction_id: u32) -> CommitTransactionResponse {
    dispatch(
        db_name,
        "commitTransaction",
        &CommitTransactionRequest { transaction_id },
    )
    .await
    .unwrap()
}

async fn abort(db_name: &str, transaction_id: u32) {
    let _: CloseTransactionResponse = dispatch(
        db_name,
        "closeTransaction",
        &CloseTransactionRequest { transaction_id },
    )
    .await
    .unwrap();
}

#[wasm_bindgen_test]
async fn test_open_close() {
    assert_eq!(
        dispatch::<_, String>("", "debug", "open_dbs")
            .await
            .unwrap(),
        "[]",
    );
    assert_eq!(
        dispatch::<_, String>("", "open", "").await.unwrap_err(),
        "db_name must be non-empty"
    );
    assert_eq!(dispatch::<_, String>("db", "open", "").await.unwrap(), "");
    assert_eq!(
        dispatch::<_, String>("", "debug", "open_dbs")
            .await
            .unwrap(),
        "[\"db\"]"
    );
    assert_eq!(dispatch::<_, String>("db2", "open", "").await.unwrap(), "");
    assert_eq!(
        dispatch::<_, String>("", "debug", "open_dbs")
            .await
            .unwrap(),
        "[\"db\", \"db2\"]",
    );
    assert_eq!(dispatch::<_, String>("db", "close", "").await.unwrap(), "");
    assert_eq!(dispatch::<_, String>("db", "close", "").await.unwrap(), "");
    assert_eq!(
        dispatch::<_, String>("", "debug", "open_dbs")
            .await
            .unwrap(),
        "[\"db2\"]"
    );
    assert_eq!(dispatch::<_, String>("db2", "close", "").await.unwrap(), "");
    assert_eq!(
        dispatch::<_, String>("", "debug", "open_dbs")
            .await
            .unwrap(),
        "[]",
    );
}

#[wasm_bindgen_test]
async fn test_dispatch_concurrency() {
    let db = &random_db();
    let window = web_sys::window().expect("should have a window in this context");
    let performance = window
        .performance()
        .expect("performance should be available");

    assert_eq!(dispatch::<_, String>(db, "open", "").await.unwrap(), "");
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
    assert_eq!(dispatch::<_, String>(db, "close", "").await.unwrap(), "");
    assert_eq!(elapsed_ms >= 100., true);
    assert_eq!(elapsed_ms < 200., true);
}

#[wasm_bindgen_test]
async fn test_write_concurrency() {
    let db = &random_db();

    dispatch::<_, String>(db, "open", "").await.unwrap();
    let txn_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;
    put(db, txn_id, "value", "1").await;
    commit(db, txn_id).await;

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
            commit(db, txn_id).await;
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
            commit(db, txn_id).await;
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

    assert_eq!(dispatch::<_, String>(db, "close", "").await.unwrap(), "");
}

#[wasm_bindgen_test]
async fn test_get_put_del() {
    let db = &random_db();

    assert_eq!(
        dispatch::<_, PutResponse>(
            db,
            "put",
            PutRequest {
                transaction_id: 42,
                key: str!("unused"),
                value: str!("unused"),
            }
        )
        .await
        .unwrap_err(),
        format!("\"{}\" not open", db)
    );
    assert_eq!(dispatch::<_, String>(db, "open", "").await.unwrap(), "");

    let txn_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;

    assert_eq!(get(db, txn_id, "Hello").await, None);

    // Simple put then get test.
    // TODO(nate): Resolve how to pass non-UTF-8 sequences through the API.
    put(db, txn_id, "Hello", "世界").await;
    assert_eq!(get(db, txn_id, "Hello").await.unwrap(), "世界");
    commit(db, txn_id).await;

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

    commit(db, txn_id).await;
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
    commit(db, txn_id).await;

    let txn_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;
    assert_eq!(has(db, txn_id, "Hello").await, false);
    abort(db, txn_id).await;

    assert_eq!(dispatch::<_, String>(db, "close", "").await.unwrap(), "");
}

#[wasm_bindgen_test]
async fn test_index() {
    let db = &random_db();
    assert_eq!(dispatch::<_, String>(db, "open", "").await.unwrap(), "");

    let transaction_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;
    dispatch::<_, CreateIndexResponse>(
        db,
        "createIndex",
        CreateIndexRequest {
            transaction_id,
            name: str!("idx1"),
            key_prefix: str!("b"),
            json_pointer: str!("/s"),
        },
    )
    .await
    .unwrap();
    commit(db, transaction_id).await;

    // Ensure we can't create an index of the same name with different definition.
    let transaction_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;
    let response = dispatch::<_, CreateIndexResponse>(
        db,
        "createIndex",
        CreateIndexRequest {
            transaction_id,
            name: str!("idx1"),
            key_prefix: str!("DIFFERENT"),
            json_pointer: str!("/ALSO-DIFFERENT"),
        },
    )
    .await
    .unwrap_err();
    assert_eq!("DBError(IndexExistsWithDifferentDefinition)", response);
    abort(db, transaction_id).await;

    // TODO ensure the index can be used.

    // Check that drop works.
    let transaction_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;
    dispatch::<_, DropIndexResponse>(
        db,
        "dropIndex",
        DropIndexRequest {
            transaction_id,
            name: str!("idx1"),
        },
    )
    .await
    .unwrap();
    commit(db, transaction_id).await;

    // TODO ensure that index can NOT be used.

    // Check that dropping a non-existent index errors.
    let transaction_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;
    let result = dispatch::<_, DropIndexResponse>(
        db,
        "dropIndex",
        DropIndexRequest {
            transaction_id,
            name: str!("idx1"),
        },
    )
    .await
    .unwrap_err();
    assert_eq!(str!("DBError(NoSuchIndexError(\"idx1\"))"), result);
    abort(db, transaction_id).await;

    assert_eq!(dispatch::<_, String>(db, "close", "").await.unwrap(), "");
}

/*
TODO: Figure out how to re-enable this test. We still have coverage at JS SDK level luckily.
#[wasm_bindgen_test]
async fn test_scan() {
    let db = &random_db();

    dispatch::<_, String>(db, "open", "").await.unwrap();
    let txn_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;

    put(db, txn_id, "foo", "bar").await;
    put(db, txn_id, "foopa", "baz").await;
    put(db, txn_id, "hot", "dog").await;
    put(db, txn_id, "hoota", "daz").await;

    assert_eq!(
        scan(db, txn_id, "", "", 0).await,
        ScanResponse {
            items: vec![
                ScanItem {
                    key: str!("foo"),
                    value: str!("bar"),
                },
                ScanItem {
                    key: str!("foopa"),
                    value: str!("baz"),
                },
                ScanItem {
                    key: str!("hoota"),
                    value: str!("daz"),
                },
                ScanItem {
                    key: str!("hot"),
                    value: str!("dog"),
                }
            ]
        }
    );
    assert_eq!(
        scan(db, txn_id, "f", "", 0).await,
        ScanResponse {
            items: vec![
                ScanItem {
                    key: str!("foo"),
                    value: str!("bar"),
                },
                ScanItem {
                    key: str!("foopa"),
                    value: str!("baz"),
                },
            ]
        }
    );
    assert_eq!(
        scan(db, txn_id, "", "foopa", 0).await,
        ScanResponse {
            items: vec![
                ScanItem {
                    key: str!("foopa"),
                    value: str!("baz"),
                },
                ScanItem {
                    key: str!("hoota"),
                    value: str!("daz"),
                },
                ScanItem {
                    key: str!("hot"),
                    value: str!("dog"),
                }
            ]
        }
    );
    assert_eq!(
        scan(db, txn_id, "", "foopa", 3).await,
        ScanResponse {
            items: vec![ScanItem {
                key: str!("hot"),
                value: str!("dog"),
            }]
        }
    );

    abort(db, txn_id).await;
    dispatch::<_, String>(db, "close", "").await.unwrap();
}
*/

#[wasm_bindgen_test]
async fn test_get_root() {
    let db = &random_db();
    assert_eq!(
        format!(r#""{}" not open"#, db),
        dispatch::<_, GetRootResponse>(db, "getRoot", &GetRootRequest { head_name: None })
            .await
            .unwrap_err()
    );

    assert_eq!(dispatch::<_, String>(db, "open", "").await.unwrap(), "");
    assert_eq!(
        dispatch::<_, GetRootResponse>(db, "getRoot", &GetRootRequest { head_name: None })
            .await
            .unwrap(),
        GetRootResponse {
            root: str!("20cpm833c2tlc3je6uhn7vs8s3h8cg5d"),
        }
    );
    let txn_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;
    put(db, txn_id, "foo", "bar").await;
    let _ = commit(db, txn_id).await;
    assert_eq!(
        dispatch::<_, GetRootResponse>(db, "getRoot", GetRootRequest { head_name: None })
            .await
            .unwrap(),
        GetRootResponse {
            root: str!("5taaq6eg55rmpvbqv6fog2mpmbodjui0"),
        }
    );
    assert_eq!(dispatch::<_, String>(db, "close", "").await.unwrap(), "");
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
