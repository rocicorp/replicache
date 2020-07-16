mod buzhash;
mod chunker;
mod leaf;
#[allow(unused_imports)]
mod leaf_generated;
mod map;

pub use map::{FlushError, LoadError, Map};

#[allow(dead_code)]
#[derive(Debug, Eq, PartialEq, Copy, Clone)]
pub struct Entry<'a> {
    pub key: &'a [u8],
    pub val: &'a [u8],
}
