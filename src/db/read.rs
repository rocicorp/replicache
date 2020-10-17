use super::commit::{Commit, FromHashError};
use super::index;
use crate::checksum;
use crate::dag;
use crate::prolly;
use std::collections::hash_map::HashMap;
use std::iter::FromIterator;

#[derive(Debug)]
pub enum Whence {
    Head(String),
    #[allow(dead_code)]
    Hash(String),
}

pub struct OwnedRead<'a> {
    dag_read: dag::OwnedRead<'a>,
    map: prolly::Map,
    indexes: HashMap<String, index::Index>,
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
        let (_, basis, map) = read_commit(whence, &dag_read.read()).await?;
        let indexes = read_indexes(&basis);
        Ok(OwnedRead {
            dag_read,
            map,
            indexes,
        })
    }

    pub fn as_read(&'a self) -> Read<'a> {
        Read::new(self.dag_read.read(), &self.map, &self.indexes)
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

pub fn read_indexes(commit: &Commit) -> HashMap<String, index::Index> {
    HashMap::from_iter(commit.indexes().iter().map(|meta| {
        (
            meta.definition.name.clone(),
            index::Index::new(meta.clone(), None),
        )
    }))
}

pub struct Read<'a> {
    #[allow(dead_code)]
    dag_read: dag::Read<'a>,
    map: &'a prolly::Map,
    indexes: &'a HashMap<String, index::Index>,
}

impl<'a> Read<'a> {
    pub fn new(
        dag_read: dag::Read<'a>,
        map: &'a prolly::Map,
        indexes: &'a HashMap<String, index::Index>,
    ) -> Read<'a> {
        Read {
            dag_read,
            map,
            indexes,
        }
    }

    pub fn has(&self, key: &[u8]) -> bool {
        self.map.has(key)
    }

    pub fn get(&self, key: &[u8]) -> Option<&[u8]> {
        self.map.get(key)
    }

    pub async fn scan(
        &'a self,
        opts: super::ScanOptions<'a>,
        callback: impl Fn(prolly::Entry<'_>),
    ) -> Result<(), ScanError> {
        use ScanError::*;
        fn send<'a>(
            map: &'a prolly::Map,
            opts: super::ScanOptions<'a>,
            callback: impl Fn(prolly::Entry<'_>),
        ) {
            let use_index = opts.index_name.is_some();
            for mut thing in super::scan::scan(map, opts) {
                // TODO: It would be nice to return either the primary or secondary key,
                // but decoding it is kind of a bitch. Cannot return composite key because it
                // isn't a valid string!
                if use_index {
                    thing = prolly::Entry {
                        key: &[],
                        val: thing.val,
                    }
                }
                callback(thing);
            }
        }
        match opts.index_name {
            Some(name) => {
                let idx = self
                    .indexes
                    .get(name)
                    .ok_or_else(|| UnknownIndexName(name.to_string()))?;
                let guard = idx.get_map(&self.dag_read).await.map_err(GetMapError)?;
                send(guard.get_map(), opts, callback);
            }
            None => send(&self.map, opts, callback),
        };
        Ok(())
    }
}

#[derive(Debug)]
pub enum ScanError {
    UnknownIndexName(String),
    GetMapError(index::GetMapError),
}

#[cfg(test)]
mod tests {
    use super::super::*;
    use super::*;
    use crate::dag;
    use crate::db;
    use crate::db::write::init_db;
    use crate::kv::memstore::MemStore;
    use crate::util::rlog::LogContext;
    use str_macro::str;

    #[async_std::test]
    async fn basics() {
        let ds = dag::Store::new(Box::new(MemStore::new()));
        init_db(
            ds.write(LogContext::new()).await.unwrap(),
            db::DEFAULT_HEAD_NAME,
            "local_create_date",
        )
        .await
        .unwrap();
        let mut w = write::Write::new_local(
            Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
            str!("mutator_name"),
            serde_json::Value::Array(vec![]).to_string(),
            None,
            ds.write(LogContext::new()).await.unwrap(),
        )
        .await
        .unwrap();
        w.put("foo".as_bytes().to_vec(), "bar".as_bytes().to_vec())
            .await
            .unwrap();
        w.commit(db::DEFAULT_HEAD_NAME, "local_create_date")
            .await
            .unwrap();

        let dr = ds.read(LogContext::new()).await.unwrap();
        let r = OwnedRead::from_whence(Whence::Head(str!(db::DEFAULT_HEAD_NAME)), dr)
            .await
            .unwrap();
        let rr = r.as_read();
        let val = rr.get("foo".as_bytes());
        assert_eq!(Some("bar".as_bytes()), val);
    }
}
