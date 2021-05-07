use crate::kv::{Read, Result, Store, StoreError, Write};
use crate::util::rlog::LogContext;
use crate::util::to_debug;
use async_std::sync::{Mutex, RwLock, RwLockReadGuard, RwLockWriteGuard};
use async_trait::async_trait;
use std::{collections::HashMap, convert::TryInto};
use wasm_bindgen::prelude::*;
use wasm_bindgen::{JsCast, JsValue};
use web_sys::{IdbDatabase, IdbObjectStore, IdbTransaction};

#[wasm_bindgen(module = "/src/kv/idbstore.js")]
extern "C" {
    #[wasm_bindgen(catch, js_name = createObjectStore)]
    fn create_object_store(idb: &IdbDatabase) -> std::result::Result<IdbObjectStore, JsValue>;

    #[wasm_bindgen(catch, js_name = readTransaction)]
    fn read_transaction(idb: &IdbDatabase) -> std::result::Result<IdbTransaction, JsValue>;

    #[wasm_bindgen(catch, js_name = writeTransaction)]
    fn write_transaction(idb: &IdbDatabase) -> std::result::Result<IdbTransaction, JsValue>;

    #[wasm_bindgen(catch, js_name = objectStore)]
    fn object_store(tx: &IdbTransaction) -> std::result::Result<IdbObjectStore, JsValue>;

    #[wasm_bindgen(catch, js_name = openDatabase)]
    async fn open_database(name: &str) -> std::result::Result<JsValue, JsValue>;

    #[wasm_bindgen(catch, js_name = dbGet)]
    async fn db_get(tx: &IdbTransaction, name: &str) -> std::result::Result<JsValue, JsValue>;

    #[wasm_bindgen(catch, js_name = dbHas)]
    async fn db_has(tx: &IdbTransaction, name: &str) -> std::result::Result<JsValue, JsValue>;

    #[wasm_bindgen(catch, js_name = dropStore)]
    async fn drop_store(name: &str) -> std::result::Result<JsValue, JsValue>;

    #[wasm_bindgen(catch, js_name = commit)]
    async fn js_commit(
        tx: &IdbTransaction,
        entries: &JsValue,
    ) -> std::result::Result<JsValue, JsValue>;

    #[wasm_bindgen(catch, js_name = abort)]
    async fn js_abort(tx: &IdbTransaction) -> std::result::Result<JsValue, JsValue>;

    #[wasm_bindgen(catch, js_name = transactionState)]
    async fn transaction_state_js(tx: &IdbTransaction) -> std::result::Result<JsValue, JsValue>;
}

impl From<String> for StoreError {
    fn from(err: String) -> StoreError {
        StoreError::Str(err)
    }
}

impl From<JsValue> for StoreError {
    fn from(err: JsValue) -> StoreError {
        // TODO(nate): Pick out a useful subset of this value.
        StoreError::Str(to_debug(err))
    }
}

