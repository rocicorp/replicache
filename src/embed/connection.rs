use super::dispatch::Request;
use super::types::*;
use crate::dag;
use crate::db;
use crate::fetch;
use crate::sync;
use crate::util::rlog;
use crate::util::rlog::LogContext;
use crate::util::to_debug;
use async_std::stream::StreamExt;
use async_std::sync::{Receiver, RecvError, RwLock};
use futures::stream::futures_unordered::FuturesUnordered;
use js_sys::{Function, Reflect, Uint8Array};
use std::collections::HashMap;
use std::mem;
use std::sync::atomic::{AtomicU32, Ordering};
use wasm_bindgen::{JsCast, JsValue};

lazy_static! {
    static ref TRANSACTION_COUNTER: AtomicU32 = AtomicU32::new(1);
}

#[allow(clippy::large_enum_variant)]
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

type TransactionsMap<'a> = RwLock<HashMap<u32, RwLock<Transaction<'a>>>>;

#[derive(Debug)]
enum FromJsError {
    DeserializeError(serde_wasm_bindgen::Error),
}

fn from_js<T: serde::de::DeserializeOwned>(data: JsValue) -> Result<T, String> {
    use FromJsError::*;
    serde_wasm_bindgen::from_value(data)
        .map_err(DeserializeError)
        .map_err(to_debug)
}

#[derive(Debug)]
enum ToJsError {
    SerializeError(serde_wasm_bindgen::Error),
}

fn to_js<T: serde::Serialize, E: std::fmt::Debug>(res: Result<T, E>) -> Result<JsValue, JsValue> {
    use ToJsError::*;
    match res {
        Ok(v) => Ok(serde_wasm_bindgen::to_value(&v)
            .map_err(SerializeError)
            .map_err(to_debug)?),
        Err(v) => Err(JsValue::from_str(&to_debug(v))),
    }
}

enum UnorderedResult {
    Request(Result<Request, RecvError>),
    Stop(),
    None(),
}

async fn connection_future<'a, 'b>(
    rx: &Receiver<Request>,
    ctx: Context<'a, 'b>,
    request: Option<Request>,
) -> UnorderedResult {
    let req = match request {
        None => return UnorderedResult::Request(rx.recv().await),
        Some(v) => v,
    };

    if req.rpc == Rpc::Close {
        ctx.store.close().await;
        req.response.send(Ok("".into())).await;
        return UnorderedResult::Stop();
    }

    let Request {
        rpc,
        data,
        lc,
        response,
        ..
    } = req;
    let res = execute(ctx, rpc, data, lc).await;
    response.send(res).await;

    UnorderedResult::None()
}

pub async fn process(
    store: dag::Store,
    receiver: Receiver<Request>,
    client_id: String,
    lc: LogContext,
) {
    if let Err(err) = do_init(&store, lc.clone()).await {
        error!(lc, "Could not initialize db: {:?}", err);
        return;
    }

    let txns = RwLock::new(HashMap::new());
    let mut futures = FuturesUnordered::new();
    let mut recv = true;

    futures.push(Box::pin(connection_future(
        &receiver,
        Context::new(&store, &txns, client_id.clone(), LogContext::new()),
        None,
    )));
    while let Some(value) = futures.next().await {
        match value {
            UnorderedResult::Request(value) => match value {
                Err(why) => info!(lc, "Connection loop recv failed: {}", why),
                Ok(req) => {
                    if recv {
                        futures.push(Box::pin(connection_future(
                            &receiver,
                            Context::new(&store, &txns, client_id.clone(), LogContext::new()),
                            None,
                        )));
                    }
                    futures.push(Box::pin(connection_future(
                        &receiver,
                        Context::new(&store, &txns, client_id.clone(), req.lc.clone()),
                        Some(req),
                    )));
                }
            },
            UnorderedResult::Stop() => recv = false,
            UnorderedResult::None() => {}
        }
    }
}

struct Context<'a, 'b> {
    store: &'a dag::Store,
    txns: &'b TransactionsMap<'a>,
    client_id: String,
    lc: LogContext,
}

impl<'a, 'b> Context<'a, 'b> {
    fn new(
        store: &'a dag::Store,
        txns: &'b TransactionsMap<'a>,
        client_id: String,
        lc: LogContext,
    ) -> Context<'a, 'b> {
        Context {
            store,
            txns,
            client_id,
            lc,
        }
    }
}

