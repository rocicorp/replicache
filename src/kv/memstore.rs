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
    map: RwLockReadGuard<'a, HashMap<String, Vec<u8>>>,
}

impl ReadTransaction<'_> {
    fn new(map: RwLockReadGuard<'_, HashMap<String, Vec<u8>>>) -> ReadTransaction {
        ReadTransaction { map }
    }
}

#[async_trait(?Send)]
impl Read for ReadTransaction<'_> {
    async fn has(&self, key: &str) -> Result<bool> {
        Ok(self.map.contains_key(key))
    }

    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        match self.map.get(key) {
            None => Ok(None),
            Some(v) => Ok(Some(v.to_vec())),
        }
    }
}

struct WriteTransaction<'a> {
    map: RwLockWriteGuard<'a, HashMap<String, Vec<u8>>>,
    pending: Mutex<HashMap<String, Option<Vec<u8>>>>,
}

impl WriteTransaction<'_> {
    fn new(map: RwLockWriteGuard<'_, HashMap<String, Vec<u8>>>) -> WriteTransaction {
        WriteTransaction {
            map,
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
            None => Ok(self.map.contains_key(key)),
        }
    }

    async fn get(&self, key: &str) -> Result<Option<Vec<u8>>> {
        match self.pending.lock().await.get(key) {
            Some(Some(v)) => Ok(Some(v.to_vec())),
            Some(None) => Ok(None),
            None => Ok(self.map.get(key).map(|v| v.to_vec())),
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
                Some(v) => self.map.insert(item.0.clone(), v.clone()),
                None => self.map.remove(item.0),
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
        let ms = MemStore::new();

        // Test put/has/get, which use read() and write() for one-shot txs.
        assert!(!ms.has("foo").await?);
        assert_eq!(None, ms.get("foo").await?);

        ms.put("foo", b"bar").await?;
        assert!(ms.has("foo").await?);
        assert_eq!(Some(b"bar".to_vec()), ms.get("foo").await?);

        ms.put("foo", b"baz").await?;
        assert!(ms.has("foo").await?);
        assert_eq!(Some(b"baz".to_vec()), ms.get("foo").await?);

        assert!(!ms.has("baz").await?);
        assert_eq!(None, ms.get("baz").await?);
        ms.put("baz", b"bat").await?;
        assert!(ms.has("baz").await?);
        assert_eq!(Some(b"bat".to_vec()), ms.get("baz").await?);

        Ok(())
    }

    #[async_std::test]
    async fn test_read_transaction() -> std::result::Result<(), StoreError> {
        let ms = MemStore::new();
        ms.put("k1", b"v1").await?;

        let rt = ms.read().await?;
        assert!(rt.has("k1").await?);
        assert_eq!(Some(b"v1".to_vec()), rt.get("k1").await?);

        Ok(())
    }

    #[async_std::test]
    async fn test_write_transaction() -> std::result::Result<(), StoreError> {
        let ms = MemStore::new();
        ms.put("k1", b"v1").await?;
        ms.put("k2", b"v2").await?;

        // Test put then commit.
        let wt = ms.write().await?;
        assert!(wt.has("k1").await?);
        assert!(wt.has("k2").await?);
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
        assert!(!wt.has("k1").await?);
        wt.commit().await?;
        assert!(!ms.has("k1").await?);

        // Test del then rollback.
        assert_eq!(true, ms.has("k2").await?);
        let wt = ms.write().await?;
        wt.del("k2").await?;
        assert!(!wt.has("k2").await?);
        wt.rollback().await?;
        assert!(ms.has("k2").await?);

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
        assert!(rt.has("k2").await?);
        assert_eq!(Some(b"new value".to_vec()), rt.get("k2").await?);

        Ok(())
    }

    #[async_std::test]
    async fn test_isolation() {
        use async_std::future::timeout;
        use std::time::Duration;

        let ms = MemStore::new();

        // Assert there can be multiple concurrent read txs...
        let r1 = ms.read().await.unwrap();
        let r2 = ms.read().await.unwrap();
        // and that while outstanding they prevent write txs...
        let dur = Duration::from_millis(100);
        let w = ms.write();
        assert!(timeout(dur, w).await.is_err());
        // until both the reads are done...
        drop(r1);
        let w = ms.write();
        assert!(timeout(dur, w).await.is_err());
        drop(r2);
        let w = ms.write().await.unwrap();

        // At this point we have a write tx outstanding. Assert that
        // we cannot open another write transaction.
        let w2 = ms.write();
        assert!(timeout(dur, w2).await.is_err());

        // The write tx is still outstanding, ensure we cannot open
        // a read tx until it is finished.
        let r = ms.read();
        assert!(timeout(dur, r).await.is_err());
        w.rollback().await.unwrap();
        let r = ms.read().await.unwrap();
        assert!(!r.has("foo").await.unwrap());
    }
}
