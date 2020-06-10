use crate::hash::Hash;
use sha2::{Sha512, Digest};
use wee_alloc;
use wasm_bindgen::prelude::*;

// Use `wee_alloc` as the global allocator.
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub fn hash(data: &str) -> String {
    let h = Hash::of(data.as_bytes());
    h.to_string()
}
