use futures::channel::oneshot;
use wasm_bindgen::{JsCast, JsValue};
use wasm_bindgen::closure::Closure;
use web_sys::IdbDatabase;

pub struct IdbStore {
    idb: IdbDatabase
}

impl IdbStore {
    pub async fn new(name: &str) -> Result<Option<IdbStore>, JsValue> {
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
            sender.send(());
        });
        request.set_onsuccess(Some(callback.as_ref().unchecked_ref()));
        request.set_onerror(Some(callback.as_ref().unchecked_ref()));
        receiver.await;
        let idb: IdbDatabase = match request.result() {
            Ok(v) => v.into(),
            Err(v) => return Err(v)
        };
        Ok(Some(IdbStore{idb: idb}))
    }
}
