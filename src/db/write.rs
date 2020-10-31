use super::{commit, index, read, scan, ReadCommitError, Whence};
use crate::checksum::Checksum;
use crate::dag;
use crate::prolly;
use std::collections::hash_map::HashMap;
use std::str::FromStr;
use str_macro::str;

#[allow(dead_code)]
enum Meta {
    Local(LocalMeta),
    Snapshot(SnapshotMeta),
}

struct LocalMeta {
    mutator_name: String,
    mutator_args: String,
    mutation_id: u64,
    original_hash: Option<String>,
}

struct SnapshotMeta {
    last_mutation_id: u64,
    server_state_id: String,
}

pub struct Write<'a> {
    dag_write: dag::Write<'a>,
    map: prolly::Map,
    checksum: Checksum,
    basis_hash: Option<String>,
    meta: Meta,
    indexes: HashMap<String, index::Index>,
}

#[derive(Debug)]
pub enum InitDBError {
    CommitError(CommitError),
}

// Return value is the hash of the commit.
#[allow(dead_code)]
pub async fn init_db(dag_write: dag::Write<'_>, head_name: &str) -> Result<String, InitDBError> {
    use InitDBError::*;
    let w = Write {
        dag_write,
        map: prolly::Map::new(),
        checksum: Checksum::new(),
        basis_hash: None,
        meta: Meta::Snapshot(SnapshotMeta {
            last_mutation_id: 0,
            server_state_id: str!(""),
        }),
        indexes: HashMap::new(),
    };
    Ok(w.commit(head_name).await.map_err(CommitError)?)
}

