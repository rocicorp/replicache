use super::chunk::Chunk;
use super::key::Key;
use super::{Error, Result};
use crate::kv;
use log::error;

pub struct OwnedRead<'a> {
    kvr: Box<dyn kv::Read + 'a>,
}

#[allow(dead_code)]
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
#[allow(dead_code)]
pub struct Read<'a> {
    kvr: &'a dyn kv::Read,
}

#[allow(dead_code)]
impl<'a> Read<'_> {
    pub fn new(kvr: &'a dyn kv::Read) -> Read {
        Read { kvr }
    }

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
                    error!("Could not decode head: {}: {}", name, e);
                    return Err(Error::CorruptStore);
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

    #[async_std::test]
    async fn test_has_chunk() {
        async fn test(hash: &str, expect_has: bool) {
            let k = "present";
            let kv = MemStore::new();
            let kvw = kv.write().await.unwrap();
            kvw.put(&Key::ChunkData(k).to_string(), &vec![0u8, 1])
                .await
                .unwrap();
            kvw.commit().await.unwrap();

            let kvr = kv.read().await.unwrap();
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
            let cloned_data = data.clone();
            let kvw = kv.write().await.unwrap();
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

            let kvr = kv.read().await.unwrap();
            let r = Read { kvr: kvr.as_ref() };
            if get_same_chunk {
                let got_option = r.get_chunk(chunk.hash()).await.unwrap();
                let got_chunk = got_option.unwrap();
                assert_eq!(chunk.hash(), got_chunk.hash());
                let d: &[u8] = &cloned_data;
                assert_eq!(d, got_chunk.data());
                if chunk.refs().is_some() {
                    assert_eq!(
                        refs,
                        got_chunk.refs().unwrap().collect::<Vec<&str>>().as_slice()
                    );
                }
            } else {
                let got_option = r.get_chunk("no such hash").await.unwrap();
                assert_eq!(None, got_option);
            }
        }
        test(vec![1], &vec!["r1", "r2"], true).await;
        test(vec![1], &vec![], true).await;
        test(vec![1], &vec!["r1", "r2"], false).await;
    }
}