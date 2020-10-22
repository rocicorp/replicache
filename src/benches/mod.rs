use rand::Rng;
use wasm_bench::*;
use wasm_bindgen_test::*;

mod dispatch;
mod hash;
mod idbstore;

wasm_bindgen_test_configure!(run_in_browser);

fn random_bytes(len: u64) -> Vec<u8> {
    (0..len).map(|_| rand::random::<u8>()).collect()
}

fn random_string(len: usize) -> String {
    let mut rng = rand::thread_rng();
    std::iter::repeat(())
        .map(|_| rng.sample(rand::distributions::Alphanumeric))
        .take(len)
        .collect()
}

#[wasm_bench]
async fn performance_now(b: &mut Bench) {
    let p = performance();

    let n = b.iterations();
    for _ in 0..n {
        || -> u64 { (p.now() * 1e6) as u64 }();
    }
}