#[allow(dead_code)]
impl<'a> Write<'a> {
    pub async fn new_local(
        whence: Whence,
        mutator_name: String,
        mutator_args: String,
        original_hash: Option<String>,
        dag_write: dag::Write<'a>,
    ) -> Result<Write<'a>, ReadCommitError> {
        use ReadCommitError::*;
        let (basis_hash, basis, map) = read::read_commit(whence, &dag_write.read()).await?;
        let mutation_id = basis.next_mutation_id();
        let checksum = Checksum::from_str(basis.meta().checksum()).map_err(InvalidChecksum)?;
        let indexes = read::read_indexes(&basis);
        Ok(Write {
            basis_hash: basis_hash.into(),
            dag_write,
            map,
            checksum,
            meta: Meta::Local(LocalMeta {
                mutator_name,
                mutator_args,
                mutation_id,
                original_hash,
            }),
            indexes,
        })
    }

    pub async fn new_snapshot(
        whence: Whence,
        last_mutation_id: u64,
        server_state_id: String,
        dag_write: dag::Write<'a>,
        indexes: HashMap<String, index::Index>,
    ) -> Result<Write<'a>, ReadCommitError> {
        use ReadCommitError::*;
        let (basis_hash, commit, map) = read::read_commit(whence, &dag_write.read()).await?;
        let checksum = Checksum::from_str(commit.meta().checksum()).map_err(InvalidChecksum)?;
        Ok(Write {
            basis_hash: basis_hash.into(),
            dag_write,
            map,
            checksum,
            meta: Meta::Snapshot(SnapshotMeta {
                last_mutation_id,
                server_state_id,
            }),
            indexes,
        })
    }

    pub fn as_read(&'a self) -> super::Read<'a> {
        super::Read::new(self.dag_write.read(), &self.map, &self.indexes)
    }

    pub fn is_rebase(&self) -> bool {
        match &self.meta {
            Meta::Local(lm) => lm.original_hash.is_some(),
            _ => false,
        }
    }

    pub async fn put(&mut self, key: Vec<u8>, val: Vec<u8>) -> Result<(), PutError> {
        use PutError::*;
        let old_val = self.map.get(&key);
        if let Some(old_val) = old_val {
            self.checksum.remove(&key, &old_val);
            Self::update_indexes(
                &self.indexes,
                &self.dag_write,
                index::IndexOperation::Remove,
                &key,
                &old_val,
            )
            .await
            .map_err(RemoveOldIndexEntriesError)?;
        }
        self.checksum.add(&key, &val);
        Self::update_indexes(
            &self.indexes,
            &self.dag_write,
            index::IndexOperation::Add,
            &key,
            &val,
        )
        .await
        .map_err(AddNewIndexEntriesError)?;
        self.map.put(key, val);
        Ok(())
    }

    pub async fn del(&mut self, key: Vec<u8>) -> Result<(), DelError> {
        use DelError::*;
        let old_val = self.map.get(&key);
        match old_val {
            None => {}
            Some(old_val) => {
                self.checksum.remove(&key, &old_val);
                Self::update_indexes(
                    &self.indexes,
                    &self.dag_write,
                    index::IndexOperation::Remove,
                    &key,
                    &old_val,
                )
                .await
                .map_err(UpdateIndexesError)?;
            }
        };
        self.map.del(key);
        Ok(())
    }

    async fn update_indexes(
        indexes: &HashMap<String, index::Index>,
        dag_write: &dag::Write<'a>,
        op: index::IndexOperation,
        key: &[u8],
        val: &[u8],
    ) -> Result<(), UpdateIndexesError> {
        use UpdateIndexesError::*;
        for idx in indexes.values() {
            if key.starts_with(&idx.meta.definition.key_prefix) {
                let mut guard = idx
                    .get_map_mut(&dag_write.read())
                    .await
                    .map_err(GetMapError)?;
                // TODO: use outer guard to avoid unwrap. But it doesn't work.
                // See comment in that struct.
                let map = guard.guard.as_mut().unwrap();
                index::index_value(map, op, key, val, &idx.meta.definition.json_pointer)
                    .map_err(IndexValueError)?;
            }
        }
        Ok(())
    }

    pub async fn clear(&mut self) -> Result<(), ClearError> {
        use ClearError::*;
        self.checksum = Checksum::new();
        self.map = prolly::Map::new();
        for (_, idx) in self.indexes.iter() {
            let mut guard = idx
                .get_map_mut(&self.dag_write.read())
                .await
                .map_err(GetMapError)?
                .guard;
            *guard = Some(prolly::Map::new());
        }
        Ok(())
    }

    pub fn checksum(&self) -> String {
        self.checksum.to_string()
    }

    pub async fn create_index(
        &mut self,
        name: String,
        key_prefix: &[u8],
        json_pointer: &str,
    ) -> Result<(), CreateIndexError> {
        use CreateIndexError::*;

        let definition = commit::IndexDefinition {
            name: name.clone(),
            key_prefix: key_prefix.to_vec(),
            json_pointer: json_pointer.to_string(),
        };

        // Check to see if the index already exists.
        if let Some(index) = self.indexes.get(&name) {
            if index.meta.definition == definition {
                return Ok(());
            }
            return Err(IndexExistsWithDifferentDefinition);
        }

        let mut index_map = prolly::Map::new();
        for entry in scan::scan(
            &self.map,
            scan::ScanOptionsInternal {
                prefix: key_prefix.into(),
                limit: None,
                start: None,
                index_name: None,
            },
        ) {
            index::index_value(
                &mut index_map,
                index::IndexOperation::Add,
                entry.key,
                entry.val,
                json_pointer,
            )
            .map_err(|e| {
                IndexError((
                    name.clone(),
                    entry.key.to_vec(),
                    String::from_utf8(entry.val.to_vec()).unwrap_or_else(|_| str!("<unparsable>")),
                    e,
                ))
            })?;
        }

        self.indexes.insert(
            name,
            index::Index::new(
                commit::IndexMeta {
                    definition,
                    value_hash: str!(""),
                },
                Some(index_map),
            ),
        );

        Ok(())
    }

    pub async fn drop_index(&mut self, name: &str) -> Result<(), DropIndexError> {
        use DropIndexError::*;
        match self.indexes.remove(name) {
            None => Err(NoSuchIndexError(name.to_string())),
            Some(_) => Ok(()),
        }
    }

    // Return value is the hash of the new commit.
    #[allow(clippy::too_many_arguments)]
    pub async fn commit(mut self, head_name: &str) -> Result<String, CommitError> {
        use CommitError::*;
        let value_hash = self
            .map
            .flush(&mut self.dag_write)
            .await
            .map_err(FlushError)?;
        let mut index_metas = Vec::new();
        for (_, index) in self.indexes.into_iter() {
            let value_hash = index
                .flush(&mut self.dag_write)
                .await
                .map_err(IndexFlushError)?;
            let index::Index { mut meta, .. } = index;
            meta.value_hash = value_hash;
            index_metas.push(meta);
        }
        let commit = match &self.meta {
            Meta::Local(meta) => {
                let LocalMeta {
                    mutation_id,
                    mutator_name,
                    mutator_args,
                    original_hash,
                } = meta;

                commit::Commit::new_local(
                    self.basis_hash.as_deref(),
                    self.checksum,
                    *mutation_id,
                    mutator_name,
                    mutator_args.as_bytes(),
                    original_hash.as_deref(),
                    &value_hash,
                    &index_metas,
                )
            }
            Meta::Snapshot(meta) => {
                let SnapshotMeta {
                    last_mutation_id,
                    server_state_id,
                } = meta;

                commit::Commit::new_snapshot(
                    self.basis_hash.as_deref(),
                    self.checksum,
                    *last_mutation_id,
                    &server_state_id,
                    &value_hash,
                    &index_metas,
                )
            }
        };

        // TODO: Below two writes can be done in parallel
        self.dag_write
            .put_chunk(commit.chunk())
            .await
            .map_err(DagPutChunkError)?;
        self.dag_write
            .set_head(head_name, Some(commit.chunk().hash()))
            .await
            .map_err(DagSetHeadError)?;

        self.dag_write.commit().await.map_err(DagCommitError)?;

        Ok(commit.chunk().hash().to_string())
    }
}

