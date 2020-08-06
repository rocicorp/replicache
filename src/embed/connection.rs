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

enum Transaction<'a> {
    #[allow(dead_code)]
    Read(db::OwnedRead<'a>),
    Write(db::Write<'a>),
}

impl<'a> Transaction<'a> {
    fn as_read(&self) -> db::Read {
        match self {
            Transaction::Read(r) => r.as_read(),
            Transaction::Write(w) => w.as_read(),
        }
    }
}

type TxnMap<'a> = RwLock<HashMap<u32, RwLock<Transaction<'a>>>>;

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

async fn execute<T, S, F>(func: F, txns: &TxnMap<'_>, req: Request)
where
    T: DeJson + TransactionRequest,
    S: SerJson,
    F: for<'r, 's> AsyncFn2<&'r RwLock<Transaction<'s>>, T, Output = Result<S, String>>,
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

    req.response
        .send(
            func.call(txn, request)
                .await
                .map(|v| SerJson::serialize_json(&v)),
        )
        .await;
}

async fn do_open<'a, 'b>(store: &'a dag::Store, txns: &'b TxnMap<'a>, req: Request) {
    use OpenTransactionError::*;
    let dag_write = store.write().await.map_err(DagWriteError).unwrap();
    let write = db::Write::new_from_head("main", dag_write)
        .await
        .map_err(DBWriteError)
        .unwrap();
    let txn_id = TRANSACTION_COUNTER.fetch_add(1, Ordering::SeqCst);
    txns.write()
        .await
        .insert(txn_id, RwLock::new(Transaction::Write(write)));
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
    let txn = match txn.into_inner() {
        Transaction::Write(w) => w,
        Transaction::Read(_) => {
            return req
                .response
                .send(Err(format!("Transaction is read-only {}", txn_id)))
                .await;
        }
    };
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
    let request: CloseTransactionRequest = match deserialize(&req.data) {
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
        .send(Ok(SerJson::serialize_json(&CloseTransactionResponse {})))
        .await;
}

async fn do_has(txn: &RwLock<Transaction<'_>>, req: HasRequest) -> Result<HasResponse, String> {
    Ok(HasResponse {
        has: txn.read().await.as_read().has(req.key.as_bytes()),
    })
}

async fn do_get(txn: &RwLock<Transaction<'_>>, req: GetRequest) -> Result<GetResponse, String> {
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
        .as_read()
        .get(req.key.as_bytes())
        .map(|buf| String::from_utf8(buf.to_vec()));
    if let Some(Err(e)) = got {
        return Err(format!("{:?}", e));
    }
    let got = got.map(|r| r.unwrap());
    Ok(GetResponse {
        has: got.is_some(),
        value: got,
    })
}

async fn do_put(txn: &RwLock<Transaction<'_>>, req: PutRequest) -> Result<PutResponse, String> {
    let mut guard = txn.write().await;
    let write = match &mut *guard {
        Transaction::Write(w) => Ok(w),
        Transaction::Read(_) => Err(format!("Specified transaction is read-only")),
    }?;
    write.put(req.key.as_bytes().to_vec(), req.value.into_bytes());
    Ok(PutResponse {})
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

macro_rules! impl_transaction_request {
    ($type_name:ident) => {
        impl TransactionRequest for $type_name {
            fn transaction_id(&self) -> u32 {
                self.transaction_id
            }
        }
    };
}

impl_transaction_request!(HasRequest);
impl_transaction_request!(GetRequest);
impl_transaction_request!(PutRequest);
