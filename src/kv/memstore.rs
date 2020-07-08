use crate::kv::{Read, Result, Store, Write};
use async_std::sync::Mutex;
use async_trait::async_trait;
use std::collections::HashMap;

pub struct MemStore {
    map: Mutex<HashMap<String, Vec<u8>>>,
}

impl MemStore {
    pub fn new() -> MemStore {
        MemStore {
            map: Mutex::new(HashMap::new()),
        }
    }
}

impl Default for MemStore {
    fn default() -> Self {
        MemStore::new()
    }
}

#[async_trait(?Send)]
impl Store for MemStore {
    async fn read<'a>(&'a self) -> Result<Box<dyn Read + 'a>> {
        Ok(Box::new(ReadTransaction::new(self)))
    }

    async fn write<'a>(&'a self) -> Result<Box<dyn Write + 'a>> {
        Ok(Box::new(WriteTransaction::new(self)))
    }
}

struct ReadTransaction<'a> {
    store: &'a MemStore,
}

impl ReadTransaction<'_> {
    fn new(store: &MemStore) -> ReadTransaction {
        ReadTransaction { store }
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
    pending: Mutex<HashMap<String, Option<Vec<u8>>>>,
}

impl WriteTransaction<'_> {
    fn new(store: &MemStore) -> WriteTransaction {
        WriteTransaction {
            rt: ReadTransaction { store },
            pending: Mutex::new(HashMap::new()),
        }
    }
}

#[async_trait(?Send)]
impl Read for WriteTransaction<'_> {
    async fn has(&self, key: &str) -> Result<bool> {
        match self.pending.lock().await.get(key) {
            Some(Some(_)) => Ok(true),
            Some(None) => Ok(false),
            None => self.rt.has(key).await,
        }
    }

    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        match self.pending.lock().await.get(key) {
            Some(Some(v)) => Ok(Some(v.to_vec())),
            Some(None) => Ok(None),
            None => self.rt.get(key).await,
        }
    }
}

#[async_trait(?Send)]
impl Write for WriteTransaction<'_> {
    fn as_read(&self) -> &dyn Read {
        self
    }

    async fn put(&self, key: &str, value: &[u8]) -> Result<()> {
        self.pending
            .lock()
            .await
            .insert(key.into(), Some(value.to_vec()));
        Ok(())
    }

    async fn del(&self, key: &str) -> Result<()> {
        self.pending.lock().await.insert(key.into(), None);
        Ok(())
    }

    async fn commit(self: Box<Self>) -> Result<()> {
        let pending = self.pending.lock().await;
        let mut map = self.rt.store.map.lock().await;
        for item in pending.iter() {
            match item.1 {
                Some(v) => map.insert(item.0.clone(), v.clone()),
                None => map.remove(item.0),
            };
        }
        Ok(())
    }

    async fn rollback(self: Box<Self>) -> Result<()> {
        Ok(())
    }
}

#[cfg(not(target_arch = "wasm32"))]
#[cfg(test)]
mod tests {
    use super::*;
    use crate::kv::StoreError;

    #[async_std::test]
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

        let wt = ms.write().await?;
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

    #[async_std::test]
    async fn delete() -> std::result::Result<(), StoreError> {
        let mut ms = MemStore::new();
        ms.put("bar", "foo".as_bytes()).await?;

        let wt = ms.write().await?;
        assert_eq!(true, wt.has("bar").await?);
        wt.del("bar").await?;
        assert_eq!(false, wt.has("bar").await?);
        wt.put("bar", b"overwrite").await?;
        assert_eq!(true, wt.has("bar").await?);
        assert_eq!(Some(b"overwrite".to_vec()), wt.get("bar").await?);
        wt.del("bar").await?;
        wt.commit().await?;

        let rt = ms.read().await?;
        assert_eq!(false, rt.has("bar").await?);

        Ok(())
    }
}
