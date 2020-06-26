pub mod idbstore;

use async_trait::async_trait;

#[derive(Debug)]
pub enum StoreError {
    Str(String),
}

type Result<T> = std::result::Result<T, StoreError>;

#[async_trait(?Send)]
pub trait Store {
    async fn put(self: &Self, key: &str, value: &[u8]) -> Result<()>;
    async fn has(self: &Self, key: &str) -> Result<bool>;
    async fn get(self: &Self, key: &str) -> Result<Option<Vec<u8>>>;
}
