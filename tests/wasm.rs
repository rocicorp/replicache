#![recursion_limit = "512"]

use futures::join;
use rand::Rng;
use replicache_client::db::ScanOptions;
use replicache_client::sync;
use replicache_client::util::rlog;
use replicache_client::util::to_debug;
use replicache_client::wasm;
use replicache_client::{embed::types::*, util::wasm::global_property};
#[allow(unused_imports)]
use replicache_client::{fetch, util::uuid::make_random_numbers};
use serde::de::DeserializeOwned;
use serde::Serialize;
use serde_json::json;
use std::cell::RefCell;
use std::rc::Rc;
use std::sync::atomic::{AtomicU32, Ordering};
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

async fn open_index_transaction(db_name: &str) -> OpenIndexTransactionResponse {
    dispatch(
        db_name,
        "openIndexTransaction",
        &OpenIndexTransactionRequest {},
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
    start_secondary_key: Option<&str>,
    start_key: Option<&str>,
    exclusive: bool,
    index_name: Option<&str>,
    receiver: js_sys::Function,
) -> ScanResponse {
    dispatch_with_scan_receiver(
        db_name,
        "scan",
        ScanRequest {
            transaction_id: txn_id,
            opts: ScanOptions {
                prefix: Some(prefix.to_string()),
                start_secondary_key: start_secondary_key.map(|s| s.to_string()),
                start_key: start_key.map(|s| s.to_string()),
                start_exclusive: Some(exclusive),
                limit: None,
                index_name: index_name.map(|s| s.into()),
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
async fn test_concurrency_within_a_read_tx() {
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
            // Note: could use atomic counters if we wanted, see
            // test_read_txs_do_run_concurrently.
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
// TODO if/when we have a rust version of dispatch again we should have a much
// cleaner version of this test there (eg, no spin hack, greater concurrency).
async fn test_write_txs_dont_run_concurrently() {
    let db = &random_db();

    dispatch::<_, String>(db, "open", "").await.unwrap();
    let txn_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;
    put(db, txn_id, "value", "0").await;
    commit(db, txn_id).await;

    // To verify that write transactions don't overlap we start parallel tasks that
    // increment an atomic counter when they begin and decrement it just before they
    // complete. If any task reads a value other than zero when it starts or a value
    // other than 1 when it completes there are overlapping transactions. For extra
    // assurance we also add to a value in the db itself and verify it has the expected
    // result.
    let counter = AtomicU32::new(0);
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
            // Note that we increment after the get() completes to ensure we really are
            // inside of the transaction. One could imagine an implementation of open_transaction
            // that returns before the transaction has actually started.
            assert_eq!(0, counter.fetch_add(1, Ordering::SeqCst));
            get(db, txn_id, "spin20").await; // Spins cpu *and yields* for ~20ms
            put(db, txn_id, "value", &(value + 1).to_string()).await;
            // Asserting not strictly required but easy so why not:
            assert_eq!(1, counter.fetch_sub(1, Ordering::SeqCst));
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
            assert_eq!(0, counter.fetch_add(1, Ordering::SeqCst));
            get(db, txn_id, "spin20").await;
            put(db, txn_id, "value", &(value + 2).to_string()).await;
            assert_eq!(1, counter.fetch_sub(1, Ordering::SeqCst));
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
            assert_eq!(0, counter.fetch_add(1, Ordering::SeqCst));
            get(db, txn_id, "spin20").await;
            put(db, txn_id, "value", &(value + 3).to_string()).await;
            assert_eq!(1, counter.fetch_sub(1, Ordering::SeqCst));
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
async fn test_read_txs_do_run_concurrently() {
    let db = &random_db();

    dispatch::<_, String>(db, "open", "").await.unwrap();
    let txn_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;
    put(db, txn_id, "value", "42").await;
    commit(db, txn_id).await;

    // To verify that read transactions do overlap we start two parallel tasks that
    // increment an same atomic counter when they begin. If when one begins the
    // task sees the counter with value 0 then it decrements the counter when it exits.
    // If when one begins and it sees the counter with value 1 then it does not decrement the
    // counter when it exits. Execution is parallel if after both are finished the counter
    // is > 0.
    let counter = AtomicU32::new(0);
    join!(
        async {
            let txn_id = open_transaction(db, None, None, None).await.transaction_id;
            let value = get(db, txn_id, "value")
                .await
                .unwrap()
                .parse::<u32>()
                .unwrap();
            assert_eq!(42, value);
            // Note that we increment after the get() completes to ensure we really are
            // inside of the transaction. One could imagine an implementation of open_transaction
            // that returns before the transaction has actually started.
            let other_tasks_running = counter.fetch_add(1, Ordering::SeqCst);
            get(db, txn_id, "spin20").await; // Spins cpu *and yields* for ~20ms
            let value = get(db, txn_id, "value")
                .await
                .unwrap()
                .parse::<u32>()
                .unwrap();
            assert_eq!(42, value);
            if other_tasks_running > 0 {
                counter.fetch_sub(1, Ordering::SeqCst);
            }
            abort(db, txn_id).await;
        },
        async {
            let txn_id = open_transaction(db, None, None, None).await.transaction_id;
            let value = get(db, txn_id, "value")
                .await
                .unwrap()
                .parse::<u32>()
                .unwrap();
            assert_eq!(42, value);
            let other_tasks_running = counter.fetch_add(1, Ordering::SeqCst);
            get(db, txn_id, "spin20").await;
            let value = get(db, txn_id, "value")
                .await
                .unwrap()
                .parse::<u32>()
                .unwrap();
            assert_eq!(42, value);
            if other_tasks_running > 0 {
                counter.fetch_sub(1, Ordering::SeqCst);
            }
            abort(db, txn_id).await;
        },
    );
    assert!(counter.into_inner() > 0);

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
async fn test_create_drop_index() {
    let db = &random_db();
    assert_eq!(dispatch::<_, String>(db, "open", "").await.unwrap(), "");

    let transaction_id = open_index_transaction(db).await.transaction_id;
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
    let transaction_id = open_index_transaction(db).await.transaction_id;
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

    // Ensure the index can be used: insert a value and ensure it scans.
    let transaction_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;
    put(db, transaction_id, "boo", r#"{"s": "foo"}"#).await;
    commit(db, transaction_id).await;
    let transaction_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;
    let expected = vec![(str!("boo"), str!("foo"), str!(r#"{"s": "foo"}"#))];
    {
        let (receive, _cb, got) = new_test_scan_receiver();
        scan(
            db,
            transaction_id,
            "",
            None,
            Some(""),
            false,
            Some("idx1"),
            receive,
        )
        .await;
        assert_eq!(&expected, &*got.borrow());
    }
    abort(db, transaction_id).await;

    // Check that drop works.
    let transaction_id = open_index_transaction(db).await.transaction_id;
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

    // Ensure the index cannot be used.
    let transaction_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
        .await
        .transaction_id;
    {
        let (receive, _cb, _got) = new_test_scan_receiver();
        let scan_result: Result<ScanResponse, String> = dispatch_with_scan_receiver(
            db,
            "scan",
            ScanRequest {
                transaction_id,
                opts: ScanOptions {
                    prefix: None,
                    start_secondary_key: None,
                    start_key: None,
                    start_exclusive: None,
                    limit: None,
                    index_name: Some(str!("idx1")),
                },
                receiver: None,
            },
            Some(receive),
        )
        .await;
        assert_eq!(
            "ScanError(UnknownIndexName(\"idx1\"))",
            &scan_result.unwrap_err()
        );
    }
    abort(db, transaction_id).await;

    // Check that dropping a non-existent index errors.
    let transaction_id = open_index_transaction(db).await.transaction_id;
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
        exclusive: bool,
        expected: Vec<(&str, &str, &str)>,
    ) {
        let expected: Vec<(String, String, String)> = expected
            .iter()
            .map(|v| (str!(v.0), str!(v.1), str!(v.2)))
            .collect();

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
        scan(
            db,
            txn_id,
            prefix,
            None,
            Some(start_key),
            exclusive,
            None,
            receive,
        )
        .await;
        assert_eq!(&expected, &*got.borrow());

        abort(db, txn_id).await;
        dispatch::<_, String>(db, "close", "").await.unwrap();
    }

    // db is empty
    test(vec![], false, "", "", false, vec![]).await;

    // one entry
    //  TODO these values are not json
    test(
        vec![("foo", "bar")],
        false,
        "",
        "",
        false,
        vec![("foo", "", "bar")],
    )
    .await;
    test(
        vec![("foo", "bar")],
        true,
        "",
        "",
        false,
        vec![("foo", "", "bar")],
    )
    .await;
    test(
        vec![("foo", "bar")],
        true,
        "f",
        "",
        false,
        vec![("foo", "", "bar")],
    )
    .await;
    test(
        vec![("foo", "bar")],
        true,
        "foo",
        "",
        false,
        vec![("foo", "", "bar")],
    )
    .await;
    test(vec![("foo", "bar")], true, "nomatch", "", false, vec![]).await;

    // several entries
    let entries = vec![("c", "cv"), ("aa", "aav"), ("a", "av"), ("b", "bv")];
    let expected = vec![
        ("a", "", "av"),
        ("aa", "", "aav"),
        ("b", "", "bv"),
        ("c", "", "cv"),
    ];
    test(entries.clone(), false, "", "", false, expected.clone()).await;
    test(entries.clone(), true, "", "", false, expected.clone()).await;
    // start_key
    test(
        entries.clone(),
        false,
        "",
        "b",
        false,
        expected[2..].to_vec(),
    )
    .await;
    // exclusive
    test(entries.clone(), false, "", "", true, expected[..].to_vec()).await;
    test(
        entries.clone(),
        false,
        "",
        "a",
        true,
        expected[1..].to_vec(),
    )
    .await;
    test(
        entries.clone(),
        false,
        "",
        "b",
        true,
        expected[3..].to_vec(),
    )
    .await;
    test(
        entries.clone(),
        false,
        "",
        "bb",
        true,
        expected[3..].to_vec(),
    )
    .await;
}

#[wasm_bindgen_test]
async fn test_scan_with_index() {
    // Op is a thing we might do in the test after creating the index.
    enum Op {
        None,
        Del(String),
        Put((String, String)),
    }

    async fn test<'a>(
        entries: Vec<(&str, &str)>, // populate the db initially with these (k,v) pairs
        key_prefix: &str,           // parameter to CreateIndex
        json_pointer: &str,         // parameter to CreateIndex
        op: Op, // op if any to perform after index is created, before we scan with it
        scan_in_write_txn: bool, // run the scan in the tx that creates the index, vs in a separate one
        prefix: &str,            // scan prefix
        start_secondary_key: &str, // scan start_secondary_key
        start_key: Option<&str>, // scan start_key
        exclusive: bool,         // scan start_exclusive
        expected: Vec<(&str, &str, &str)>, // expected results of the scan
    ) {
        let index_name = str!("idx1");
        let expected: Vec<(String, String, String)> = expected
            .iter()
            .map(|v| (str!(v.0), str!(v.1), str!(v.2)))
            .collect();

        let db = &random_db();
        dispatch::<_, String>(db, "open", "").await.unwrap();
        let txn_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
            .await
            .transaction_id;
        for entry in entries {
            put(db, txn_id, entry.0, entry.1).await;
        }
        commit(db, txn_id).await;

        dispatch::<_, String>(db, "open", "").await.unwrap();
        let txn_id = open_index_transaction(db).await.transaction_id;
        dispatch::<_, CreateIndexResponse>(
            db,
            "createIndex",
            CreateIndexRequest {
                transaction_id: txn_id,
                name: index_name.clone(),
                key_prefix: key_prefix.into(),
                json_pointer: json_pointer.into(),
            },
        )
        .await
        .unwrap();
        commit(db, txn_id).await;

        let mut txn_id = open_transaction(db, "foo".to_string().into(), Some(json!([])), None)
            .await
            .transaction_id;
        match op {
            Op::None => {}
            Op::Del(key) => {
                del(db, txn_id, &key).await;
            }
            Op::Put((key, val)) => put(db, txn_id, &key, &val).await,
        }

        if !scan_in_write_txn {
            commit(db, txn_id).await;
            txn_id = open_transaction(db, None, None, None).await.transaction_id;
        }

        let (receive, _cb, got) = new_test_scan_receiver();
        scan(
            db,
            txn_id,
            prefix,
            Some(start_secondary_key),
            start_key,
            exclusive,
            Some(&index_name),
            receive,
        )
        .await;
        assert_eq!(&expected, &*got.borrow());

        abort(db, txn_id).await;
        dispatch::<_, String>(db, "close", "").await.unwrap();
    }

    // Scan an empty db
    test(vec![], "", "", Op::None, false, "", "", None, false, vec![]).await;

    // Ensure empty key is OK
    let bools = vec![false, true];
    for in_txn in bools.iter() {
        test(
            vec![("", r#""value""#)],
            "",
            "",
            Op::None,
            *in_txn,
            "",
            "",
            None,
            false,
            vec![("", "value", r#""value""#)],
        )
        .await;
    }

    // Test the various levers of the scan interface when used with an index...
    for in_txn in bools.iter() {
        // Scan all indexed values
        test(
            vec![("key", r#""value""#)],
            "",
            "",
            Op::None,
            *in_txn,
            "",
            "",
            None,
            false,
            vec![("key", "value", r#""value""#)],
        )
        .await;
        // Scan an indexed array
        test(
            vec![("key", r#"{"s": ["value1", "value2"]}"#)],
            "",
            "/s",
            Op::None,
            *in_txn,
            "",
            "",
            None,
            false,
            vec![
                ("key", "value1", r#"{"s": ["value1", "value2"]}"#),
                ("key", "value2", r#"{"s": ["value1", "value2"]}"#),
            ],
        )
        .await;
        // indexes is on key prefix that is not present
        test(
            vec![("key", r#""value""#)],
            "nomatch",
            "",
            Op::None,
            *in_txn,
            "",
            "",
            None,
            false,
            vec![],
        )
        .await;
        // index is on a value the entry doesn't have
        test(
            vec![("key", r#""value""#)],
            "",
            "/nosuch",
            Op::None,
            *in_txn,
            "",
            "",
            None,
            false,
            vec![],
        )
        .await;
        // scan prefix matches beginning of indexed value
        test(
            vec![("key", r#""value""#)],
            "",
            "",
            Op::None,
            *in_txn,
            "v",
            "",
            None,
            false,
            vec![("key", "value", r#""value""#)],
        )
        .await;
        // scan prefix exactly matches indexed value
        test(
            vec![("key", r#""value""#)],
            "",
            "",
            Op::None,
            *in_txn,
            "value",
            "",
            None,
            false,
            vec![("key", "value", r#""value""#)],
        )
        .await;
        // scan prefix does not match indexed value
        test(
            vec![("key", r#""value""#)],
            "",
            "",
            Op::None,
            *in_txn,
            "nomatch",
            "",
            None,
            false,
            vec![],
        )
        .await;
        // scan start key matches beginning of indexed value
        test(
            vec![("key", r#""value""#)],
            "",
            "",
            Op::None,
            *in_txn,
            "",
            "v",
            None,
            false,
            vec![("key", "value", r#""value""#)],
        )
        .await;
        // scan start key matches indexed value
        test(
            vec![("key", r#""value""#)],
            "",
            "",
            Op::None,
            *in_txn,
            "",
            "value",
            None,
            false,
            vec![("key", "value", r#""value""#)],
        )
        .await;
        // scan start key does not match indexed value
        test(
            vec![("key", r#""beforenomatch""#)],
            "",
            "",
            Op::None,
            *in_txn,
            "",
            "nomatch",
            None,
            false,
            vec![],
        )
        .await;

        // test using exclusive
        let entries = vec![
            ("a", r#"{"s": "a"}"#),
            ("aa", r#"{"s": "aa"}"#),
            ("bb", r#"{"s": "bb"}"#),
        ];
        let expected = vec![
            ("a", "a", r#"{"s": "a"}"#),
            ("aa", "aa", r#"{"s": "aa"}"#),
            ("bb", "bb", r#"{"s": "bb"}"#),
        ];
        test(
            entries.clone(),
            "",
            "/s",
            Op::None,
            *in_txn,
            "",
            "",
            None,
            true,
            expected[..].to_vec(),
        )
        .await;
        test(
            entries.clone(),
            "",
            "/s",
            Op::None,
            *in_txn,
            "",
            "a",
            None,
            true,
            expected[1..].to_vec(),
        )
        .await;
    }

    // Test that index track puts and dels.
    for in_txn in bools.iter() {
        // del a value
        test(
            vec![("key", r#""value""#)],
            "",
            "",
            Op::Del(str!("key")),
            *in_txn,
            "",
            "",
            None,
            false,
            vec![],
        )
        .await;
        // put new value
        test(
            vec![],
            "",
            "",
            Op::Put((str!("key"), str!(r#""value""#))),
            *in_txn,
            "",
            "",
            None,
            false,
            vec![("key", "value", r#""value""#)],
        )
        .await;
        // replace a value
        test(
            vec![("key", r#"{"s": "value"}"#)],
            "",
            "/s",
            Op::Put((str!("key"), str!(r#"{"s": "NEW"}"#))),
            *in_txn,
            "",
            "",
            None,
            false,
            vec![("key", "NEW", r#"{"s": "NEW"}"#)],
        )
        .await;
    }

    // Ensure when there are multiple identical values they sort on primary key
    let entries = vec![
        ("key1", r#"{"s": "value2"}"#),
        ("key11", r#"{"s": "value3"}"#),
        ("key2", r#""nomatch""#),
        ("key", r#"{"s": "value1"}"#),
    ];
    let expected = vec![
        ("key", "value1", r#"{"s": "value1"}"#),
        ("key1", "value2", r#"{"s": "value2"}"#),
        ("key11", "value3", r#"{"s": "value3"}"#),
    ];
    test(
        entries,
        "",
        "/s",
        Op::None,
        false,
        "",
        "",
        None,
        false,
        expected,
    )
    .await;

    // Use both start_secondary_key and start_key
    let entries = vec![
        ("key1", r#"{"s": "value1"}"#),
        ("key11", r#"{"s": "value1"}"#),
        ("key2", r#""nomatch""#),
        ("key", r#"{"s": "value1"}"#),
    ];
    let expected = vec![
        ("key", "value1", r#"{"s": "value1"}"#),
        ("key1", "value1", r#"{"s": "value1"}"#),
        ("key11", "value1", r#"{"s": "value1"}"#),
    ];
    test(
        entries.clone(),
        "",
        "/s",
        Op::None,
        false,
        "",
        "value1",
        Some(""),
        false,
        expected.clone(),
    )
    .await;
    test(
        entries.clone(),
        "",
        "/s",
        Op::None,
        false,
        "",
        "value1",
        Some("key"),
        false,
        expected.clone(),
    )
    .await;
    test(
        entries.clone(),
        "",
        "/s",
        Op::None,
        false,
        "",
        "value1",
        Some("key"),
        true,
        (expected.clone())[1..].to_vec(),
    )
    .await;
}

// new_test_scan_receiver is a helper for scan tests. Scan requires a js_sys::Function to send
// results to and this function provides it and a collection of scan results sent by scan.
// Returns:
//  - a js_sys::Function that can be passed to scan() to receive scanned items: (key, primary_key, value) tuples
//  - a wasm_bindgen Closure that must be dropped after scan() returns to avoid leaks
//  - a shared pointer to the vector where the scanned (key, value) tuples are stored
fn new_test_scan_receiver() -> (
    js_sys::Function,
    Closure<dyn FnMut(JsValue, JsValue, JsValue) -> Result<JsValue, JsValue>>,
    Rc<RefCell<Vec<(String, String, String)>>>,
) {
    // got_scan_items holds (key, Option<secondary_key>, value) tuples received from scan. It is
    // wrapped in an Rc because Closure otherwise requires a 'static lifetime. It is wrapped
    // in a RefCell to allow the closure to mutate the contents: borrow checker can't prove
    // closure's access is safe, but we know it is, so this moves the check to runtime.
    let got_scan_items: Rc<RefCell<Vec<(String, String, String)>>> =
        Rc::new(RefCell::new(Vec::new()));

    // receiver is passed to dispatch and receives scan items one at a time from scan(). It stores
    // them in got_scan_items for later inspection.
    //
    // Note: it is a mystery to me how do_scan passes &JsValues to receiver.call3() but the
    // closure below that receives them takes JsValues. It works fine. (Note we can't take
    // &JsValues here because &JsValue does not implement FromWasmAbi.)
    let closure_got_scan_items = got_scan_items.clone();
    let receiver = move |pk: JsValue, sk: JsValue, v: JsValue| -> Result<JsValue, JsValue> {
        let primary_key = pk.as_string().unwrap();
        let secondary_key = sk.as_string().unwrap();
        let v: js_sys::Uint8Array = v.into();
        let val = String::from_utf8(v.to_vec()).unwrap();
        closure_got_scan_items
            .borrow_mut()
            .push((primary_key, secondary_key, val));

        Ok(JsValue::from_str("ignored"))
    };
    let receiver_closure =
        Closure::wrap(Box::new(receiver)
            as Box<
                dyn FnMut(JsValue, JsValue, JsValue) -> Result<JsValue, JsValue>,
            >);
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
            root: str!("3hjt1p4m1emdttgrii2p0o3te1kt8rhv"),
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
            root: str!("8tnlpltjbt23hc0v8h3td7ssflsnot84"),
        }
    );
    assert_eq!(dispatch::<_, String>(db, "close", "").await.unwrap(), "");
}

#[wasm_bindgen_test]
async fn test_set_log_level() {
    let level = log::max_level();
    let db = &random_db();
    assert_eq!(dispatch::<_, String>(db, "open", "").await.unwrap(), "");

    assert_ne!(log::LevelFilter::Error, level);
    dispatch::<_, SetLogLevelResponse>(
        db,
        "setLogLevel",
        SetLogLevelRequest {
            level: str!("error"),
        },
    )
    .await
    .unwrap();
    assert_eq!(log::LevelFilter::Error, log::max_level());

    let response = dispatch::<_, SetLogLevelResponse>(
        db,
        "setLogLevel",
        SetLogLevelRequest {
            level: str!("BOOM"),
        },
    )
    .await
    .unwrap_err();
    assert_eq!("UnknownLogLevel(\"BOOM\")", response);
    assert_eq!(log::LevelFilter::Error, log::max_level());

    log::set_max_level(level);
    dispatch::<_, String>(db, "close", "").await.unwrap();
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

#[wasm_bindgen_test]
async fn test_make_random_numbers() {
    // Just testing that it doesn't return error...
    let mut numbers = [0u8; 4];
    make_random_numbers(&mut numbers).unwrap();
}
