#[macro_use]
pub mod util;

//#[cfg(not(target_arch = "wasm32"))]
//mod ffi;

pub mod wasm;

extern crate async_std;

#[macro_use]
extern crate lazy_static;
extern crate log;
extern crate maplit;
extern crate str_macro;

pub mod checksum;
mod dag;
pub mod db;
pub mod embed;
pub mod fetch;
mod hash;
pub mod sync;

#[cfg(not(default))]
pub mod kv;

#[cfg(default)]
mod kv;

mod prolly;

#[cfg(feature = "benchmark")]
pub mod benches;
