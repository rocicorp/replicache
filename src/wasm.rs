use log::warn;
use std::sync::Once;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

use crate::dag;
use crate::dispatch;
use crate::kv::idbstore::IdbStore;
use crate::kv::Store;
use crate::prolly::chunker::Chunker;
use crate::prolly::map::Map;

// Use `wee_alloc` as the global allocator.
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub async fn exercise_prolly() {
    init_panic_hook();
    let kv = IdbStore::new("foo").await.unwrap().unwrap();
    let mut store = dag::store::Store::new(Box::new(kv));
    let mut write = store.write().await.unwrap();
    let mut map = Map::new();
    map.put(b"foo".to_vec(), b"bar".to_vec());
    let h = map.flush(&mut write).await.unwrap();
    warn!("{}", h);
}

#[cfg(not(default))]
pub async fn new_idbstore(name: String) -> Option<Box<dyn Store>> {
    init_panic_hook();
    match IdbStore::new(&name).await {
        Ok(Some(v)) => Some(Box::new(v)),
        _ => None,
    }
}

#[wasm_bindgen]
pub fn buzhash() {
    init_panic_hook();
    let mut c = Chunker::default();
    c.hash_byte(b'f');
}

#[wasm_bindgen]
pub async fn dispatch(db_name: String, rpc: String, args: String) -> Result<String, JsValue> {
    init_panic_hook();
    match dispatch::dispatch(db_name, rpc, args).await {
        Err(v) => Err(JsValue::from_str(&v[..])),
        Ok(v) => Ok(v),
    }
}

static INIT: Once = Once::new();

fn init_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
    INIT.call_once(|| {
        if let Err(e) = console_log::init_with_level(log::Level::Info) {
            web_sys::console::error_1(&format!("Error registering console_log: {}", e).into());
        }
    });
}