#[derive(Debug)]
#[allow(clippy::enum_variant_names)]
enum ExecuteError {
    TransactionNotFound(u32),
    TransactionIdRequired,
    TransactionIsReadOnly(u32),
    UnknownRpc(Rpc),
}
#[repr(u8)]
#[derive(Debug, PartialEq)]
pub enum Rpc {
    BeginTryPull = 1,
    Close = 2,
    CloseTransaction = 3,
    CommitTransaction = 4,
    CreateIndex = 5,
    Debug = 6,
    Del = 7,
    DropIndex = 8,
    Get = 9,
    GetRoot = 10,
    Has = 11,
    MaybeEndTryPull = 12,
    Open = 13,
    OpenIndexTransaction = 14,
    OpenTransaction = 15,
    Put = 16,
    Scan = 17,
    SetLogLevel = 18,
    TryPush = 19,
}

impl Rpc {
    pub fn from_u8(n: u8) -> Option<Rpc> {
        if n >= Self::BeginTryPull as u8 && n <= Self::TryPush as u8 {
            Some(unsafe { mem::transmute(n) })
        } else {
            None
        }
    }
}

async fn execute<'a, 'b>(
    ctx: Context<'a, 'b>,
    rpc: Rpc,
    data: JsValue,
    lc: LogContext,
) -> Result<JsValue, JsValue> {
    use ExecuteError::*;

    // transaction-less
    match rpc {
        Rpc::GetRoot => return to_js(do_get_root(ctx, from_js(data)?).await),
        Rpc::OpenIndexTransaction => {
            return to_js(do_open_index_transaction(ctx, from_js(data)?).await)
        }
        Rpc::OpenTransaction => return to_js(do_open_transaction(ctx, from_js(data)?).await),
        Rpc::CommitTransaction => return to_js(do_commit(ctx, from_js(data)?).await),
        Rpc::CloseTransaction => return to_js(do_close_transaction(ctx, from_js(data)?).await),
        Rpc::SetLogLevel => return to_js(do_set_log_level(ctx, from_js(data)?).await),

        Rpc::TryPush => return to_js(do_try_push(ctx, from_js(data)?).await),
        Rpc::BeginTryPull => return to_js(do_begin_try_pull(ctx, from_js(data)?).await),
        Rpc::MaybeEndTryPull => return to_js(do_maybe_end_try_pull(ctx, from_js(data)?).await),

        _ => (),
    };

    // require read txn
    let txn_req: TransactionRequest = from_js(data.clone())?;
    let txn_id = txn_req
        .transaction_id
        .ok_or(TransactionIdRequired)
        .map_err(to_debug)?;
    let txn_id_string = txn_id.to_string();
    lc.add_context("txid", &txn_id_string);
    let txns = ctx.txns.read().await;
    let txn = txns
        .get(&txn_id)
        .ok_or(TransactionNotFound(txn_id))
        .map_err(to_debug)?;

    match rpc {
        Rpc::Has => return to_js(do_has(txn.read().await.as_read(), from_js(data)?).await),
        Rpc::Get => return to_js(do_get(txn.read().await.as_read(), from_js(data)?).await),
        Rpc::Scan => {
            return to_js(
                do_scan(
                    txn.read().await.as_read(),
                    from_js(data.clone())?,
                    data,
                    lc.clone(),
                )
                .await,
            )
        }
        _ => (),
    }

    // require write txn
    let mut guard = txn.write().await;
    let write = match &mut *guard {
        Transaction::Write(w) => Ok(w),
        Transaction::Read(_) => Err(to_debug(TransactionIsReadOnly(txn_id))),
    }?;

    match rpc {
        Rpc::Put => return to_js(do_put(lc, write, from_js(data)?).await),
        Rpc::Del => return to_js(do_del(lc, write, from_js(data)?).await),
        Rpc::CreateIndex => return to_js(do_create_index(lc.clone(), write, from_js(data)?).await),
        Rpc::DropIndex => return to_js(do_drop_index(write, from_js(data)?).await),
        _ => (),
    }

    Err(JsValue::from_str(&to_debug(UnknownRpc(rpc))))
}

