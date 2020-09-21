use super::chunk::Chunk;
use super::key::Key;
use super::{Error, Result};
use crate::kv;

pub struct OwnedRead<'a> {
    kvr: Box<dyn kv::Read + 'a>,
}

impl<'a> OwnedRead<'a> {
    pub fn new(kvr: Box<dyn kv::Read + 'a>) -> OwnedRead {
        OwnedRead { kvr }
    }

    pub fn read(&'a self) -> Read<'a> {
        Read {
            kvr: self.kvr.as_ref(),
        }
    }
}

pub struct Read<'a> {
    kvr: &'a dyn kv::Read,
}

impl<'a> Read<'_> {
    pub fn new(kvr: &'a dyn kv::Read) -> Read {
        Read { kvr }
    }

    #[allow(dead_code)]
    pub async fn has_chunk(&self, hash: &str) -> Result<bool> {
        Ok(self.kvr.has(&Key::ChunkData(hash).to_string()).await?)
    }

    pub async fn get_chunk(&self, hash: &str) -> Result<Option<Chunk>> {
        match self.kvr.get(&Key::ChunkData(hash).to_string()).await? {
            None => Ok(None),
            Some(data) => {
                let meta = self.kvr.get(&Key::ChunkMeta(hash).to_string()).await?;
                Ok(Some(Chunk::read(hash.into(), data, meta)))
            }
        }
    }

    pub async fn get_head(&self, name: &str) -> Result<Option<String>> {
        if let Some(bytes) = self.kvr.get(&Key::Head(name).to_string()).await? {
            match String::from_utf8(bytes) {
                Ok(s) => return Ok(Some(s)),
                Err(e) => {
                    return Err(Error::CorruptStore(format!(
                        "Could not decode head: {}: {}",
                        name, e
                    )));
                }
            }
        }
        Ok(None)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::kv::memstore::MemStore;
    use crate::kv::Store;
    use crate::util::rlog::LogContext;

    #[async_std::test]
    async fn test_has_chunk() {
        async fn test(hash: &str, expect_has: bool) {
            let k = "present";
            let kv = MemStore::new();
            let kvw = kv.write(LogContext::new()).await.unwrap();
            kvw.put(&Key::ChunkData(k).to_string(), &vec![0u8, 1])
                .await
                .unwrap();
            kvw.commit().await.unwrap();

            let kvr = kv.read(LogContext::new()).await.unwrap();
            let r = Read { kvr: kvr.as_ref() };
            assert_eq!(expect_has, r.has_chunk(&hash).await.unwrap());
        }

        test("present", true).await;
        test("no such hash", false).await;
    }

    #[async_std::test]
    async fn test_get_chunk() {
        async fn test(data: Vec<u8>, refs: &[&str], get_same_chunk: bool) {
            let kv = MemStore::new();
            let kvw = kv.write(LogContext::new()).await.unwrap();
            let chunk = Chunk::new((data, 0), refs);
            kvw.put(&Key::ChunkData(&chunk.hash()).to_string(), chunk.data())
                .await
                .unwrap();
            if let Some(meta) = chunk.meta() {
                kvw.put(&Key::ChunkMeta(chunk.hash()).to_string(), meta)
                    .await
                    .unwrap();
            }
            kvw.commit().await.unwrap();

            let kvr = kv.read(LogContext::new()).await.unwrap();
            let r = Read { kvr: kvr.as_ref() };

            let mut expected = Option::<Chunk>::None;
            let chunk_hash: &str;
            if get_same_chunk {
                expected = Some(chunk);
                chunk_hash = expected.as_ref().unwrap().hash();
            } else {
                chunk_hash = "no such hash";
            }
            assert_eq!(expected, r.get_chunk(chunk_hash).await.unwrap());
        }
        test(vec![1], &vec!["r1", "r2"], true).await;
        test(vec![1], &vec![], true).await;
        test(vec![1], &vec!["r1", "r2"], false).await;
    }
}
