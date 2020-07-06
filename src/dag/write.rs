use super::chunk::Chunk;
use super::key::Key;
use super::{read, Result};
use crate::kv;
use crate::kv::Store;

#[allow(dead_code)]
pub struct Write<'a> {
    kvw: Box<dyn kv::Write + 'a>,
}

#[allow(dead_code)]
impl<'a> Write<'_> {
    pub fn new(kvw: Box<dyn kv::Write + 'a>) -> Write {
        Write { kvw }
    }

    pub async fn has_chunk(&mut self, hash: &str) -> Result<bool> {
        read::has_chunk(self.kvw.as_read(), hash).await
    }

    pub async fn get_chunk(&mut self, hash: &str) -> Result<Option<Chunk>> {
        read::get_chunk(self.kvw.as_read(), hash).await
    }

    pub async fn get_head(&mut self, name: &str) -> Result<Option<String>> {
        read::get_head(self.kvw.as_read(), name).await
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

    pub async fn commit(&mut self) -> Result<()> {
        Ok(self.kvw.commit().await?)
    }

    pub async fn rollback(&mut self) -> Result<()> {
        Ok(self.kvw.rollback().await?)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::kv::memstore::MemStore;

    #[async_std::test]
    async fn put_chunk() {
        async fn test(hash: &str, data: &[u8], refs: &[&str]) {
            let kv = MemStore::new();
            let kvw = kv.write().await.unwrap();
            let mut w = Write { kvw };

            let c = Chunk::new(hash.into(), data.to_vec(), refs);
            w.put_chunk(&c).await.unwrap();

            let kd = Key::ChunkData(hash).to_string();
            let km = Key::ChunkMeta(hash).to_string();

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

        test("", &vec![], &vec![]).await;
        test("h1", &vec![0], &vec!["r1"]).await;
        test("h2", &vec![0, 1], &vec!["r1", "r2"]).await;
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
            let kv = MemStore::new();
            {
                let kvw = kv.write().await.unwrap();
                let mut w = Write { kvw };
                let c = Chunk::new("h1".into(), vec![0, 1], &vec![]);
                w.put_chunk(&c).await.unwrap();

                // The changes should be present inside the tx.
                assert!(w.kvw.has("c/h1/d").await.unwrap());

                // But not outside the tx.
                let kvr = kv.read().await.unwrap();
                assert!(!kvr.has("c/h1/d").await.unwrap());

                // After finalize, nothing should work because the tx is closed.
                // TODO: Better to test for precise error.
                if commit {
                    w.commit().await.unwrap();
                } else {
                    w.rollback().await.unwrap();
                }
                assert!(w.has_chunk("").await.is_err());
                assert!(w.get_chunk("").await.is_err());
                assert!(w.put_chunk(&c).await.is_err());
                assert!(w.get_head("").await.is_err());
                assert!(w.set_head("", "").await.is_err());
            }

            // The data should now be visible if it was committed.
            let kvr = kv.read().await.unwrap();
            assert_eq!(commit, kvr.has("c/h1/d").await.unwrap());
        }

        test(true).await;
        test(false).await;
    }

    #[async_std::test]
    async fn roundtrip() {
        async fn test(name: &str, hash: &str, data: &[u8], refs: &[&str]) {
            let kv = MemStore::new();
            let c = Chunk::new(hash.into(), data.to_vec(), refs);
            {
                let kvw = kv.write().await.unwrap();
                let mut w = Write { kvw };
                w.put_chunk(&c).await.unwrap();
                w.set_head(name, hash).await.unwrap();

                // Read the changes inside the tx.
                let c2 = w.get_chunk(hash).await.unwrap().unwrap();
                let h = w.get_head(name).await.unwrap().unwrap();
                assert_eq!(c, c2);
                assert_eq!(h, hash);

                w.commit().await.unwrap();
            }

            // Read the changes outside the tx.
            let r = read::Read::new(kv.read().await.unwrap());
            let c2 = r.get_chunk(hash).await.unwrap().unwrap();
            let h = r.get_head(name).await.unwrap().unwrap();
            assert_eq!(c, c2);
            assert_eq!(h, hash);
        }

        test("", "", &vec![], &vec![]).await;
        test("n1", "h1", &vec![0], &vec!["r1"]).await;
        test("n2", "h2", &vec![0, 1], &vec!["r1", "r2"]).await;
    }
}
