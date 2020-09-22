use super::{commit, read_commit, ReadCommitError, Whence};
use crate::checksum::Checksum;
use crate::dag;
use crate::prolly;
use crate::util::nanoserde::any::Any;
use nanoserde::SerJson;
use std::str::FromStr;
use str_macro::str;

#[allow(dead_code)]
enum Meta {
    Local(LocalMeta),
    Snapshot(SnapshotMeta),
}

struct LocalMeta {
    mutator_name: String,
    mutator_args: Any,
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
}

#[derive(Debug)]
pub enum InitDBError {
    CommitError(CommitError),
}

// Return value is the hash of the commit.
#[allow(dead_code)]
pub async fn init_db(
    dag_write: dag::Write<'_>,
    head_name: &str,
    local_create_date: &str,
) -> Result<String, InitDBError> {
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
    };
    Ok(w.commit(head_name, local_create_date)
        .await
        .map_err(CommitError)?)
}

#[allow(dead_code)]
impl<'a> Write<'a> {
    pub async fn new_local(
        whence: Whence,
        mutator_name: String,
        mutator_args: Any,
        original_hash: Option<String>,
        dag_write: dag::Write<'a>,
    ) -> Result<Write<'a>, ReadCommitError> {
        use ReadCommitError::*;
        let (basis_hash, basis, map) = read_commit(whence, &dag_write.read()).await?;
        let mutation_id = basis.next_mutation_id();
        let basis_hash = Some(basis_hash);
        let checksum = Checksum::from_str(basis.meta().checksum()).map_err(InvalidChecksum)?;
        Ok(Write {
            basis_hash,
            dag_write,
            map,
            checksum,
            meta: Meta::Local(LocalMeta {
                mutator_name,
                mutator_args,
                mutation_id,
                original_hash,
            }),
        })
    }

    pub async fn new_snapshot(
        whence: Whence,
        last_mutation_id: u64,
        server_state_id: String,
        dag_write: dag::Write<'a>,
    ) -> Result<Write<'a>, ReadCommitError> {
        use ReadCommitError::*;
        let (basis_hash, commit, map) = read_commit(whence, &dag_write.read()).await?;
        let basis_hash = Some(basis_hash);
        let checksum = Checksum::from_str(commit.meta().checksum()).map_err(InvalidChecksum)?;
        Ok(Write {
            basis_hash,
            dag_write,
            map,
            checksum,
            meta: Meta::Snapshot(SnapshotMeta {
                last_mutation_id,
                server_state_id,
            }),
        })
    }

    pub fn as_read(&'a self) -> super::Read<'a> {
        super::Read::new(self.dag_write.read(), &self.map)
    }

    pub fn is_rebase(&self) -> bool {
        match &self.meta {
            Meta::Local(lm) => lm.original_hash.is_some(),
            _ => false,
        }
    }

    pub fn put(&mut self, key: Vec<u8>, val: Vec<u8>) {
        match self.map.get(&key) {
            None => self.checksum.add(&key, &val),
            Some(old_val) => self.checksum.replace(&key, old_val, &val),
        };
        self.map.put(key, val)
    }

    pub fn del(&mut self, key: Vec<u8>) {
        let old_val = self.map.get(&key);
        match old_val {
            None => {}
            Some(old_val) => self.checksum.remove(&key, old_val),
        };
        self.map.del(key)
    }

    pub fn clear(&mut self) {
        self.checksum = Checksum::new();
        self.map = prolly::Map::new();
    }

    pub fn checksum(&self) -> String {
        self.checksum.to_string()
    }

    // Return value is the hash of the new commit.
    #[allow(clippy::too_many_arguments)]
    pub async fn commit(
        mut self,
        head_name: &str,
        local_create_date: &str,
    ) -> Result<String, CommitError> {
        use CommitError::*;
        let value_hash = self
            .map
            .flush(&mut self.dag_write)
            .await
            .map_err(FlushError)?;

        let commit = match self.meta {
            Meta::Local(meta) => {
                let LocalMeta {
                    mutation_id,
                    mutator_name,
                    mutator_args,
                    original_hash,
                } = meta;

                commit::Commit::new_local(
                    local_create_date,
                    self.basis_hash.as_deref(),
                    self.checksum,
                    mutation_id,
                    &mutator_name,
                    mutator_args.serialize_json().as_bytes(),
                    original_hash.as_deref(),
                    &value_hash,
                )
            }
            Meta::Snapshot(meta) => {
                let SnapshotMeta {
                    last_mutation_id,
                    server_state_id,
                } = meta;

                commit::Commit::new_snapshot(
                    local_create_date,
                    self.basis_hash.as_deref(),
                    self.checksum,
                    last_mutation_id,
                    &server_state_id,
                    &value_hash,
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
pub enum CommitError {
    DagPutChunkError(dag::Error),
    DagSetHeadError(dag::Error),
    DagCommitError(dag::Error),
    FlushError(prolly::FlushError),
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::dag;
    use crate::db;
    use crate::kv::memstore::MemStore;
    use crate::util::rlog::LogContext;

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
        let mut w = Write::new_local(
            Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
            str!("mutator_name"),
            Any::Array(vec![]),
            None,
            ds.write(LogContext::new()).await.unwrap(),
        )
        .await
        .unwrap();
        w.put("foo".as_bytes().to_vec(), "bar".as_bytes().to_vec());
        w.commit(db::DEFAULT_HEAD_NAME, "local_create_date")
            .await
            .unwrap();

        let w = Write::new_local(
            Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
            str!("mutator_name"),
            Any::Null,
            None,
            ds.write(LogContext::new()).await.unwrap(),
        )
        .await
        .unwrap();
        let r = w.as_read();
        let val = r.get("foo".as_bytes());
        assert_eq!(Some("bar".as_bytes()), val);
    }

    #[async_std::test]
    async fn test_put_del_reset_update_hash() {
        let ds = dag::Store::new(Box::new(MemStore::new()));
        init_db(
            ds.write(LogContext::new()).await.unwrap(),
            db::DEFAULT_HEAD_NAME,
            "local_create_date",
        )
        .await
        .unwrap();
        let mut w = Write::new_local(
            Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
            str!("mutator_name"),
            Any::Array(vec![]),
            None,
            ds.write(LogContext::new()).await.unwrap(),
        )
        .await
        .unwrap();

        let mut exp_checksum = Checksum::new();
        assert_eq!(exp_checksum, w.checksum);

        exp_checksum.add(&[0], &[1]);
        w.put(vec![0], vec![1]);
        assert_eq!(exp_checksum, w.checksum);

        // Ensure Write is calling Checksum.replace() if the key already exists.
        exp_checksum.replace(&[0], &[1], &[2]);
        w.put(vec![0], vec![2]);
        assert_eq!(exp_checksum, w.checksum);

        exp_checksum.remove(&[0], &[2]);
        w.del(vec![0]);
        assert_eq!(exp_checksum, w.checksum);

        // Ensure clear works and replaces the checksum.
        w.put(vec![0], vec![1]);
        assert_ne!("00000000", w.checksum());
        w.clear();
        assert_eq!("00000000", w.checksum());
        assert!(!w.as_read().has(vec![0].as_ref()));
    }
}
