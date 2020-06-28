use crate::kv::{Store, StoreError};
use async_trait::async_trait;
use futures::channel::oneshot;
use log::warn;
use wasm_bindgen::closure::Closure;
use wasm_bindgen::{JsCast, JsValue};
use web_sys::IdbDatabase;

type Result<T> = std::result::Result<T, StoreError>;

impl From<JsValue> for StoreError {
    fn from(err: JsValue) -> StoreError {
        // TODO(nate): Pick out a useful subset of this value.
        StoreError::Str(format!("{:?}", err))
    }
}

impl From<futures::channel::oneshot::Canceled> for StoreError {
    fn from(_e: futures::channel::oneshot::Canceled) -> StoreError {
        StoreError::Str("oneshot cancelled".to_string())
    }
}

pub struct IdbStore {
    idb: IdbDatabase,
}

const OBJECT_STORE: &str = "chunks";

impl IdbStore {
    pub async fn new(name: &str) -> Result<Option<IdbStore>> {
        let window = match web_sys::window() {
            Some(w) => w,
            None => return Ok(None),
        };
        let factory = match window.indexed_db()? {
            Some(f) => f,
            None => return Ok(None),
        };
        let request = factory.open(name)?;
        let (sender, receiver) = oneshot::channel::<()>();
        let callback = Closure::once(move || {
            if let Err(_) = sender.send(()) {
                warn!("oneshot send failed");
            }
        });
        let request_copy = request.clone();
        let onupgradeneeded = Closure::once(move |_event: web_sys::IdbVersionChangeEvent| {
            let result = match request_copy.result() {
                Ok(r) => r,
                Err(e) => {
                    warn!("Error before ugradeneeded: {:?}", e);
                    return;
                }
            };
            let db = web_sys::IdbDatabase::unchecked_from_js(result);

            if let Err(e) = db.create_object_store(OBJECT_STORE) {
                warn!("Create object store failed: {:?}", e);
            }
        });
        request.set_onsuccess(Some(callback.as_ref().unchecked_ref()));
        request.set_onerror(Some(callback.as_ref().unchecked_ref()));
        request.set_onupgradeneeded(Some(onupgradeneeded.as_ref().unchecked_ref()));
        receiver.await?;
        Ok(Some(IdbStore {
            idb: request.result()?.into(),
        }))
    }
}

#[async_trait(?Send)]
impl Store for IdbStore {
    async fn put(&mut self, key: &str, value: &[u8]) -> Result<()> {
        let tx = self
            .idb
            .transaction_with_str_and_mode(OBJECT_STORE, web_sys::IdbTransactionMode::Readwrite)?;

        let (sender, txdonereceiver) = oneshot::channel::<()>();
        let callback = Closure::once(move || {
            if let Err(_) = sender.send(()) {
                warn!("oneshot send failed");
            }
        });
        tx.set_oncomplete(Some(callback.as_ref().unchecked_ref()));

        let store = tx.object_store(OBJECT_STORE)?;
        let request = store.put_with_key(&js_sys::Uint8Array::from(value), &key.into())?;
        let (sender, receiver) = oneshot::channel::<()>();
        let putcallback = Closure::once(move || {
            if let Err(_) = sender.send(()) {
                warn!("oneshot send failed");
            }
        });
        request.set_onsuccess(Some(putcallback.as_ref().unchecked_ref()));
        request.set_onerror(Some(putcallback.as_ref().unchecked_ref()));
        receiver.await?;

        // TODO(nate): Move into WriteTransaction.commit().
        txdonereceiver.await?;
        Ok(())
    }

    async fn has(&self, key: &str) -> Result<bool> {
        let tx = self.idb.transaction_with_str(OBJECT_STORE)?;
        let store = tx.object_store(OBJECT_STORE)?;
        let request = store.count_with_key(&key.into())?;
        let (sender, receiver) = oneshot::channel::<()>();
        let callback = Closure::once(move || {
            if let Err(_) = sender.send(()) {
                warn!("oneshot send failed");
            }
        });
        request.set_onsuccess(Some(callback.as_ref().unchecked_ref()));
        request.set_onerror(Some(callback.as_ref().unchecked_ref()));
        receiver.await?;
        Ok(match request.result()?.as_f64() {
            Some(v) if v >= 1.0 => true,
            _ => false,
        })
    }

    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        let tx = self.idb.transaction_with_str(OBJECT_STORE)?;
        let store = tx.object_store(OBJECT_STORE)?;
        let request = store.get(&key.into())?;
        let (sender, receiver) = oneshot::channel::<()>();
        let callback = Closure::once(move || {
            if let Err(_) = sender.send(()) {
                warn!("oneshot send failed");
            }
        });
        request.set_onsuccess(Some(callback.as_ref().unchecked_ref()));
        request.set_onerror(Some(callback.as_ref().unchecked_ref()));
        receiver.await?;
        Ok(match request.result()? {
            v if v.is_undefined() => None,
            v => Some(js_sys::Uint8Array::new(&v).to_vec()),
        })
    }
}
