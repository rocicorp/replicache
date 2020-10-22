use async_fn::AsyncFn1;
use js_sys::Reflect;
use log::error;
use std::cmp;
use thousands::Separable;
pub use wasm_bench_macro::wasm_bench;
use wasm_bindgen::JsValue;
use web_sys::Performance;

pub fn performance() -> Performance {
    use wasm_bindgen::JsCast;
    let global = js_sys::global();
    let key = JsValue::from_str("performance");
    Reflect::get(&global, &key)
        .expect("could not get performance")
        .dyn_into()
        .expect("invalid performance")
}

fn now_nanos() -> u64 {
    return (performance().now() * 1e6) as u64;
}

pub struct Bench {
    iterations: u64,
    ns_start: u64, // Non-zero iff timer is currently running.
    ns_elapsed: u64,
    pub bytes: u64,
}

impl Bench {
    fn new() -> Bench {
        Bench {
            iterations: 0,
            ns_start: 0,
            ns_elapsed: 0,
            bytes: 0,
        }
    }

    pub fn iterations(&self) -> u64 {
        self.iterations
    }

    pub fn ns_elapsed(&self) -> u64 {
        self.ns_elapsed
    }

    pub fn ns_per_iter(&self) -> u64 {
        if self.iterations == 0 {
            0
        } else {
            self.ns_elapsed() / cmp::max(self.iterations, 1)
        }
    }

    pub fn start_timer(&mut self) {
        self.ns_start = now_nanos();
    }

    pub fn stop_timer(&mut self) {
        let now = now_nanos();
        self.ns_elapsed += now - self.ns_start;
        self.ns_start = 0;
    }

    pub fn reset_timer(&mut self) {
        self.ns_elapsed = 0;
    }
}

pub async fn benchmark<F>(name: &str, f: F)
where
    F: for<'a> AsyncFn1<&'a mut Bench, Output = ()>,
{
    const GOAL_NS: u64 = 1_000_000_000;
    let mut b = Bench::new();

    // Loop based on https://golang.org/src/testing/benchmark.go's launch().
    let mut n = 1;

    while b.ns_elapsed() < GOAL_NS {
        let prev_n = n;
        let prev_ns = cmp::max(b.ns_elapsed(), 1);

        n = GOAL_NS * prev_n / prev_ns;
        n += n / 5;
        n = cmp::min(n, 100 * prev_n);
        n = cmp::max(n, prev_n + 1);
        n = cmp::min(n, 1e9 as u64);
        b.iterations = n;
        b.start_timer();
        b.reset_timer();
        f.call(&mut b).await;
        b.stop_timer();
    }

    let mut extra: String = "".into();
    if b.bytes != 0 {
        let mbps = ((b.bytes * b.iterations) as f64 / 1e6) / (b.ns_elapsed() as f64 / 1e9);
        extra = format!(" {:.2} MB/s", mbps);
    }
    error!(
        "{} {} {} ns/iter{}",
        name,
        b.iterations,
        b.ns_per_iter().separate_with_commas(),
        extra
    );
}
