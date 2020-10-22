extern crate web_sys;
use super::super::wasm::global_property;
use super::errors::TimerError;

pub struct Timer {
    start_ms: u64,
    performance: web_sys::Performance,
}

impl Timer {
    pub fn new() -> Result<Timer, TimerError> {
        // We could use console::time_with_label here if we wanted.
        let performance = get_performance()?;
        let start_ms = performance.now() as u64;
        Ok(Timer {
            start_ms,
            performance,
        })
    }

    pub fn elapsed_ms(self) -> u64 {
        let end_ms = self.performance.now() as u64;
        end_ms - self.start_ms
    }
}

fn get_performance() -> Result<web_sys::Performance, TimerError> {
    use TimerError::*;
    global_property("performance").map_err(|_| NoPerformanceTimer)
}
