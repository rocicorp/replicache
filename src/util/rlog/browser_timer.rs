extern crate web_sys;
use super::super::wasm::performance_now;

pub struct Timer {
    start_ms: f64,
}

impl Default for Timer {
    fn default() -> Self {
        Timer::new()
    }
}

impl Timer {
    pub fn new() -> Timer {
        // Consider using Date.now() since we do not use the fractions anyway
        Timer {
            start_ms: performance_now(),
        }
    }

    pub fn elapsed_ms(self) -> u64 {
        (performance_now() - self.start_ms) as u64
    }
}
