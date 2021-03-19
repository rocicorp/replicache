use std::time::Instant;

pub struct Timer {
    start: Instant,
}

impl Default for Timer {
    fn default() -> Self {
        Timer::new()
    }
}

impl Timer {
    pub fn new() -> Timer {
        Timer {
            start: Instant::now(),
        }
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
        let timer = Timer::new();
        let ten_ms = std::time::Duration::from_millis(10);
        std::thread::sleep(ten_ms);
        assert!(timer.elapsed_ms() > 0);
    }
}
