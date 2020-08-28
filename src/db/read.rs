use super::commit::{Commit, FromHashError};
use crate::checksum;
use crate::dag;
use crate::prolly;

pub enum Whence {
    Head(String),
    #[allow(dead_code)]
    Hash(String),
}

pub struct OwnedRead<'a> {
    dag_read: dag::OwnedRead<'a>,
    map: prolly::Map,
}

#[derive(Debug)]
pub enum ReadCommitError {
    CommitFromHeadError(FromHashError),
    GetHeadError(dag::Error),
    InvalidChecksum(checksum::ParseError),
    MapLoadError(prolly::LoadError),
    UnknownHead(String),
}

impl<'a> OwnedRead<'a> {
    pub async fn from_whence(
        whence: Whence,
        dag_read: dag::OwnedRead<'a>,
    ) -> Result<OwnedRead<'a>, ReadCommitError> {
        let (_, _, map) = read_commit(whence, &dag_read.read()).await?;
        Ok(OwnedRead { dag_read, map })
    }

    pub fn as_read(&'a self) -> Read<'a> {
        Read::new(self.dag_read.read(), &self.map)
    }
}

pub async fn read_commit(
    whence: Whence,
    read: &dag::Read<'_>,
) -> Result<(String, Commit, prolly::Map), ReadCommitError> {
    use ReadCommitError::*;
    let hash = match whence {
        Whence::Hash(s) => s,
        Whence::Head(s) => read
            .get_head(&s)
            .await
            .map_err(GetHeadError)?
            .ok_or_else(|| UnknownHead(s.to_string()))?,
    };
    let commit = Commit::from_hash(&hash, read)
        .await
        .map_err(CommitFromHeadError)?;
    let map = prolly::Map::load(commit.value_hash(), read)
        .await
        .map_err(MapLoadError)?;
    Ok((hash, commit, map))
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
    use crate::db;
    use crate::db::write::init_db;
    use crate::kv::memstore::MemStore;
    use crate::util::nanoserde::any::Any;
    use str_macro::str;

    #[async_std::test]
    async fn basics() {
        let ds = dag::Store::new(Box::new(MemStore::new()));
        init_db(
            ds.write().await.unwrap(),
            db::DEFAULT_HEAD_NAME,
            "local_create_date",
        )
        .await
        .unwrap();
        let mut w = write::Write::new_local(
            Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
            str!("mutator_name"),
            Any::Array(vec![]),
            None,
            ds.write().await.unwrap(),
        )
        .await
        .unwrap();
        w.put("foo".as_bytes().to_vec(), "bar".as_bytes().to_vec());
        w.commit(db::DEFAULT_HEAD_NAME, "local_create_date")
            .await
            .unwrap();

        let dr = ds.read().await.unwrap();
        let r = OwnedRead::from_whence(Whence::Head(str!(db::DEFAULT_HEAD_NAME)), dr)
            .await
            .unwrap();
        let rr = r.as_read();
        let val = rr.get("foo".as_bytes());
        assert_eq!(Some("bar".as_bytes()), val);
    }
}
