//! Transactional storage for an immutable, content-addressed
//! directed acyclic graph.
//!
//! Nodes in the graph are affectionately named "chunks", and
//! the roots of the graph are known as "heads" (ala git).
//!
//! Each chunk has a unique hash, an opaque blob of data, and
//! zero or more references to other chunks.
//!
//! Chunks that are not reachable from any head are garbage
//! collected atomically with commit.
//!
//! Users must ensure that the hash uniquely identifies a
//! chunk: put()'ing a chunk with the same hash as some
//! existing chunk is a no-op, and no error will be
//! reported.
mod chunk;
mod key;
#[allow(unused_imports)]
mod meta_generated;
mod read;
mod store;
mod write;

pub use chunk::Chunk;
pub use key::Key;
pub use read::Read;
pub use store::Store;
pub use write::Write;

use crate::kv;

#[derive(Debug)]
pub enum Error {
    Storage(kv::StoreError),
    CorruptStore,
}

impl From<kv::StoreError> for Error {
    fn from(err: kv::StoreError) -> Error {
        Error::Storage(err)
    }
}

type Result<T> = std::result::Result<T, Error>;
