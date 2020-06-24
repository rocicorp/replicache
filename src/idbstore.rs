use futures::channel::oneshot;
use wasm_bindgen::closure::Closure;
use wasm_bindgen::{JsCast, JsValue};
use web_sys::IdbDatabase;

pub struct IdbStore {
    #[allow(dead_code)]
    idb: IdbDatabase,
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
            if let Err(_) = sender.send(()) {
                log!("oneshot send failed");
            }
        });
        request.set_onsuccess(Some(callback.as_ref().unchecked_ref()));
        request.set_onerror(Some(callback.as_ref().unchecked_ref()));
        if let Err(e) = receiver.await {
            return Err(e.to_string().into());
        }
        let idb: IdbDatabase = match request.result() {
            Ok(v) => v.into(),
            Err(v) => return Err(v),
        };
        Ok(Some(IdbStore { idb: idb }))
    }
}
