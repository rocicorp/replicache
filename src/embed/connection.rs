use super::dispatch::Request;
use super::types::*;
use crate::dag;
use crate::db;
use async_fn::AsyncFn2;
use async_std::stream::StreamExt;
use async_std::sync::{Receiver, RecvError, RwLock};
use futures::stream::futures_unordered::FuturesUnordered;
use log::warn;
use nanoserde::{DeJson, SerJson};
use std::collections::HashMap;
use std::sync::atomic::{AtomicU32, Ordering};

lazy_static! {
    static ref TRANSACTION_COUNTER: AtomicU32 = AtomicU32::new(1);
}

type TxnMap<'a> = RwLock<HashMap<u32, RwLock<db::Write<'a>>>>;

fn deserialize<T: DeJson>(data: &str) -> Result<T, String> {
    match DeJson::deserialize_json(data) {
        Ok(v) => Ok(v),
        Err(e) => Err(format!("InvalidJson({})", e)),
    }
}

enum UnorderedResult {
    Request(Result<Request, RecvError>),
    Stop(),
    None(),
}

async fn connection_future<'a, 'b>(
    rx: &Receiver<Request>,
    store: &'a dag::Store,
    txns: &'b TxnMap<'a>,
    request: Option<Request>,
) -> UnorderedResult {
    let req = match request {
        None => return UnorderedResult::Request(rx.recv().await),
        Some(v) => v,
    };
    match req.rpc.as_str() {
        "has" => execute(do_has, txns, req).await,
        "get" => execute(do_get, txns, req).await,
        "put" => execute(do_put, txns, req).await,
        "openTransaction" => do_open(store, txns, req).await,
        "commitTransaction" => do_commit(txns, req).await,
        "closeTransaction" => do_abort(txns, req).await,
        "close" => {
            req.response.send(Ok("".into())).await;
            return UnorderedResult::Stop();
        }
        _ => {
            req.response
                .send(Err(format!("Unsupported rpc name {}", req.rpc)))
                .await
        }
    };
    UnorderedResult::None()
}

pub async fn process(store: dag::Store, rx: Receiver<Request>) {
    let txns = RwLock::new(HashMap::new());
    let mut futures = FuturesUnordered::new();
    let mut recv = true;

    futures.push(connection_future(&rx, &store, &txns, None));
    while let Some(value) = futures.next().await {
        if recv {
            futures.push(connection_future(&rx, &store, &txns, None));
        }
        match value {
            UnorderedResult::Request(value) => match value {
                Err(why) => warn!("Dispatch loop recv failed: {}", why),
                Ok(req) => {
                    futures.push(connection_future(&rx, &store, &txns, Some(req)));
                }
            },
            UnorderedResult::Stop() => recv = false,
            UnorderedResult::None() => {}
        }
    }
}

