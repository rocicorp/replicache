use crate::kv::{Read, Result, Store, Write};
use crate::util::rlog::LogContext;
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

    pub async fn new_async() -> Box<dyn Store> {
        Box::new(MemStore::new())
    }
}

impl Default for MemStore {
    fn default() -> Self {
        MemStore::new()
    }
}

#[async_trait(?Send)]
impl Store for MemStore {
    async fn read<'a>(&'a self, _: LogContext) -> Result<Box<dyn Read + 'a>> {
        let guard = self.map.read().await;
        Ok(Box::new(ReadTransaction::new(guard)))
    }

    async fn write<'a>(&'a self, _: LogContext) -> Result<Box<dyn Write + 'a>> {
        let guard = self.map.write().await;
        Ok(Box::new(WriteTransaction::new(guard)))
    }

    async fn close(&self) {}
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
}

#[cfg(not(target_arch = "wasm32"))]
#[cfg(test)]
mod tests {
    use super::*;
    use crate::kv::trait_tests;

    #[async_std::test]
    async fn test_memstore() {
        trait_tests::run_all(&MemStore::new_async).await;
    }
}
