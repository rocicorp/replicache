use core::future::Future;
use log::error;
use std::cmp;
pub use wasm_bench_macro::wasm_bench;

fn now_nanos() -> u64 {
    let window = web_sys::window().expect("should have a window in this context");
    let performance = window
        .performance()
        .expect("performance should be available");
    return (performance.now() * 1e6) as u64;
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

// Simplified workaround for async function pointers taking a reference from
// https://github.com/rustasync/team/issues/19#issuecomment-515051308.
pub trait AsyncFn1<A0> {
    type Output;
    type Future: Future<Output = Self::Output>;
    fn call(&self, a0: A0) -> Self::Future;
}

impl<A0, F, Fut> AsyncFn1<A0> for F
where
    F: Fn(A0) -> Fut,
    Fut: Future,
{
    type Output = Fut::Output;
    type Future = Fut;
    fn call(&self, a0: A0) -> Self::Future {
        self(a0)
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
        b.ns_per_iter(),
        extra
    );
}