#[derive(Debug)]
pub enum DoInitError {
    WriteError(dag::Error),
    GetHeadError(dag::Error),
    InitDBError(db::InitDBError),
}

async fn do_init(store: &dag::Store, lc: LogContext) -> Result<(), DoInitError> {
    use DoInitError::*;
    let dw = store.write(lc).await.map_err(WriteError)?;
    if dw
        .read()
        .get_head(db::DEFAULT_HEAD_NAME)
        .await
        .map_err(GetHeadError)?
        .is_none()
    {
        db::init_db(dw, db::DEFAULT_HEAD_NAME)
            .await
            .map_err(InitDBError)?;
    }
    Ok(())
}

async fn do_open_transaction<'a, 'b>(
    ctx: Context<'a, 'b>,
    req: OpenTransactionRequest,
) -> Result<OpenTransactionResponse, OpenTransactionError> {
    use OpenTransactionError::*;

    let txn = match req.name {
        Some(mutator_name) => {
            let OpenTransactionRequest {
                name: _,
                args: mutator_args,
                rebase_opts,
            } = req;
            let mutator_args = mutator_args.ok_or(ArgsRequired)?;

            let lock_timer = rlog::Timer::new();
            debug!(ctx.lc, "Waiting for write lock...");
            let dag_write = ctx
                .store
                .write(ctx.lc.clone())
                .await
                .map_err(DagWriteError)?;
            debug!(
                ctx.lc,
                "...Write lock acquired in {}ms",
                lock_timer.elapsed_ms()
            );

            let (whence, original_hash) = match rebase_opts {
                None => (db::Whence::Head(db::DEFAULT_HEAD_NAME.to_string()), None),
                Some(opts) => {
                    validate_rebase(&opts, dag_write.read(), &mutator_name, &mutator_args).await?;
                    (db::Whence::Hash(opts.basis), Some(opts.original_hash))
                }
            };

            let write =
                db::Write::new_local(whence, mutator_name, mutator_args, original_hash, dag_write)
                    .await
                    .map_err(DBWriteError)?;
            Transaction::Write(write)
        }
        None => {
            let dag_read = ctx.store.read(ctx.lc.clone()).await.map_err(DagReadError)?;
            let read = db::OwnedRead::from_whence(
                db::Whence::Head(db::DEFAULT_HEAD_NAME.to_string()),
                dag_read,
            )
            .await
            .map_err(DBReadError)?;
            Transaction::Read(read)
        }
    };

    let txn_id = TRANSACTION_COUNTER.fetch_add(1, Ordering::SeqCst);
    ctx.txns.write().await.insert(txn_id, RwLock::new(txn));
    Ok(OpenTransactionResponse {
        transaction_id: txn_id,
    })
}

async fn do_open_index_transaction<'a, 'b>(
    ctx: Context<'a, 'b>,
    _req: OpenIndexTransactionRequest,
) -> Result<OpenIndexTransactionResponse, OpenTransactionError> {
    use OpenTransactionError::*;

    let lock_timer = rlog::Timer::new();
    debug!(ctx.lc, "Waiting for write lock...");
    let dag_write = ctx
        .store
        .write(ctx.lc.clone())
        .await
        .map_err(DagWriteError)?;
    debug!(
        ctx.lc,
        "...Write lock acquired in {}ms",
        lock_timer.elapsed_ms()
    );

    let write = db::Write::new_index_change(
        db::Whence::Head(db::DEFAULT_HEAD_NAME.to_string()),
        dag_write,
    )
    .await
    .map_err(DBWriteError)?;
    let txn = Transaction::Write(write);

    let txn_id = TRANSACTION_COUNTER.fetch_add(1, Ordering::SeqCst);
    ctx.txns.write().await.insert(txn_id, RwLock::new(txn));
    Ok(OpenIndexTransactionResponse {
        transaction_id: txn_id,
    })
}