#[derive(Debug)]
pub enum CreateIndexError {
    FlushError(prolly::FlushError),
    IndexError((String, Vec<u8>, String, index::IndexValueError)),
    IndexExistsWithDifferentDefinition,
}

#[derive(Debug)]
pub enum DropIndexError {
    NoSuchIndexError(String),
}

#[derive(Debug)]
pub enum CommitError {
    DagPutChunkError(dag::Error),
    DagSetHeadError(dag::Error),
    DagCommitError(dag::Error),
    FlushError(prolly::FlushError),
    IndexFlushError(index::IndexFlushError),
    SerializeArgsError(serde_json::error::Error),
}

#[derive(Debug)]
pub enum PutError {
    RemoveOldIndexEntriesError(UpdateIndexesError),
    AddNewIndexEntriesError(UpdateIndexesError),
}

#[derive(Debug)]
pub enum DelError {
    UpdateIndexesError(UpdateIndexesError),
}

#[derive(Debug)]
pub enum UpdateIndexesError {
    GetMapError(index::GetMapError),
    IndexValueError(index::IndexValueError),
}

#[derive(Debug)]
pub enum ClearError {
    GetMapError(index::GetMapError),
}

#[cfg(test)]
mod tests {
    use super::super::index;
    use super::super::read;
    use super::*;
    use crate::dag;
    use crate::db;
    use crate::kv::memstore::MemStore;
    use crate::util::rlog::LogContext;
    use serde_json::json;

    #[async_std::test]
    async fn basics() {
        let ds = dag::Store::new(Box::new(MemStore::new()));
        init_db(
            ds.write(LogContext::new()).await.unwrap(),
            db::DEFAULT_HEAD_NAME,
        )
        .await
        .unwrap();
        let mut w = Write::new_local(
            Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
            str!("mutator_name"),
            serde_json::Value::Array(vec![]).to_string(),
            None,
            ds.write(LogContext::new()).await.unwrap(),
        )
        .await
        .unwrap();
        w.put(b"foo".to_vec(), b"bar".to_vec()).await.unwrap();
        w.commit(db::DEFAULT_HEAD_NAME).await.unwrap();

        let w = Write::new_local(
            Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
            str!("mutator_name"),
            serde_json::Value::Null.to_string(),
            None,
            ds.write(LogContext::new()).await.unwrap(),
        )
        .await
        .unwrap();
        let r = w.as_read();
        let val = r.get(b"foo");
        assert_eq!(Some(&(b"bar"[..])), val);
    }

    #[async_std::test]
    async fn test_put_del_replace_update_checksum() {
        let ds = dag::Store::new(Box::new(MemStore::new()));
        init_db(
            ds.write(LogContext::new()).await.unwrap(),
            db::DEFAULT_HEAD_NAME,
        )
        .await
        .unwrap();
        let mut w = Write::new_local(
            Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
            str!("mutator_name"),
            serde_json::Value::Array(vec![]).to_string(),
            None,
            ds.write(LogContext::new()).await.unwrap(),
        )
        .await
        .unwrap();

        let mut exp_checksum = Checksum::new();
        assert_eq!(exp_checksum, w.checksum);

        exp_checksum.add(&[0], &[1]);
        w.put(vec![0], vec![1]).await.unwrap();
        assert_eq!(exp_checksum, w.checksum);

        // Ensure Write is calling Checksum.replace() if the key already exists.
        exp_checksum.replace(&[0], &[1], &[2]);
        w.put(vec![0], vec![2]).await.unwrap();
        assert_eq!(exp_checksum, w.checksum);

        exp_checksum.remove(&[0], &[2]);
        w.del(vec![0]).await.unwrap();
        assert_eq!(exp_checksum, w.checksum);

        // clear()'s reset of checksum tested in test_clear
    }

