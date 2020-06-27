pub mod idbstore;
pub mod memstore;

use async_trait::async_trait;
use std::fmt;

#[derive(Debug)]
pub enum StoreError {
    Str(String),
}

impl fmt::Display for StoreError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            StoreError::Str(s) => write!(f, "{}", s),
        }
    }
}

type Result<T> = std::result::Result<T, StoreError>;

#[async_trait(?Send)]
pub trait Store {
    async fn put(&mut self, key: &str, value: &[u8]) -> Result<()>;
    async fn has(&self, key: &str) -> Result<bool>;
    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>>;
}
