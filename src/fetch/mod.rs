#[cfg(not(target_arch = "wasm32"))]
const DEFAULT_FETCH_TIMEOUT_SECS: u64 = 10;

#[cfg(not(target_arch = "wasm32"))]
pub mod client;

#[cfg(not(target_arch = "wasm32"))]
mod tokio_compat;

pub mod errors;
mod timeout;
