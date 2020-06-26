pub mod idbstore;

use async_trait::async_trait;

#[derive(Debug)]
pub enum StoreError {
    Str(String),
}

type Result<T> = std::result::Result<T, StoreError>;

#[async_trait(?Send)]
pub trait Store {
    async fn put(self: &Self, key: &[u8], value: &[u8]) -> Result<()>;
    async fn has(self: &Self, key: &[u8]) -> Result<bool>;
    async fn get(self: &Self, key: &[u8]) -> Result<Option<Vec<u8>>>;
}
