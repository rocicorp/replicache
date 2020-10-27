#![recursion_limit = "256"]

use futures::join;
use rand::Rng;
#[allow(unused_imports)]
use replicache_client::fetch;
use replicache_client::sync;
use replicache_client::util::rlog;
use replicache_client::util::to_debug;
use replicache_client::wasm;
use replicache_client::{embed::types::*, util::wasm::global_property};
use serde::de::DeserializeOwned;
use serde::Serialize;
use serde_json::json;
use std::cell::RefCell;
use std::rc::Rc;
use str_macro::str;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
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
    dispatch_with_scan_receiver(db, rpc, req, None).await
}

async fn dispatch_with_scan_receiver<Request, Response>(
    db: &str,
    rpc: &str,
    req: Request,
    scan_receiver: Option<js_sys::Function>,
) -> Result<Response, String>
where
    Request: Serialize,
    Response: DeserializeOwned,
{
    let req = serde_wasm_bindgen::to_value(&req).unwrap();
    // Ick, the receiver is part of the original ScanRequest, but it's lost when
    // the request because a Request: Serialize, so we have to pass it in separately.
    if scan_receiver.is_some() {
        let receiver_jsvalue: JsValue = scan_receiver.into();
        js_sys::Reflect::set(&req, &JsValue::from_str("receiver"), &receiver_jsvalue).unwrap();
    }
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
    receiver: js_sys::Function,
) -> ScanResponse {
    dispatch_with_scan_receiver(
        db_name,
        "scan",
        ScanRequest {
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
            receiver: None,
        },
        Some(receiver),
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
    let performance = global_property::<web_sys::Performance>("performance")
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

// Note: db::scan() is unit tested alongside its implementation in db. These
// dispatch tests here should probably not be exhaustive.
#[wasm_bindgen_test]
async fn test_scan() {
    async fn test(
        entries: Vec<(&str, &str)>,
        scan_in_write_txn: bool,
        prefix: &str,
        start_key: &str,
        start_index: u64,
        expected: Vec<(&str, &str)>,
    ) {
        let expected: Vec<(String, String)> =
            expected.iter().map(|v| (str!(v.0), str!(v.1))).collect();

        let db = &random_db();
        dispatch::<_, String>(db, "open", "").await.unwrap();
        let mut txn_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
            .await
            .transaction_id;

        for entry in entries {
            put(db, txn_id, entry.0, entry.1).await;
        }

        if !scan_in_write_txn {
            commit(db, txn_id).await;
            txn_id = open_transaction(db, None, None, None).await.transaction_id;
        }

        let (receive, _cb, got) = new_test_scan_receiver();
        scan(db, txn_id, prefix, start_key, start_index, receive).await;
        assert_eq!(&expected, &*got.borrow());

        abort(db, txn_id).await;
        dispatch::<_, String>(db, "close", "").await.unwrap();
    }

    // db is empty
    test(vec![], false, "", "", 0, vec![]).await;

    // one entry
    test(vec![("foo", "bar")], false, "", "", 0, vec![("foo", "bar")]).await;
    test(vec![("foo", "bar")], true, "", "", 0, vec![("foo", "bar")]).await;
    test(vec![("foo", "bar")], true, "f", "", 0, vec![("foo", "bar")]).await;
    test(
        vec![("foo", "bar")],
        true,
        "foo",
        "",
        0,
        vec![("foo", "bar")],
    )
    .await;
    test(vec![("foo", "bar")], true, "nomatch", "", 0, vec![]).await;

    // several entries
    let entries = vec![("c", "cv"), ("aa", "aav"), ("a", "av"), ("b", "bv")];
    let expected = vec![("a", "av"), ("aa", "aav"), ("b", "bv"), ("c", "cv")];
    test(entries.clone(), false, "", "", 0, expected.clone()).await;
    test(entries.clone(), true, "", "", 0, expected.clone()).await;
    // start_key
    test(entries.clone(), false, "", "b", 0, expected[2..].to_vec()).await;
    // start_index
    test(entries.clone(), false, "", "", 2, expected[2..].to_vec()).await;
    test(entries.clone(), false, "", "", 100, vec![]).await;
    // start_key && start_index
    // Note: start_index is wrt the prefix, not the start key.
    test(entries.clone(), false, "", "aa", 2, expected[2..].to_vec()).await;
}

// new_test_scan_receiver is a helper for scan tests. Scan requires a js_sys::Function to send
// results to and this function provides it and a collection of scan results sent by scan.
// Returns:
//  - a js_sys::Function that can be passed to scan() to receive scanned items: (key, value) tuples
//  - a wasm_bindgen Closure that must be dropped after scan() returns to avoid leaks
//  - a shared pointer to the vector where the scanned (key, value) tuples are stored
fn new_test_scan_receiver() -> (
    js_sys::Function,
    Closure<dyn FnMut(JsValue, JsValue) -> Result<JsValue, JsValue>>,
    Rc<RefCell<Vec<(String, String)>>>,
) {
    // got_scan_items holds (key, value) tuples received from scan. It is wrapped in an Rc because
    // Closure otherwise requires a 'static lifetime. It is wrapped in a RefCell to allow the closure to
    // mutate the contents: borrow checker can't prove closure's access is safe, but we know it is,
    // so this moves the check to runtime.
    let got_scan_items: Rc<RefCell<Vec<(String, String)>>> = Rc::new(RefCell::new(Vec::new()));

    // receiver is passed to dispatch and receives scan items one at a time from scan(). It stores
    // them in got_scan_items for later inspection.
    //
    // Note: it is a mystery to me how do_scan passes &JsValues to receiver.call2() but the
    // closure below that receives them takes JsValues. It works fine. (Note we can't take
    // &JsValues here because &JsValue does not implement FromWasmAbi.)
    let closure_got_scan_items = got_scan_items.clone();
    let receiver = move |k: JsValue, v: JsValue| -> Result<JsValue, JsValue> {
        let key = k.as_string().unwrap();
        let v: js_sys::Uint8Array = v.into();
        let val = String::from_utf8(v.to_vec()).unwrap();
        closure_got_scan_items.borrow_mut().push((key, val));

        Ok(JsValue::from_str("ignored"))
    };
    let receiver_closure = Closure::wrap(
        Box::new(receiver) as Box<dyn FnMut(JsValue, JsValue) -> Result<JsValue, JsValue>>
    );
    let receiver_js_fn_ref: &js_sys::Function = receiver_closure.as_ref().unchecked_ref();
    let receiver_js_fn: js_sys::Function = receiver_js_fn_ref.to_owned();

    (receiver_js_fn, receiver_closure, got_scan_items)
}

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