async fn validate_rebase<'a>(
    opts: &'a RebaseOpts,
    dag_read: dag::Read<'_>,
    mutator_name: &'a str,
    _args: &'a str,
) -> Result<(), OpenTransactionError> {
    use OpenTransactionError::*;

    // Ensure the rebase commit is going on top of the current sync head.
    let sync_head_hash = dag_read
        .get_head(sync::SYNC_HEAD_NAME)
        .await
        .map_err(GetHeadError)?;
    if sync_head_hash.as_ref() != Some(&opts.basis) {
        return Err(WrongSyncHeadJSLogInfo(format!(
            "sync head is {:?}, transaction basis is {:?}",
            sync_head_hash, opts.basis
        )));
    }

    // Ensure rebase and original commit mutator names match.
    let (_, original, _) = db::read_commit(db::Whence::Hash(opts.original_hash.clone()), &dag_read)
        .await
        .map_err(NoSuchOriginal)?;
    match original.meta().typed() {
        db::MetaTyped::Local(lm) => {
            if lm.mutator_name() != mutator_name {
                return Err(InconsistentMutator(format!(
                    "original: {}, request: {}",
                    lm.mutator_name(),
                    mutator_name
                )));
            }
        }
        _ => {
            return Err(InternalProgrammerError(
                "Commit is not a local commit".to_string(),
            ))
        }
    };

    // Ensure rebase and original commit mutation ids names match.
    let (_, basis, _) = db::read_commit(db::Whence::Hash(opts.basis.clone()), &dag_read)
        .await
        .map_err(NoSuchBasis)?;
    if basis.next_mutation_id() != original.mutation_id() {
        return Err(InconsistentMutationId(format!(
            "original: {}, next: {}",
            original.mutation_id(),
            basis.next_mutation_id(),
        )));
    }

    // TODO: temporarily skipping check that args are the same.
    // https://github.com/rocicorp/repc/issues/151

    Ok(())
}

async fn do_commit<'a, 'b>(
    ctx: Context<'a, 'b>,
    req: CommitTransactionRequest,
) -> Result<CommitTransactionResponse, CommitTransactionError> {
    use CommitTransactionError::*;
    let txn_id = req.transaction_id;
    let mut txns = ctx.txns.write().await;
    let txn = txns.remove(&txn_id).ok_or(UnknownTransaction)?;
    let txn = match txn.into_inner() {
        Transaction::Write(w) => Ok(w),
        Transaction::Read(_) => Err(TransactionIsReadOnly),
    }?;
    let head_name = if txn.is_rebase() {
        sync::SYNC_HEAD_NAME
    } else {
        db::DEFAULT_HEAD_NAME
    };
    let (hash, changed_keys) = txn
        .commit_with_changed_keys(head_name, req.generate_changed_keys)
        .await
        .map_err(CommitError)?;
    Ok(CommitTransactionResponse { hash, changed_keys })
}

async fn do_close_transaction<'a, 'b>(
    ctx: Context<'a, 'b>,
    request: CloseTransactionRequest,
) -> Result<CloseTransactionResponse, CloseTransactionError> {
    use CloseTransactionError::*;
    let txn_id = request.transaction_id;
    ctx.txns
        .write()
        .await
        .remove(&txn_id)
        .ok_or(UnknownTransaction)?;
    Ok(CloseTransactionResponse {})
}

async fn do_get_root<'a, 'b>(
    ctx: Context<'a, 'b>,
    req: GetRootRequest,
) -> Result<GetRootResponse, GetRootError> {
    use GetRootError::*;
    let head_name = match req.head_name {
        Some(name) => name,
        None => db::DEFAULT_HEAD_NAME.to_string(),
    };
    Ok(GetRootResponse {
        root: db::get_root(ctx.store, head_name.as_str(), ctx.lc.clone())
            .await
            .map_err(DBError)?,
    })
}

async fn do_has(txn: db::Read<'_>, req: HasRequest) -> Result<HasResponse, ()> {
    Ok(HasResponse {
        has: txn.has(req.key.as_bytes()),
    })
}

