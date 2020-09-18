use super::errors::TimerError;
use std::time::Instant;

pub struct Timer {
    start: Instant,
}

impl Timer {
    pub fn new() -> Result<Timer, TimerError> {
        Ok(Timer {
            start: Instant::now(),
        })
    }

    pub fn elapsed_ms(self) -> u64 {
        self.start.elapsed().as_millis() as u64
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_timer() {
        let timer = Timer::new().unwrap();
        let ten_ms = std::time::Duration::from_millis(10);
        std::thread::sleep(ten_ms);
        assert!(timer.elapsed_ms() > 0);
    }
}
