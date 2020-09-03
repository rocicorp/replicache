use wasm_bench::*;
use crate::hash::Hash;

#[wasm_bench]
async fn hash_encode(b: &mut Bench) {
    let h = Hash::of("foobar".as_bytes());
    b.reset_timer();

    for _ in 0..b.iterations() {
        let _ = h.to_string();
    }
}