async fn do_get(read: db::Read<'_>, req: GetRequest) -> Result<GetResponse, String> {
    #[cfg(not(default))] // Not enabled in production.
    if req.key.starts_with("sleep") {
        use async_std::task::sleep;
        use core::time::Duration;

        match req.key[5..].parse::<u64>() {
            Ok(ms) => {
                sleep(Duration::from_millis(ms)).await;
            }
            Err(_) => error!("", "No sleep time"),
        }
    }

    #[cfg(not(default))] // Not enabled in production.
    // Sometimes we can't sleep (eg, underlying idb tx would commit) so
    // we have to spin. It yields to other futures every iteration.
    if req.key.starts_with("spin") {
        match req.key[4..].parse::<u64>() {
            Ok(ms) => {
                use crate::util::uuid;
                use crate::util::wasm::performance_now;
                use async_std::task;
                use rand::seq::SliceRandom;
                use rand::thread_rng;

                let start = performance_now();

                loop {
                    // Give other futures a chance to run. This is essential to testing
                    // concurrency of two futures: if we didn't yield then the spinning
                    // future could prevent the other future from running, giving false
                    // ideas about whether they *could* run concurrently.
                    task::yield_now().await;
                    // Do something expensive that doesn't get optimized away. This
                    // seems to work. Takes a few ms each loop when running headless.
                    let mut v = Vec::new();
                    for _ in 0..50 {
                        let mut randoms: [u8; 1] = [0; 1];
                        let _ = uuid::make_random_numbers(&mut randoms);
                        let randoms = randoms.to_vec();
                        for r in randoms.into_iter() {
                            v.insert(0, r); // Insert at the front intended!
                            v.shuffle(&mut thread_rng());
                        }
                    }
                    let elapsed_ms = (performance_now() - start) as u64;
                    if elapsed_ms >= ms {
                        break;
                    }
                    v.truncate(0);
                }
            }
            Err(_) => error!("", "No spin time"),
        }
    }

    let got = read
        .get(req.key.as_bytes())
        .map(|buf| String::from_utf8(buf.to_vec()));
    if let Some(Err(e)) = got {
        return Err(to_debug(e));
    }
    let got = got.map(|r| r.unwrap());
    Ok(GetResponse {
        has: got.is_some(),
        value: got,
    })
}

async fn do_scan(
    read: db::Read<'_>,
    req: ScanRequest,
    req_raw: JsValue,
    lc: LogContext,
) -> Result<ScanResponse, ScanError> {
    let receiver: Function = Reflect::get(&req_raw, &JsValue::from_str("receiver"))
        .map_err(|_| ScanError::MissingReceiver)?
        .dyn_into()
        .map_err(|_| ScanError::InvalidReceiver)?;

    read.scan(req.opts, |sr: db::ScanResult<'_>| {
        match sr {
            db::ScanResult::Error(e) => error!(lc, "Error returning scan result: {:?}", e),
            db::ScanResult::Item(i) => {
                let val = unsafe { Uint8Array::view(i.val) };
                let primary_key_string = std::str::from_utf8(i.key);
                let secondary_key_string = std::str::from_utf8(i.secondary_key);
                if let (Ok(p), Ok(s)) = (primary_key_string, secondary_key_string) {
                    let primary_key = JsValue::from_str(p);
                    let secondary_key = JsValue::from_str(s);
                    // TODO: receiver can return to us whether to keep going!
                    receiver
                        .call3(&JsValue::null(), &primary_key, &secondary_key, &val)
                        .unwrap();
                } else {
                    if let Some(e) = primary_key_string.err() {
                        error!(lc, "Error parsing primary key: {:?}", e);
                    }
                    if let Some(e) = secondary_key_string.err() {
                        error!(lc, "Error parsing secondary key: {:?}", e);
                    }
                }
            }
        }
    })
    .await
    .map_err(ScanError::ScanError)?;

    Ok(ScanResponse {})
}

async fn do_put(
    lc: rlog::LogContext,
    write: &mut db::Write<'_>,
    req: PutRequest,
) -> Result<PutResponse, db::PutError> {
    write
        .put(lc, req.key.as_bytes().to_vec(), req.value.into_bytes())
        .await?;
    Ok(PutResponse {})
}

async fn do_del(
    lc: rlog::LogContext,
    write: &mut db::Write<'_>,
    req: DelRequest,
) -> Result<DelResponse, db::DelError> {
    let had = write.as_read().has(req.key.as_bytes());
    write.del(lc, req.key.as_bytes().to_vec()).await?;
    Ok(DelResponse { had })
}

async fn do_create_index(
    lc: rlog::LogContext,
    write: &mut db::Write<'_>,
    req: CreateIndexRequest,
) -> Result<CreateIndexResponse, CreateIndexError> {
    use CreateIndexError::*;
    write
        .create_index(lc, req.name, req.key_prefix.as_bytes(), &req.json_pointer)
        .await
        .map_err(DBError)?;
    Ok(CreateIndexResponse {})
}

