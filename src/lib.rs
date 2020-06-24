pub mod wasm;

extern crate async_std;
#[macro_use]
extern crate lazy_static;

mod chunk;
#[macro_use]
mod console;
mod dispatch;
mod hash;
mod idbstore;
mod prolly;
