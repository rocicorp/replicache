mod buzhash;
pub mod chunker;
mod leaf;
#[allow(unused_imports)]
mod leaf_generated;
pub mod map;

#[allow(dead_code)]
#[derive(Debug, Eq, PartialEq, Copy, Clone)]
pub struct Entry<'a> {
    pub key: &'a [u8],
    pub val: &'a [u8],
}