async fn do_drop_index(
    write: &mut db::Write<'_>,
    req: DropIndexRequest,
) -> Result<DropIndexResponse, DropIndexError> {
    use DropIndexError::*;
    write.drop_index(&req.name).await.map_err(DBError)?;
    Ok(DropIndexResponse {})
}

async fn do_maybe_end_try_pull<'a, 'b>(
    ctx: Context<'a, 'b>,
    req: sync::MaybeEndTryPullRequest,
) -> Result<sync::MaybeEndTryPullResponse, sync::MaybeEndTryPullError> {
    ctx.lc.add_context("request_id", &req.request_id);
    sync::maybe_end_try_pull(ctx.store, ctx.lc.clone(), req).await
}

async fn do_set_log_level<'a, 'b>(
    _: Context<'a, 'b>,
    req: SetLogLevelRequest,
) -> Result<SetLogLevelResponse, SetLogLevelError> {
    use SetLogLevelError::*;
    match req.level.as_str() {
        "debug" => log::set_max_level(log::LevelFilter::Debug),
        "info" => log::set_max_level(log::LevelFilter::Info),
        "error" => log::set_max_level(log::LevelFilter::Error),
        _ => return Err(UnknownLogLevel(req.level.clone())),
    }
    Ok(SetLogLevelResponse {})
}

async fn do_try_push<'a, 'b>(
    ctx: Context<'a, 'b>,
    req: sync::TryPushRequest,
) -> Result<sync::TryPushResponse, sync::TryPushError> {
    // TODO move client, pusher up to process() or into a lazy static so we can share.
    let fetch_client = fetch::client::Client::new();
    let pusher = sync::FetchPusher::new(&fetch_client);
    let request_id = sync::request_id::new(&ctx.client_id);
    ctx.lc.add_context("request_id", &request_id);

    let http_request_info =
        sync::push(&request_id, ctx.store, ctx.lc, ctx.client_id, &pusher, req).await?;
    Ok(sync::TryPushResponse { http_request_info })
}

async fn do_begin_try_pull<'a, 'b>(
    ctx: Context<'a, 'b>,
    req: sync::BeginTryPullRequest,
) -> Result<sync::BeginTryPullResponse, sync::BeginTryPullError> {
    // TODO move client, pusher up to process() or into a lazy static so we can share.
    let fetch_client = fetch::client::Client::new();
    let puller = sync::FetchPuller::new(&fetch_client);
    let request_id = sync::request_id::new(&ctx.client_id);
    ctx.lc.add_context("request_id", &request_id);
    sync::begin_pull(ctx.client_id, req, &puller, request_id, ctx.store, ctx.lc).await
}

#[derive(Debug)]
#[allow(clippy::enum_variant_names)]
enum GetRootError {
    DBError(db::GetRootError),
}

#[derive(Debug)]
#[allow(clippy::enum_variant_names)]
enum OpenTransactionError {
    ArgsRequired,
    DagWriteError(dag::Error),
    DagReadError(dag::Error),
    DBWriteError(db::ReadCommitError),
    DBReadError(db::ReadCommitError),
    GetHeadError(dag::Error),
    InconsistentMutationId(String),
    InconsistentMutator(String),
    InternalProgrammerError(String),
    NoSuchBasis(db::ReadCommitError),
    NoSuchOriginal(db::ReadCommitError),
    WrongSyncHeadJSLogInfo(String), // "JSLogInfo" is a signal to bindings to not log this alarmingly.
}

#[derive(Debug)]
enum CommitTransactionError {
    CommitError(db::CommitError),
    TransactionIsReadOnly,
    UnknownTransaction,
}

#[derive(Debug)]
enum CloseTransactionError {
    UnknownTransaction,
}

