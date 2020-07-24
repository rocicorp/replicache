use super::chunk::Chunk;
use super::key::Key;
use super::{read, Result};
use crate::kv;

pub struct Write<'a> {
    kvw: Box<dyn kv::Write + 'a>,
}

impl<'a> Write<'_> {
    pub fn new(kvw: Box<dyn kv::Write + 'a>) -> Write {
        Write { kvw }
    }

    pub fn read(&self) -> read::Read {
        read::Read::new(self.kvw.as_read())
    }

    pub async fn put_chunk(&mut self, c: &Chunk) -> Result<()> {
        self.kvw
            .put(&Key::ChunkData(c.hash()).to_string(), c.data())
            .await?;
        if let Some(meta) = c.meta() {
            self.kvw
                .put(&Key::ChunkMeta(c.hash()).to_string(), meta)
                .await?;
        }
        Ok(())
    }

    pub async fn set_head(&mut self, name: &str, hash: &str) -> Result<()> {
        Ok(self
            .kvw
            .put(&Key::Head(name).to_string(), hash.as_bytes())
            .await?)
    }

    pub async fn commit(self) -> Result<()> {
        Ok(self.kvw.commit().await?)
    }

    #[allow(dead_code)]
    pub async fn rollback(self) -> Result<()> {
        Ok(self.kvw.rollback().await?)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::kv::memstore::MemStore;
    use crate::kv::Store;

    #[async_std::test]
    async fn put_chunk() {
        async fn test(data: &[u8], refs: &[&str]) {
            let kv = MemStore::new();
            let kvw = kv.write().await.unwrap();
            let mut w = Write { kvw };

            let c = Chunk::new((data.to_vec(), 0), refs);
            w.put_chunk(&c).await.unwrap();

            let kd = Key::ChunkData(c.hash()).to_string();
            let km = Key::ChunkMeta(c.hash()).to_string();

            // The chunk data should always be there.
            assert_eq!(w.kvw.get(&kd).await.unwrap().unwrap().as_slice(), c.data());

            // The chunk meta should only be there if there were refs.
            if refs.is_empty() {
                assert!(!w.kvw.has(&km).await.unwrap());
            } else {
                assert_eq!(
                    w.kvw.get(&km).await.unwrap().unwrap().as_slice(),
                    c.meta().unwrap()
                );
            }
        }

        test(&vec![], &vec![]).await;
        test(&vec![0], &vec!["r1"]).await;
        test(&vec![0, 1], &vec!["r1", "r2"]).await;
    }

    #[async_std::test]
    async fn set_head() {
        async fn test(name: &str, hash: &str) {
            let kv = MemStore::new();
            let kvw = kv.write().await.unwrap();
            let mut w = Write { kvw };
            w.set_head(name, hash).await.unwrap();
            assert_eq!(
                hash,
                String::from_utf8(w.kvw.get(&format!("h/{}", name)).await.unwrap().unwrap())
                    .unwrap()
            );
        }

        test("", "").await;
        test("", "h1").await;
        test("n1", "").await;
        test("n1", "h1").await;
    }

    #[async_std::test]
    async fn commit_rollback() {
        async fn test(commit: bool) {
            let key: String;
            let kv = MemStore::new();
            {
                let kvw = kv.write().await.unwrap();
                let mut w = Write { kvw };
                let c = Chunk::new((vec![0, 1], 0), &vec![]);
                w.put_chunk(&c).await.unwrap();

                key = format!("c/{}/d", c.hash());

                // The changes should be present inside the tx.
                assert!(w.kvw.has(&key).await.unwrap());

                if commit {
                    w.commit().await.unwrap();
                } else {
                    w.rollback().await.unwrap();
                }
            }

            // The data should now be visible if it was committed.
            let kvr = kv.read().await.unwrap();
            assert_eq!(commit, kvr.has(&key).await.unwrap());
        }

        test(true).await;
        test(false).await;
    }

    #[async_std::test]
    async fn roundtrip() {
        async fn test(name: &str, data: &[u8], refs: &[&str]) {
            let kv = MemStore::new();
            let c = Chunk::new((data.to_vec(), 0), refs);
            {
                let kvw = kv.write().await.unwrap();
                let mut w = Write { kvw };
                w.put_chunk(&c).await.unwrap();
                w.set_head(name, c.hash()).await.unwrap();

                // Read the changes inside the tx.
                let c2 = w.read().get_chunk(c.hash()).await.unwrap().unwrap();
                let h = w.read().get_head(name).await.unwrap().unwrap();
                assert_eq!(c, c2);
                assert_eq!(h, c.hash());

                w.commit().await.unwrap();
            }

            // Read the changes outside the tx.
            let r = read::OwnedRead::new(kv.read().await.unwrap());
            let c2 = r.read().get_chunk(c.hash()).await.unwrap().unwrap();
            let h = r.read().get_head(name).await.unwrap().unwrap();
            assert_eq!(c, c2);
            assert_eq!(h, c.hash());
        }

        test("", &vec![], &vec![]).await;
        test("n1", &vec![0], &vec!["r1"]).await;
        test("n2", &vec![0, 1], &vec!["r1", "r2"]).await;
    }
}
