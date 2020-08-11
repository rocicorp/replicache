use super::commit::{Commit, FromHeadError};
use crate::dag;
use crate::prolly;

pub struct OwnedRead<'a> {
    dag_read: dag::OwnedRead<'a>,
    map: prolly::Map,
}

#[derive(Debug)]
pub enum NewReadFromHeadError {
    CommitFromHeadError(FromHeadError),
    MapLoadError(prolly::LoadError),
}

impl<'a> OwnedRead<'a> {
    pub async fn new_from_head(
        head_name: &str,
        dag_read: dag::OwnedRead<'a>,
    ) -> Result<OwnedRead<'a>, NewReadFromHeadError> {
        use NewReadFromHeadError::*;
        let commit = Commit::from_head(head_name, dag_read.read())
            .await
            .map_err(CommitFromHeadError)?;
        let map = match &commit {
            None => prolly::Map::new(),
            Some(commit) => prolly::Map::load(commit.value_hash(), dag_read.read())
                .await
                .map_err(MapLoadError)?,
        };
        Ok(OwnedRead { dag_read, map })
    }

    pub fn as_read(&'a self) -> Read<'a> {
        Read::new(self.dag_read.read(), &self.map)
    }
}

pub struct Read<'a> {
    #[allow(dead_code)]
    dag_read: dag::Read<'a>,

    map: &'a prolly::Map,
}

impl<'a> Read<'a> {
    pub fn new(dag_read: dag::Read<'a>, map: &'a prolly::Map) -> Read<'a> {
        Read { dag_read, map }
    }

    pub fn has(&self, key: &[u8]) -> bool {
        self.map.has(key)
    }

    pub fn get(&self, key: &[u8]) -> Option<&[u8]> {
        self.map.get(key)
    }

    #[allow(dead_code)]
    pub fn scan(&'a self, opts: super::ScanOptions<'a>) -> impl Iterator<Item = prolly::Entry<'a>> {
        super::scan::scan(&self.map, opts)
    }
}

#[cfg(test)]
mod tests {
    use super::super::*;
    use super::*;
    use crate::dag;
    use crate::kv::memstore::MemStore;
    use crate::kv::Store;

    #[async_std::test]
    async fn basics() {
        let kv = MemStore::new();
        let kvw = kv.write().await.unwrap();
        let dw = dag::Write::new(kvw);
        let mut w = write::Write::new_from_head("main", dw).await.unwrap();
        w.put("foo".as_bytes().to_vec(), "bar".as_bytes().to_vec());
        w.commit(
            "main",
            "local_create_date",
            "checksum",
            1,
            "mutator_name",
            &[],
            None,
        )
        .await
        .unwrap();

        let kvr = kv.read().await.unwrap();
        let dr = dag::OwnedRead::new(kvr);
        let r = OwnedRead::new_from_head("main", dr).await.unwrap();
        let rr = r.as_read();
        let val = rr.get("foo".as_bytes());
        assert_eq!(Some("bar".as_bytes()), val);
    }
}
