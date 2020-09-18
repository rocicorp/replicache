extern crate web_sys;
use super::errors::TimerError;

pub struct Timer {
    start_ms: u64,
}

impl Timer {
    pub fn new() -> Result<Timer, TimerError> {
        // We could use console::time_with_label here if we wanted.
        let start_ms = now_ms()?;
        Ok(Timer { start_ms })
    }

    pub fn elapsed_ms(self) -> Result<u64, TimerError> {
        let end_ms = now_ms()?;
        Ok(end_ms - self.start_ms)
    }
}

fn now_ms() -> Result<u64, TimerError> {
    use TimerError::*;
    let ms = web_sys::window()
        .ok_or(NoWindow)?
        .performance()
        .ok_or(NoPerformanceTimer)?
        .now() as u64;
    Ok(ms)
}
