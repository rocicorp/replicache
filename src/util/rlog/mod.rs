#[macro_use]
pub mod logger;
#[cfg_attr(target_arch = "wasm32", path = "browser_timer.rs")]
#[cfg_attr(not(target_arch = "wasm32"), path = "rust_timer.rs")]
mod timer;

pub use logger::LogContext;
pub use timer::Timer;