pub struct IdbStore {
    // We would like:
    // - tests that verify essential behavior such as tx isolation.
    // - Store to be strictly serializabile.
    // - implementations of Store to work in as close to the same way as possible
    //      in order to ensure our tests are realistic and to make replicache easy
    //      to reason about.
    //
    // Idb v2 is (strictly I think) serializable but its API makes it a bit awkward to
    // test: a tx can be created and begin accepting requests before the transaction
    // actually starts, which happens asynchronously and opaquely. This
    // means you can open 20 write txs in parallel and start
    // sending them requests and while only one of them will actually start executing,
    // you can't tell which one.
    //
    // Note:
    // - per https://www.w3.org/TR/IndexedDB-2/#transaction-lifetime-concept
    //      read transactions can be executed concurrently with readwrite txs
    //      if the read tx is snapshot isolated and started before the readwrite tx.
    //      Browsers however do not do this.
    // - idb v1 api allowed read txs to be re-ordered before write txs, meaning
    //      that indexdb was potentially not read-after-write. Chrome apparently had this
    //      behavior: https://lists.w3.org/Archives/Public/public-webapps/2014JanMar/0586.html).
    //
    // The Memstore implementation we wrote had a simpler to implement interface: at most
    // one write tx can be instantiated at any time and it must be exclusive of all other txs;
    // callers wait asynchronosly to start txs until this constraint can be met.
    //
    // Here we use a RwLock around the underlying idb in order to bring the memstore
    // behavior (caller asynchronously waits to open a tx until it can proceed safely) to idb
    // (caller creates a tx and sends it requests and it starts asynchronously and opaquely).
    // This RwLock makes the Idbstore work like the Memstore, makes it easy to test,
    // and (in my mind) makes it easier to reason about. In principle adding this lock
    // mirrors the constraints in play under the hood, so in principle nbd, but there
    // are probably practical considerations that make this approach less efficient
    // (e.g. if implementations increase concurrency with the snapshot isolation
    // loophole above). It's also the case that we lose a measure of fairness implemented by
    // idb, per the spec: "User agents must ensure a reasonable level of fairness across
    // transactions to prevent starvation. For example, if multiple read-only transactions
    // are started one after another the implementation must not indefinitely prevent a
    // pending read/write transaction from starting." Using the RwLock means the IdbStore is
    // serializable, but not strictly so because the RwLock is not fair and so we don't
    // guarantee temporal ordering (anyone waiting might acquire the lock).
    //
    // It's possible we should have gone the other way and made memstore have the idb
    // interface. However the thing we should not do is have memstore and idbstore work differently.
    db: RwLock<IdbDatabase>,
}

impl IdbStore {
    pub async fn new(name: &str) -> Result<IdbStore> {
        let v = open_database(name).await?;
        let db: IdbDatabase = v.unchecked_into();

        Ok(IdbStore {
            db: RwLock::new(db),
        })
    }

    pub async fn drop_store(name: &str) -> Result<()> {
        drop_store(name).await?;
        Ok(())
    }

    pub async fn name(&self) -> String {
        self.db.read().await.name()
    }
}

#[async_trait(?Send)]
impl Store for IdbStore {
    async fn read<'a>(&'a self, _lc: LogContext) -> Result<Box<dyn Read + 'a>> {
        let db_guard = self.db.read().await;
        let tx = read_transaction(&db_guard)?;
        Ok(Box::new(ReadTransaction::new(db_guard, tx)))
    }

    async fn write<'a>(&'a self, _lc: LogContext) -> Result<Box<dyn Write + 'a>> {
        let db_guard = self.db.write().await;
        let tx = write_transaction(&db_guard)?;
        Ok(Box::new(WriteTransaction::new(db_guard, tx)))
    }

    async fn close(&self) {
        let db_guard = self.db.read().await;
        db_guard.close();
    }
}

struct ReadTransaction<'a> {
    _db: RwLockReadGuard<'a, IdbDatabase>, // Not referenced, holding lock.
    tx: IdbTransaction,
}

impl ReadTransaction<'_> {
    fn new(db: RwLockReadGuard<'_, IdbDatabase>, tx: IdbTransaction) -> ReadTransaction {
        ReadTransaction { _db: db, tx }
    }
}

#[async_trait(?Send)]
impl Read for ReadTransaction<'_> {
    async fn has(&self, key: &str) -> Result<bool> {
        has_impl(&self.tx, key).await
    }

    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        get_impl(&self.tx, key).await
    }
}

async fn has_impl(tx: &IdbTransaction, key: &str) -> Result<bool> {
    let v = db_has(tx, key).await?;
    Ok(v == JsValue::TRUE)
}

async fn get_impl(tx: &IdbTransaction, key: &str) -> Result<Option<Vec<u8>>> {
    let v = db_get(tx, key).await?;
    Ok(if v.is_undefined() {
        None
    } else {
        Some(v.unchecked_into::<js_sys::Uint8Array>().to_vec())
    })
}

#[derive(PartialEq, Eq, Debug)]
enum WriteState {
    Open,
    Committed,
    Aborted,
}

