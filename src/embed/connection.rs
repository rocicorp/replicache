use super::dispatch::Request;
use super::sync;
use super::types::*;
use crate::dag;
use crate::db;
use crate::fetch;
use async_fn::{AsyncFn2, AsyncFn3};
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

const DEFAULT_HEAD_NAME: &str = "main";

enum Transaction<'a> {
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
        "has" => execute_in_txn(do_has, txns, req).await,
        "get" => execute_in_txn(do_get, txns, req).await,
        "put" => execute_in_txn(do_put, txns, req).await,
        "openTransaction" => execute(do_open, store, txns, req).await,
        "commitTransaction" => execute(do_commit, store, txns, req).await,
        "closeTransaction" => execute(do_abort, store, txns, req).await,
        "beginSync" => execute(do_begin_sync, store, txns, req).await,
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

async fn execute_in_txn<T, S, F>(func: F, txns: &TxnMap<'_>, req: Request)
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

async fn execute<'a, 'b, T, S, F, E>(
    func: F,
    store: &'a dag::Store,
    txns: &'b TxnMap<'a>,
    req: Request,
) where
    T: DeJson,
    S: SerJson,
    E: std::fmt::Debug,
    F: AsyncFn3<&'a dag::Store, &'b TxnMap<'a>, T, Output = Result<S, E>>,
{
    let request: T = match deserialize(&req.data) {
        Ok(v) => v,
        Err(e) => return req.response.send(Err(e)).await,
    };

    let result = func
        .call(store, txns, request)
        .await
        .map(|v| SerJson::serialize_json(&v))
        .map_err(|e| format!("{:?}", e));

    req.response.send(result).await
}

async fn do_open<'a, 'b>(
    store: &'a dag::Store,
    txns: &'b TxnMap<'a>,
    req: OpenTransactionRequest,
) -> Result<OpenTransactionResponse, OpenTransactionError> {
    use OpenTransactionError::*;

    let txn = match req.name {
        Some(mutator_name) => {
            let OpenTransactionRequest {
                name: _,
                rebase_opts,
                args: mutator_args,
            } = req;

            let (basis, original_hash) = match rebase_opts {
                Some(rebase_opts) => (rebase_opts.basis, rebase_opts.original_hash),
                None => (None, None),
            };

            let head_name = basis.unwrap_or_else(|| DEFAULT_HEAD_NAME.to_string());
            let mutator_args = mutator_args.ok_or(ArgsRequired)?;
            let dag_write = store.write().await.map_err(DagWriteError)?;
            let write = db::Write::new_local(
                head_name,
                mutator_name,
                mutator_args,
                original_hash,
                dag_write,
            )
            .await
            .map_err(DBWriteError)?;
            Transaction::Write(write)
        }
        None => {
            let dag_read = store.read().await.map_err(DagReadError)?;
            let read = db::OwnedRead::new_from_head("main", dag_read)
                .await
                .map_err(DBReadError)?;
            Transaction::Read(read)
        }
    };

    let txn_id = TRANSACTION_COUNTER.fetch_add(1, Ordering::SeqCst);
    txns.write().await.insert(txn_id, RwLock::new(txn));
    Ok(OpenTransactionResponse {
        transaction_id: txn_id,
    })
}

async fn do_commit<'a, 'b>(
    _: &'a dag::Store,
    txns: &'b TxnMap<'a>,
    req: CommitTransactionRequest,
) -> Result<CommitTransactionResponse, CommitTransactionError> {
    use CommitTransactionError::*;
    let txn_id = req.transaction_id;
    let mut txns = txns.write().await;
    let txn = txns.remove(&txn_id).ok_or(UnknownTransaction)?;
    let txn = match txn.into_inner() {
        Transaction::Write(w) => Ok(w),
        Transaction::Read(_) => Err(TransactionIsReadOnly),
    }?;
    txn.commit("main", "local-create-date", "checksum")
        .await
        .map_err(CommitError)?;
    Ok(CommitTransactionResponse {})
}

async fn do_abort<'a, 'b>(
    _: &'a dag::Store,
    txns: &'b TxnMap<'a>,
    request: CloseTransactionRequest,
) -> Result<CloseTransactionResponse, CloseTransactionError> {
    use CloseTransactionError::*;
    let txn_id = request.transaction_id;
    txns.write()
        .await
        .remove(&txn_id)
        .ok_or(UnknownTransaction)?;
    Ok(CloseTransactionResponse {})
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
        Transaction::Read(_) => Err("Specified transaction is read-only".to_string()),
    }?;
    write.put(req.key.as_bytes().to_vec(), req.value.into_bytes());
    Ok(PutResponse {})
}

async fn do_begin_sync<'a, 'b>(
    _: &'a dag::Store,
    _: &'b TxnMap<'a>,
    req: BeginSyncRequest,
) -> Result<BeginSyncResponse, sync::BeginSyncError> {
    // TODO move client up to process() or into a lazy static so we can re-use.
    let fetch_client = fetch::client::Client::new();
    let begin_sync_response = sync::begin_sync(&fetch_client, &req).await?;
    Ok(begin_sync_response)
}

#[derive(Debug)]
#[allow(clippy::enum_variant_names)]
enum OpenTransactionError {
    ArgsRequired,
    DagWriteError(dag::Error),
    DagReadError(dag::Error),
    DBWriteError(db::NewLocalError),
    DBReadError(db::NewReadFromHeadError),
}

#[derive(Debug)]
enum CommitTransactionError {
    CommitError(db::CommitError),
    UnknownTransaction,
    TransactionIsReadOnly,
}

#[derive(Debug)]
enum CloseTransactionError {
    UnknownTransaction,
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