async fn execute<T, F>(func: F, txns: &TxnMap<'_>, req: Request)
where
    T: DeJson + TransactionRequest,
    F: for<'r, 's> AsyncFn2<&'r RwLock<db::Write<'s>>, T, Output = Result<String, String>>,
{
    let request: T = match deserialize(&req.data) {
        Ok(v) => v,
        Err(e) => return req.response.send(Err(e)).await,
    };

    let txn_id = request.transaction_id();
    let txns = txns.read().await;
    let txn = match txns.get(&txn_id) {
        Some(v) => v,
        None => {
            return req
                .response
                .send(Err(format!("No transaction {}", txn_id)))
                .await
        }
    };

    req.response.send(func.call(txn, request).await).await;
}

async fn do_open<'a, 'b>(store: &'a dag::Store, txns: &'b TxnMap<'a>, req: Request) {
    use OpenTransactionError::*;
    let dag_write = store.write().await.map_err(DagWriteError).unwrap();
    let write = db::Write::new_from_head("main", dag_write)
        .await
        .map_err(DBWriteError)
        .unwrap();
    let txn_id = TRANSACTION_COUNTER.fetch_add(1, Ordering::SeqCst);
    txns.write().await.insert(txn_id, RwLock::new(write));
    req.response
        .send(Ok(SerJson::serialize_json(&OpenTransactionResponse {
            transaction_id: txn_id,
        })))
        .await;
}

async fn do_commit(txns: &TxnMap<'_>, req: Request) {
    let txn_id = match deserialize::<CommitTransactionRequest>(&req.data) {
        Ok(v) => v.transaction_id,
        Err(e) => return req.response.send(Err(e)).await,
    };
    let mut txns = txns.write().await;
    let txn = match txns.remove(&txn_id) {
        Some(v) => v,
        None => {
            return req
                .response
                .send(Err(format!("No such transaction {}", txn_id)))
                .await;
        }
    };
    let txn = txn.into_inner();
    let response = txn
        .commit(
            "main",
            "local-create-date",
            "checksum",
            42,
            "foo",
            b"bar",
            None,
        )
        .await;
    if let Err(e) = response {
        req.response
            .send(Err(format!("{:?}", CommitError::CommitError(e))))
            .await;
        return;
    }
    req.response
        .send(Ok(SerJson::serialize_json(&CommitTransactionResponse {})))
        .await;
}

async fn do_abort(txns: &TxnMap<'_>, req: Request) {
    let request: CommitTransactionRequest = match DeJson::deserialize_json(&req.data) {
        Ok(v) => v,
        Err(e) => return req.response.send(Err(format!("InvalidJson({})", e))).await,
    };
    let txn_id = request.transaction_id;
    if txns.write().await.remove(&txn_id).is_none() {
        return req
            .response
            .send(Err(format!("No transaction {}", txn_id)))
            .await;
    };
    req.response
        .send(Ok(SerJson::serialize_json(&CommitTransactionResponse {})))
        .await;
}

async fn do_has(txn: &RwLock<db::Write<'_>>, req: GetRequest) -> Result<String, String> {
    Ok(SerJson::serialize_json(&GetResponse {
        has: txn.read().await.has(req.key.as_bytes()),
        value: None,
    }))
}

async fn do_get(txn: &RwLock<db::Write<'_>>, req: GetRequest) -> Result<String, String> {
    #[cfg(not(default))] // Not enabled in production.
    if req.key.starts_with("sleep") {
        use async_std::task::sleep;
        use core::time::Duration;

        match req.key[5..].parse::<u64>() {
            Ok(ms) => {
                sleep(Duration::from_millis(ms)).await;
            }
            Err(_) => log::error!("No sleep"),
        }
    }

    let got = txn
        .read()
        .await
        .get(req.key.as_bytes())
        .map(|buf| String::from_utf8(buf.to_vec()));
    if let Some(Err(e)) = got {
        return Err(format!("{:?}", e));
    }
    let got = got.map(|r| r.unwrap());
    Ok(SerJson::serialize_json(&GetResponse {
        has: got.is_some(),
        value: got,
    }))
}

async fn do_put(txn: &RwLock<db::Write<'_>>, req: PutRequest) -> Result<String, String> {
    txn.write()
        .await
        .put(req.key.as_bytes().to_vec(), req.value.into_bytes());
    Ok("{}".into())
}

#[derive(Debug)]
enum OpenTransactionError {
    DagWriteError(dag::Error),
    DBWriteError(db::NewError),
}

#[derive(Debug)]
enum CommitError {
    CommitError(db::CommitError),
}

trait TransactionRequest {
    fn transaction_id(&self) -> u32;
}

impl TransactionRequest for CommitTransactionRequest {
    fn transaction_id(&self) -> u32 {
        self.transaction_id
    }
}

impl TransactionRequest for GetRequest {
    fn transaction_id(&self) -> u32 {
        self.transaction_id
    }
}

impl TransactionRequest for PutRequest {
    fn transaction_id(&self) -> u32 {
        self.transaction_id
    }
}
