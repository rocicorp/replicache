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
        opts: super::ScanOptions,
        callback: impl Fn(prolly::Entry<'_>),
    ) -> Result<(), ScanError> {
        use ScanError::*;
        fn send<'a>(
            map: &'a prolly::Map,
            opts: super::scan::ScanOptionsInternal<'a>,
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

        // We'll use the opts_internal as-is if it is not an index scan.
        let mut opts_internal: super::scan::ScanOptionsInternal = (&opts).into();

        // If it *is* an index scan then we need to use the scan_key bytes for
        // prefix and start.key.value instead of the raw string bytes (index keys
        // are specially encoded). The new scan_key bytes have to live at least as
        // long as the scan.
        //
        // TODO this is really ugly, esp with the unwraps. We should clean it up. Maybe
        // flattening the ScanOptionsInternal or more advanced rust magic could help.
        #[allow(unused_assignments)]
        let mut prefix: Option<Vec<u8>> = None;
        #[allow(unused_assignments)]
        let mut scan_key_value: Option<Vec<u8>> = None;
        if opts.index_name.is_some() {
            // prefix
            if opts.prefix.is_some() {
                prefix = Some(
                    index::encode_scan_key(opts.prefix.as_ref().unwrap())
                        .map_err(ScanError::ParseScanOptionsError)?,
                );
                opts_internal.prefix = Some(prefix.as_ref().unwrap());
            }

            // scan.key.value
            let scan_key_value_string = opts
                .start
                .as_ref()
                .and_then(|sb| sb.key.as_ref().map(|sk| &sk.value));
            if scan_key_value_string.is_some() {
                scan_key_value = Some(
                    index::encode_scan_key(scan_key_value_string.unwrap())
                        .map_err(ScanError::ParseScanOptionsError)?,
                );

                let start = opts_internal.start.unwrap();
                let mut key = start.key.unwrap();
                key.value = scan_key_value.as_ref().unwrap();
                opts_internal.start = Some(super::scan::ScanBoundInternal {
                    key: Some(key),
                    index: start.index,
                });
            }
        }

        match opts_internal.index_name {
            Some(name) => {
                let idx = self
                    .indexes
                    .get(name)
                    .ok_or_else(|| UnknownIndexName(name.to_string()))?;
                let guard = idx.get_map(&self.dag_read).await.map_err(GetMapError)?;
                send(guard.get_map(), opts_internal, callback);
            }
            None => send(&self.map, opts_internal, callback),
        };
        Ok(())
    }
}

#[derive(Debug)]
pub enum ScanError {
    GetMapError(index::GetMapError),
    ParseScanOptionsError(index::GetIndexKeysError),
    UnknownIndexName(String),
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
        w.commit(db::DEFAULT_HEAD_NAME).await.unwrap();

        let dr = ds.read(LogContext::new()).await.unwrap();
        let r = OwnedRead::from_whence(Whence::Head(str!(db::DEFAULT_HEAD_NAME)), dr)
            .await
            .unwrap();
        let rr = r.as_read();
        let val = rr.get("foo".as_bytes());
        assert_eq!(Some("bar".as_bytes()), val);
    }
}
