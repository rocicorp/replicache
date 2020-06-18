use std::io::Write;

use wee_alloc;
use wasm_bindgen::prelude::*;

use crate::idbstore::IdbStore;
use crate::prolly::buzhash::BuzHash;

// Use `wee_alloc` as the global allocator.
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub async fn newReplicache(name: String) {
    initPanicHook();
    IdbStore::new(&name).await;
}

#[wasm_bindgen]
pub fn buzhash() {
    initPanicHook();
    let mut h = BuzHash::new(32);
    h.hash_byte(b'f');
}

fn initPanicHook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}
