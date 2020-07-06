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
    async fn read<'a>(&'a self) -> Result<Box<dyn Read + 'a>>;
    async fn write<'a>(&'a self) -> Result<Box<dyn Write + 'a>>;

    async fn put(&mut self, key: &str, value: &[u8]) -> Result<()> {
        let wt = self.write().await?;
        wt.put(key, value).await?;
        Ok(wt.commit().await?)
    }

    async fn has(&self, key: &str) -> Result<bool> {
        Ok(self.read().await?.has(key).await?)
    }

    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        Ok(self.read().await?.get(key).await?)
    }
}

#[async_trait(?Send)]
pub trait Read {
    async fn has(&self, key: &str) -> Result<bool>;
    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>>;
}

#[async_trait(?Send)]
pub trait Write: Read {
    fn as_read<'a>(&'a self) -> &'a dyn Read;

    async fn put(&self, key: &str, value: &[u8]) -> Result<()>;
    async fn del(&self, key: &str) -> Result<()>;

    async fn commit(self: Box<Self>) -> Result<()>;
    async fn rollback(self: Box<Self>) -> Result<()>;
}
