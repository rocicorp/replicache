use crate::kv::{Read, Result, Store, StoreError, Write};
use async_std::sync::Mutex;
use async_trait::async_trait;
use std::collections::HashMap;

pub struct MemStore {
    map: Mutex<HashMap<String, Vec<u8>>>,
}

impl MemStore {
    #[allow(dead_code)]
    pub fn new() -> MemStore {
        MemStore {
            map: Mutex::new(HashMap::new()),
        }
    }
}

#[async_trait(?Send)]
impl Store for MemStore {
    async fn read<'a>(&'a self) -> Result<Box<dyn Read + 'a>> {
        return Ok(Box::new(ReadTransaction::new(self)));
    }

    async fn write<'a>(&'a self) -> Result<Box<dyn Write + 'a>> {
        return Ok(Box::new(WriteTransaction::new(self)));
    }

    async fn put(&mut self, key: &str, value: &[u8]) -> Result<()> {
        self.map
            .lock()
            .await
            .insert(key.to_string(), value.to_vec());
        Ok(())
    }

    async fn has(&self, key: &str) -> Result<bool> {
        Ok(self.map.lock().await.contains_key(key))
    }

    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        match self.map.lock().await.get(key) {
            None => Ok(None),
            Some(v) => Ok(Some(v.to_vec())),
        }
    }
}

struct ReadTransaction<'a> {
    store: &'a MemStore,
}

impl ReadTransaction<'_> {
    fn new(store: &MemStore) -> ReadTransaction {
        return ReadTransaction { store: store };
    }
}

#[async_trait(?Send)]
impl Read for ReadTransaction<'_> {
    async fn has(&self, key: &str) -> Result<bool> {
        Ok(self.store.map.lock().await.contains_key(key))
    }

    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        match self.store.map.lock().await.get(key) {
            None => Ok(None),
            Some(v) => Ok(Some(v.to_vec())),
        }
    }
}

struct WriteTransaction<'a> {
    rt: ReadTransaction<'a>,
    pending: Mutex<HashMap<String, Vec<u8>>>,
    open: bool,
}

impl WriteTransaction<'_> {
    fn new(store: &MemStore) -> WriteTransaction {
        return WriteTransaction {
            rt: ReadTransaction { store },
            pending: Mutex::new(HashMap::new()),
            open: true,
        };
    }

    fn check_open(&self) -> Result<()> {
        match self.open {
            true => Ok(()),
            false => Err(StoreError::Str("Transaction already closed".into())),
        }
    }
}

#[async_trait(?Send)]
impl Read for WriteTransaction<'_> {
    async fn has(&self, key: &str) -> Result<bool> {
        self.check_open()?;
        match self.pending.lock().await.contains_key(key) {
            true => Ok(true),
            false => self.rt.has(key).await,
        }
    }
    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        self.check_open()?;
        match self.pending.lock().await.get(key) {
            Some(v) => Ok(Some(v.to_vec())),
            None => self.rt.get(key).await,
        }
    }
}

#[async_trait(?Send)]
impl Write for WriteTransaction<'_> {
    fn as_read<'a>(&'a self) -> &'a dyn Read {
        self
    }
    async fn put(&self, key: &str, value: &[u8]) -> Result<()> {
        self.check_open()?;
        self.pending
            .lock()
            .await
            .insert(key.to_string(), value.to_vec());
        Ok(())
    }

    async fn commit(&mut self) -> Result<()> {
        self.check_open()?;
        let mut pending = self.pending.lock().await;
        let pending_ref: &HashMap<String, Vec<u8>> = &pending;
        self.rt
            .store
            .map
            .lock()
            .await
            .extend(pending_ref.into_iter().map(|(k, v)| (k.clone(), v.clone())));
        pending.clear();
        self.open = false;
        Ok(())
    }

    async fn rollback(&mut self) -> Result<()> {
        self.check_open()?;
        self.pending.lock().await.clear();
        self.open = false;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[async_std::test]
    #[cfg(not(target_arch = "wasm32"))]
    async fn basics() -> std::result::Result<(), StoreError> {
        let mut ms = MemStore::new();
        assert_eq!(false, ms.has("foo").await?);
        assert_eq!(None, ms.get("foo").await?);
        ms.put("foo", "bar".as_bytes()).await?;
        assert_eq!(true, ms.has("foo").await?);
        assert_eq!(Some("bar".as_bytes().to_vec()), ms.get("foo").await?);
        assert_eq!(false, ms.has("bar").await?);
        assert_eq!(None, ms.get("bar").await?);

        let rt = ms.read().await?;
        assert_eq!(false, rt.has("bar").await?);
        assert_eq!(None, rt.get("bar").await?);

        let mut wt = ms.write().await?;
        assert_eq!(false, wt.has("bar").await?);
        wt.put("bar", b"baz").await?;
        assert_eq!(Some(b"baz".to_vec()), wt.get("bar").await?);
        assert_eq!(None, rt.get("bar").await?); // Test isolation.
        wt.commit().await?;

        let rt = ms.read().await?;
        assert_eq!(true, rt.has("bar").await?);
        assert_eq!(Some(b"baz".to_vec()), rt.get("bar").await?);

        Ok(())
    }
}