struct WriteTransaction<'a> {
    _db: RwLockWriteGuard<'a, IdbDatabase>, // Not referenced, holding lock.
    tx: IdbTransaction,
    pending: Mutex<HashMap<String, Option<Vec<u8>>>>,
}

impl WriteTransaction<'_> {
    fn new(db: RwLockWriteGuard<'_, IdbDatabase>, tx: IdbTransaction) -> WriteTransaction {
        WriteTransaction {
            _db: db,
            tx,
            pending: Mutex::new(HashMap::new()),
        }
    }
}

#[async_trait(?Send)]
impl Read for WriteTransaction<'_> {
    async fn has(&self, key: &str) -> Result<bool> {
        match self.pending.lock().await.get(key) {
            Some(Some(_)) => Ok(true),
            Some(None) => Ok(false),
            None => has_impl(&self.tx, key).await,
        }
    }

    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        match self.pending.lock().await.get(key) {
            Some(Some(v)) => Ok(Some(v.to_vec())),
            Some(None) => Ok(None),
            None => get_impl(&self.tx, key).await,
        }
    }
}

#[async_trait(?Send)]
impl Write for WriteTransaction<'_> {
    fn as_read(&self) -> &dyn Read {
        self
    }

    // We hold writes in memory until the API user calls commit
    // to ensure that we don't let partial transactions auto-commit.
    async fn put(&self, key: &str, value: &[u8]) -> Result<()> {
        self.pending
            .lock()
            .await
            .insert(key.into(), Some(value.to_vec()));
        Ok(())
    }

    async fn del(&self, key: &str) -> Result<()> {
        self.pending.lock().await.insert(key.into(), None);
        Ok(())
    }

    async fn commit(self: Box<Self>) -> Result<()> {
        // Define rollback() to succeed if no writes have occurred, even if
        // the underlying transaction has exited. Users who expose themselves
        // to this would notice if they performed any reads after exposing
        // themselves to a situation where the transaction would autocommit.
        let pending = self.pending.lock().await;
        if pending.is_empty() {
            return Ok(());
        }

        // Creates an array of [[key, val], [key, val]]
        let js_entries: js_sys::Array = pending
            .iter()
            .map(|(k, v)| {
                let k = JsValue::from_str(k);
                let v: JsValue = match v {
                    Some(v) => js_sys::Uint8Array::from(&v[..]).into(),
                    None => JsValue::NULL,
                };
                js_sys::Array::of2(&k, &v)
            })
            .collect();
        let js_state = js_commit(&self.tx, &js_entries).await?;
        let state: WriteState = js_state.try_into()?;
        if state != WriteState::Committed {
            return Err(StoreError::Str("Transaction aborted".into()));
        }
        Ok(())
    }

    async fn rollback(self: Box<Self>) -> Result<()> {
        // Define rollback() to succeed if no writes have occurred, even if
        // the underlying transaction has exited.
        if self.pending.lock().await.is_empty() {
            return Ok(());
        }

        match transaction_state(&self.tx).await? {
            WriteState::Committed | WriteState::Aborted => return Ok(()),
            _ => (),
        }

        let js_state = js_abort(&self.tx).await?;
        let state: WriteState = js_state.try_into()?;
        if state != WriteState::Aborted {
            return Err(StoreError::Str("Transaction abort failed".into()));
        }
        Ok(())
    }
}

async fn transaction_state(tx: &IdbTransaction) -> Result<WriteState> {
    let js = transaction_state_js(tx).await?;
    js.try_into()
}

impl TryInto<WriteState> for JsValue {
    type Error = StoreError;

    fn try_into(self) -> Result<WriteState> {
        match self.as_f64() {
            Some(f) => match f as u8 {
                0 => Ok(WriteState::Open),
                1 => Ok(WriteState::Committed),
                2 => Ok(WriteState::Aborted),
                _ => Err(StoreError::Str("Invalid state".into())),
            },
            _ => Err(StoreError::Str("Invalid state".into())),
        }
    }
}

mod tests {
    // Idbstore is integration tested because web_sys only lives in browsers.
    // See tests/ at top level.
}
