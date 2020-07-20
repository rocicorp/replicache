use wasm_bench::*;
use wasm_bindgen_test::*;

mod idbstore;

wasm_bindgen_test_configure!(run_in_browser);

#[wasm_bench]
async fn performance_now(b: &mut Bench) {
    let window = web_sys::window().expect("should have a window in this context");
    let performance = window
        .performance()
        .expect("performance should be available");

    let n = b.iterations();
    for _ in 0..n {
        || -> u64 { (performance.now() * 1e6) as u64 }();
    }
}
