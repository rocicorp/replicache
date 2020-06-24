use wasm_bindgen::prelude::*;
use wee_alloc;

use crate::idbstore::IdbStore;
use crate::prolly::chunker::Chunker;

// Use `wee_alloc` as the global allocator.
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub async fn new_replicache(name: String) {
    init_panic_hook();
    IdbStore::new(&name).await.expect("IdbStore::new failed");
}

#[wasm_bindgen]
pub fn buzhash() {
    init_panic_hook();
    let mut c = Chunker::default();
    c.hash_byte(b'f');
}

fn init_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}
