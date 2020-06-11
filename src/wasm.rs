use sha2::{Sha512, Digest};
use wee_alloc;
use wasm_bindgen::prelude::*;

use crate::chunk::Chunk;

// Use `wee_alloc` as the global allocator.
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub fn hash(data: &str) -> String {
    let c = Chunk::new(data.as_bytes().to_vec());
    c.hash().to_string()
}
