use wee_alloc;
use wasm_bindgen::prelude::*;

use crate::idbstore::IdbStore;

// Use `wee_alloc` as the global allocator.
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub async fn newReplicache(name: String) {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();

    IdbStore::new(&name).await;
}
