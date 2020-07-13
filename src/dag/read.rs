use super::chunk::Chunk;
use super::key::Key;
use super::{Error, Result};
use crate::kv;
use log::error;

#[allow(dead_code)]
pub struct Read<'a> {
    kvr: Box<dyn kv::Read + 'a>,
}

#[allow(dead_code)]
impl<'a> Read<'_> {
    pub fn new(kvr: Box<dyn kv::Read + 'a>) -> Read {
        Read { kvr }
    }

    pub async fn has_chunk(&self, hash: &str) -> Result<bool> {
        has_chunk(self.kvr.as_ref(), hash).await
    }

    pub async fn get_chunk(&self, hash: &str) -> Result<Option<Chunk>> {
        get_chunk(self.kvr.as_ref(), hash).await
    }

    pub async fn get_head(&self, name: &str) -> Result<Option<String>> {
        get_head(self.kvr.as_ref(), name).await
    }
}

pub async fn has_chunk(kvr: &dyn kv::Read, hash: &str) -> Result<bool> {
    Ok(kvr.has(&Key::ChunkData(hash).to_string()).await?)
}

pub async fn get_chunk(kvr: &dyn kv::Read, hash: &str) -> Result<Option<Chunk>> {
    match kvr.get(&Key::ChunkData(hash).to_string()).await? {
        None => Ok(None),
        Some(data) => {
            let meta = kvr.get(&Key::ChunkMeta(hash).to_string()).await?;
            Ok(Some(Chunk::read(hash.into(), data, meta)))
        }
    }
}

pub async fn get_head(kvr: &dyn kv::Read, name: &str) -> Result<Option<String>> {
    if let Some(bytes) = kvr.get(&Key::Head(name).to_string()).await? {
        match String::from_utf8(bytes) {
            Ok(s) => return Ok(Some(s)),
            Err(e) => {
                error!("Could not decode head: {}: {}", name, e);
                return Err(Error::CorruptStore);
            }
        }
    }
    Ok(None)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::kv::memstore::MemStore;
    use crate::kv::Store;

    #[async_std::test]
    async fn test_has_chunk() {
        async fn test(hash: &str, del_haskey: bool, expect_has: bool) {
            let kv = MemStore::new();
            let kvw = kv.write().await.unwrap();
            let kvr = kv.read().await.unwrap();
            let r = Read { kvr };

            kvw.put(&Key::ChunkData("haskey").to_string(), &vec![0u8, 1])
                .await
                .unwrap();
            kvw.commit().await.unwrap();
            assert_eq!(expect_has, r.has_chunk(&hash).await.unwrap());

            // Mayve test isolation: other txs should not affect what the read tx, which is
            // still open, sees.
            if del_haskey {
                let kvw2 = kv.write().await.unwrap();
                kvw2.del("haskey".into()).await.unwrap();
                kvw2.commit().await.unwrap();
                assert_eq!(expect_has, r.has_chunk(&hash).await.unwrap());
            }
        }

        test("haskey", false, true).await;
        test("haskey", true, true).await;
        test("missing", false, false).await;
    }
}
