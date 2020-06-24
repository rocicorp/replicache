pub mod wasm;

extern crate async_std;
#[macro_use]
extern crate lazy_static;

#[macro_use]
mod console;
mod dag;
mod dispatch;
mod kv;
mod prolly;
