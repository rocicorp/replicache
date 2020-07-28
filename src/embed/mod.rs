//! Replicache embedding API.
//!
//! This module provides a simple, stateless, message-oriented embedding
//! API suitable for exposure to embedders such as WASM or mobile
//! applications.
//!
//! It is designed to require little more than asynchronous
//! request/response message passing of byte arrays in and out so that
//! it can work with a variety of hosts.

mod dispatch;

pub use dispatch::dispatch;