    #[async_std::test]
    async fn test_clear() {
        let ds = dag::Store::new(Box::new(MemStore::new()));
        init_db(
            ds.write(LogContext::new()).await.unwrap(),
            db::DEFAULT_HEAD_NAME,
        )
        .await
        .unwrap();
        let mut w = Write::new_local(
            Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
            str!("mutator_name"),
            serde_json::Value::Array(vec![]).to_string(),
            None,
            ds.write(LogContext::new()).await.unwrap(),
        )
        .await
        .unwrap();
        w.create_index(str!("idx"), b"", "").await.unwrap();
        w.put(b"foo".to_vec(), b"\"bar\"".to_vec()).await.unwrap();
        w.commit(db::DEFAULT_HEAD_NAME).await.unwrap();

        w = Write::new_local(
            Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
            str!("mutator_name"),
            serde_json::Value::Array(vec![]).to_string(),
            None,
            ds.write(LogContext::new()).await.unwrap(),
        )
        .await
        .unwrap();
        w.put(b"hot".to_vec(), b"\"dog\"".to_vec()).await.unwrap();
        assert_ne!("00000000", w.checksum());
        assert_eq!(w.map.iter().count(), 2);
        assert_eq!(
            (&w.indexes["idx"])
                .get_map(&w.dag_write.read())
                .await
                .unwrap()
                .get_map()
                .iter()
                .count(),
            2
        );
        w.clear().await.unwrap();
        assert_eq!("00000000", w.checksum());
        assert_eq!(w.map.iter().count(), 0);
        assert_eq!(
            (&w.indexes["idx"])
                .get_map(&w.dag_write.read())
                .await
                .unwrap()
                .get_map()
                .iter()
                .count(),
            0
        );
        w.commit(db::DEFAULT_HEAD_NAME).await.unwrap();

        let owned_read = ds.read(LogContext::new()).await.unwrap();
        let (_, c, m) = read::read_commit(
            Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
            &owned_read.read(),
        )
        .await
        .unwrap();
        let indexes = read::read_indexes(&c);
        assert_eq!("00000000", c.meta().checksum());
        assert_eq!(0, m.iter().count());
        assert_eq!(
            (&indexes["idx"])
                .get_map(&owned_read.read())
                .await
                .unwrap()
                .get_map()
                .iter()
                .count(),
            0
        );
    }

    #[async_std::test]
    async fn test_create_and_drop_index() {
        async fn test(separate_commits: bool) {
            let ds = dag::Store::new(Box::new(MemStore::new()));
            init_db(
                ds.write(LogContext::new()).await.unwrap(),
                db::DEFAULT_HEAD_NAME,
            )
            .await
            .unwrap();
            let mut w = Write::new_local(
                Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
                str!("mutator_name"),
                serde_json::Value::Array(vec![]).to_string(),
                None,
                ds.write(LogContext::new()).await.unwrap(),
            )
            .await
            .unwrap();
            for i in 0..3 {
                w.put(
                    format!("k{}", i).as_bytes().to_vec(),
                    json!({ "s": format!("s{}", i) })
                        .to_string()
                        .as_bytes()
                        .to_vec(),
                )
                .await
                .unwrap();
            }
            if separate_commits {
                w.commit(db::DEFAULT_HEAD_NAME).await.unwrap();
                w = Write::new_local(
                    Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
                    str!("mutator_name"),
                    serde_json::Value::Array(vec![]).to_string(),
                    None,
                    ds.write(LogContext::new()).await.unwrap(),
                )
                .await
                .unwrap();
            }

            let index_name = "i1";
            w.create_index(index_name.to_string(), b"", "/s")
                .await
                .unwrap();
            w.commit(db::DEFAULT_HEAD_NAME).await.unwrap();

            let owned_read = ds.read(LogContext::new()).await.unwrap();
            let (_, c, _) = read::read_commit(
                Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
                &owned_read.read(),
            )
            .await
            .unwrap();
            let indexes = c.indexes();
            assert_eq!(indexes.len(), 1);
            let idx = &indexes[0];
            assert_eq!(idx.definition.name, index_name);
            assert!(idx.definition.key_prefix.is_empty());
            assert_eq!(idx.definition.json_pointer, "/s");
            let idx_map = prolly::Map::load(&idx.value_hash, &owned_read.read())
                .await
                .unwrap();
            let entries = idx_map.iter().collect::<Vec<prolly::Entry>>();
            assert_eq!(entries.len(), 3);
            for i in 0..3 {
                assert_eq!(
                    entries.get(i).unwrap().key,
                    bytekey::serialize(&index::IndexKeyType::V0(index::IndexKey {
                        secondary: index::IndexValue::Str(format!("s{}", i).as_str()),
                        primary: format!("k{}", i).as_bytes(),
                    }))
                    .unwrap()
                    .as_slice()
                );
            }
            drop(owned_read);

            // Ensure drop works.
            w = Write::new_local(
                Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
                str!("some_mutator_name"),
                serde_json::Value::Array(vec![]).to_string(),
                None,
                ds.write(LogContext::new()).await.unwrap(),
            )
            .await
            .unwrap();
            w.drop_index(index_name).await.unwrap();
            w.commit(db::DEFAULT_HEAD_NAME).await.unwrap();
            let owned_read = ds.read(LogContext::new()).await.unwrap();
            let (_, c, _) = read::read_commit(
                Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
                &owned_read.read(),
            )
            .await
            .unwrap();
            let indexes = c.indexes();
            assert_eq!(indexes.len(), 0);
        }

        test(false).await;
        test(true).await;
        test(true).await;
    }
}
