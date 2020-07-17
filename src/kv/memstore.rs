use crate::kv::{Read, Result, Store, Write};
use async_std::sync::{Mutex, RwLock, RwLockReadGuard, RwLockWriteGuard};
use async_trait::async_trait;
use std::collections::HashMap;

pub struct MemStore {
    map: RwLock<HashMap<String, Vec<u8>>>,
}

impl MemStore {
    pub fn new() -> MemStore {
        MemStore {
            map: RwLock::new(HashMap::new()),
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
        let guard = self.map.read().await;
        Ok(Box::new(ReadTransaction::new(guard)))
    }

    async fn write<'a>(&'a self) -> Result<Box<dyn Write + 'a>> {
        let guard = self.map.write().await;
        Ok(Box::new(WriteTransaction::new(guard)))
    }
}

struct ReadTransaction<'a> {
    guard: RwLockReadGuard<'a, HashMap<String, Vec<u8>>>,
}

impl ReadTransaction<'_> {
    fn new(guard: RwLockReadGuard<'_, HashMap<String, Vec<u8>>>) -> ReadTransaction {
        ReadTransaction { guard }
    }
}

#[async_trait(?Send)]
impl Read for ReadTransaction<'_> {
    async fn has(&self, key: &str) -> Result<bool> {
        Ok(self.guard.contains_key(key))
    }

    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        match self.guard.get(key) {
            None => Ok(None),
            Some(v) => Ok(Some(v.to_vec())),
        }
    }
}

struct WriteTransaction<'a> {
    guard: RwLockWriteGuard<'a, HashMap<String, Vec<u8>>>,
    pending: Mutex<HashMap<String, Option<Vec<u8>>>>,
}

impl WriteTransaction<'_> {
    fn new(guard: RwLockWriteGuard<'_, HashMap<String, Vec<u8>>>) -> WriteTransaction {
        WriteTransaction {
            guard: guard,
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
            None => Ok(self.guard.contains_key(key)),
        }
    }

    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        match self.pending.lock().await.get(key) {
            Some(Some(v)) => Ok(Some(v.to_vec())),
            Some(None) => Ok(None),
            None => match self.guard.get(key) {
                Some(v) => Ok(Some(v.to_vec())),
                None => Ok(None),
            },
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

    async fn commit(mut self: Box<Self>) -> Result<()> {
        let pending = self.pending.lock().await;
        for item in pending.iter() {
            match item.1 {
                Some(v) => self.guard.insert(item.0.clone(), v.clone()),
                None => self.guard.remove(item.0),
            };
        }
        Ok(())
    }

    async fn rollback(self: Box<Self>) -> Result<()> {
        // TODO(phritz): determine what happens to async calls pending on
        // a lock that has been dropped (eg, the pending mutex).
        Ok(())
    }
}

// TODO these tests should run against a Store trait object so we can test all types of
// stores, not just the memstore.
#[cfg(not(target_arch = "wasm32"))]
#[cfg(test)]
mod tests {
    use super::*;
    use crate::kv::StoreError;

    #[async_std::test]
    async fn test_store_trait() -> std::result::Result<(), StoreError> {
        let mut ms = MemStore::new();

        // Test put/has/get, which use read() and write() for one-shot txs.
        assert_eq!(false, ms.has("foo").await?);
        assert_eq!(None, ms.get("foo").await?);

        ms.put("foo", "bar".as_bytes()).await?;
        assert_eq!(true, ms.has("foo").await?);
        assert_eq!(Some("bar".as_bytes().to_vec()), ms.get("foo").await?);

        ms.put("foo", "baz".as_bytes()).await?;
        assert_eq!(true, ms.has("foo").await?);
        assert_eq!(Some("baz".as_bytes().to_vec()), ms.get("foo").await?);

        assert_eq!(false, ms.has("baz").await?);
        assert_eq!(None, ms.get("baz").await?);
        ms.put("baz", "bat".as_bytes()).await?;
        assert_eq!(true, ms.has("baz").await?);
        assert_eq!(Some("bat".as_bytes().to_vec()), ms.get("baz").await?);

        Ok(())
    }

    #[async_std::test]
    async fn test_read_transaction() -> std::result::Result<(), StoreError> {
        let mut ms = MemStore::new();
        ms.put("k1", "v1".as_bytes()).await?;

        let rt = ms.read().await?;
        assert_eq!(true, rt.has("k1").await?);
        assert_eq!(Some(b"v1".to_vec()), rt.get("k1").await?);

        Ok(())
    }

    #[async_std::test]
    async fn test_write_transaction() -> std::result::Result<(), StoreError> {
        let mut ms = MemStore::new();
        ms.put("k1", "v1".as_bytes()).await?;
        ms.put("k2", "v2".as_bytes()).await?;

        // Test put then commit.
        let wt = ms.write().await?;
        assert_eq!(true, wt.has("k1").await?);
        assert_eq!(true, wt.has("k2").await?);
        wt.put("k1", b"overwrite").await?;
        wt.commit().await?;
        assert_eq!(Some(b"overwrite".to_vec()), ms.get("k1").await?);
        assert_eq!(Some(b"v2".to_vec()), ms.get("k2").await?);

        // Test put then rollback.
        let wt = ms.write().await?;
        wt.put("k1", b"should be rolled back").await?;
        wt.rollback().await?;
        assert_eq!(Some(b"overwrite".to_vec()), ms.get("k1").await?);

        // Test del then commit.
        let wt = ms.write().await?;
        wt.del("k1").await?;
        assert_eq!(false, wt.has("k1").await?);
        wt.commit().await?;
        assert_eq!(false, ms.has("k1").await?);

        // Test del then rollback.
        assert_eq!(true, ms.has("k2").await?);
        let wt = ms.write().await?;
        wt.del("k2").await?;
        assert_eq!(false, wt.has("k2").await?);
        wt.rollback().await?;
        assert_eq!(true, ms.has("k2").await?);

        // Test overwrite multiple times then commit.
        let wt = ms.write().await?;
        wt.put("k2", b"overwrite").await?;
        wt.del("k2").await?;
        wt.put("k2", b"final").await?;
        wt.commit().await?;
        assert_eq!(Some(b"final".to_vec()), ms.get("k2").await?);

        // Test as_read.
        let wt = ms.write().await?;
        wt.put("k2", b"new value").await?;
        let rt = wt.as_read();
        assert_eq!(true, rt.has("k2").await?);
        assert_eq!(Some(b"new value".to_vec()), rt.get("k2").await?);

        Ok(())
    }

    #[async_std::test]
    async fn test_isolation() {
        let ms = MemStore::new();

        // Assert there can be multiple concurrent read txs...
        let r1 = ms.read().await.unwrap();
        let r2 = ms.read().await.unwrap();
        // and that while outstanding they prevent write txs...
        let dur = std::time::Duration::from_millis(100);
        let w = ms.write();
        assert!(async_std::future::timeout(dur, w).await.is_err());
        // until both the reads are done...
        drop(r1);
        let w = ms.write();
        assert!(async_std::future::timeout(dur, w).await.is_err());
        drop(r2);
        let w = ms.write().await.unwrap();

        // At this point we have a write tx outstanding. Assert that
        // we cannot open a read tx until it is closed.
        let r = ms.read();
        assert!(async_std::future::timeout(dur, r).await.is_err());
        w.rollback().await.unwrap();
        let r = ms.read().await.unwrap();
        assert!(!r.has("foo").await.unwrap());
    }
}