// Note: dispatch is mostly tested in tests/wasm.rs.
// TODO those tests should move here and *also* be run from there so we have
// coverage in both rust using memstore and in wasm using idbstore.
#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::test_helpers::*;
    use crate::kv::memstore::MemStore;
    use crate::sync::test_helpers::*;
    use crate::util::rlog::LogContext;
    use str_macro::str;

    #[async_std::test]
    async fn test_open_transaction_rebase_opts() {
        // Note: store needs to outlive txns.
        let store = dag::Store::new(Box::new(MemStore::new()));
        {
            let txns = RwLock::new(HashMap::new());
            let mut main_chain: Chain = vec![];
            add_genesis(&mut main_chain, &store).await;
            add_local(&mut main_chain, &store).await;
            let sync_chain = add_sync_snapshot(&mut main_chain, &store, 0, LogContext::new()).await;
            let original = &main_chain[1];
            let meta = original.meta();
            let (original_hash, original_name, original_args): (String, String, String) =
                match meta.typed() {
                    db::MetaTyped::Local(lm) => (
                        str!(original.chunk().hash()),
                        str!(lm.mutator_name()),
                        String::from_utf8(lm.mutator_args_json().to_vec()).unwrap(),
                    ),
                    _ => panic!("not local"),
                };
            drop(meta);
            drop(original);

            // Error: rebase commit's basis must be sync head.
            let result = do_open_transaction(
                Context::new(&store, &txns, str!("client_id"), LogContext::new()),
                OpenTransactionRequest {
                    name: Some(original_name.clone()),
                    args: Some(original_args.clone()),
                    rebase_opts: Some(RebaseOpts {
                        basis: original_hash.clone(), // <-- not the sync head
                        original_hash: original_hash.clone(),
                    }),
                },
            )
            .await;
            assert!(to_debug(result.unwrap_err()).contains("WrongSyncHeadJSLogInfo"));

            // Error: rebase commit's name should not change.
            let result = do_open_transaction(
                Context::new(&store, &txns, str!("client_id"), LogContext::new()),
                OpenTransactionRequest {
                    name: Some(str!("different!")),
                    args: Some(original_args.clone()),
                    rebase_opts: Some(RebaseOpts {
                        basis: str!(sync_chain[0].chunk().hash()),
                        original_hash: original_hash.clone(),
                    }),
                },
            )
            .await;
            assert!(to_debug(result.unwrap_err()).contains("InconsistentMutator"));

            // TODO test error: rebase commit's args should not change.
            // https://github.com/rocicorp/repc/issues/151

            // Ensure it doesn't let us rebase with a different mutation id.
            add_local(&mut main_chain, &store).await;
            let new_local = &main_chain[main_chain.len() - 1];
            let meta = new_local.meta();
            let (new_local_hash, new_local_name, new_local_args) = match meta.typed() {
                db::MetaTyped::Local(lm) => (
                    str!(new_local.chunk().hash()),
                    str!(lm.mutator_name()),
                    String::from_utf8(lm.mutator_args_json().to_vec()).unwrap(),
                ),
                _ => panic!("not local"),
            };
            let result = do_open_transaction(
                Context::new(&store, &txns, str!("client_id"), LogContext::new()),
                OpenTransactionRequest {
                    name: Some(new_local_name),
                    args: Some(new_local_args),
                    rebase_opts: Some(RebaseOpts {
                        basis: str!(sync_chain[0].chunk().hash()),
                        original_hash: new_local_hash, // <-- has different mutation id
                    }),
                },
            )
            .await;
            let err = result.unwrap_err();
            assert!(to_debug(err).contains("InconsistentMutationId"));

            // Correct rebase_opt (test this last because it affects the chain).
            let otr = do_open_transaction(
                Context::new(&store, &txns, str!("client_id"), LogContext::new()),
                OpenTransactionRequest {
                    name: Some(original_name.clone()),
                    args: Some(original_args.clone()),
                    rebase_opts: Some(RebaseOpts {
                        basis: str!(sync_chain[0].chunk().hash()),
                        original_hash: original_hash.clone(),
                    }),
                },
            )
            .await
            .unwrap();
            let ctr = do_commit(
                Context::new(&store, &txns, str!("client_id"), LogContext::new()),
                CommitTransactionRequest {
                    transaction_id: otr.transaction_id,
                    generate_changed_keys: false,
                },
            )
            .await
            .unwrap();
            let w = store.write(LogContext::new()).await.unwrap();
            let sync_head_hash = w
                .read()
                .get_head(sync::SYNC_HEAD_NAME)
                .await
                .unwrap()
                .unwrap();
            assert_eq!(ctr.hash, sync_head_hash);
        }
    }
}
