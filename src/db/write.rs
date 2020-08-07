use super::commit;
use crate::dag;
use crate::prolly;

pub struct Write<'a> {
    dag_write: dag::Write<'a>,
    map: prolly::Map,
    basis_hash: Option<String>,
}

#[allow(dead_code)]
impl<'a> Write<'a> {
    pub async fn new_from_head(
        head_name: &str,
        dag_write: dag::Write<'a>,
    ) -> Result<Write<'a>, NewWriteFromHeadError> {
        use NewWriteFromHeadError::*;
        let commit = commit::Commit::from_head(head_name, dag_write.read())
            .await
            .map_err(CommitFromHeadFailed)?;
        let map = match &commit {
            None => prolly::Map::new(),
            Some(commit) => prolly::Map::load(commit.value_hash(), dag_write.read())
                .await
                .map_err(MapLoadError)?,
        };
        let basis_hash = commit.as_ref().map(|c| c.chunk().hash().into());
        Ok(Write {
            basis_hash,
            dag_write,
            map,
        })
    }

    pub fn as_read(&'a self) -> super::Read<'a> {
        super::Read::new(self.dag_write.read(), &self.map)
    }

    pub fn put(&mut self, key: Vec<u8>, val: Vec<u8>) {
        self.map.put(key, val)
    }

    #[allow(clippy::too_many_arguments)]
    pub async fn commit(
        mut self,
        head_name: &str,
        local_create_date: &str,
        checksum: &str,
        mutation_id: u64,
        mutator_name: &str,
        mutator_args_json: &[u8],
        original_hash: Option<&str>,
    ) -> Result<(), CommitError> {
        use CommitError::*;
        let value_hash = self
            .map
            .flush(&mut self.dag_write)
            .await
            .map_err(FlushError)?;

        let commit = commit::Commit::new_local(
            local_create_date,
            self.basis_hash.as_deref(),
            checksum,
            mutation_id,
            mutator_name,
            mutator_args_json,
            original_hash,
            &value_hash,
        );

        // TODO: Below two writes can be done in parallel
        self.dag_write
            .put_chunk(commit.chunk())
            .await
            .map_err(DagPutChunkError)?;
        self.dag_write
            .set_head(head_name, commit.chunk().hash())
            .await
            .map_err(DagSetHeadError)?;

        self.dag_write.commit().await.map_err(DagCommitError)?;

        Ok(())
    }
}

#[derive(Debug)]
pub enum NewWriteFromHeadError {
    CommitFromHeadFailed(commit::FromHeadError),
    MapLoadError(prolly::LoadError),
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
    use crate::kv::memstore::MemStore;
    use crate::kv::Store;

    #[async_std::test]
    async fn basics() {
        let kv = MemStore::new();
        let kvw = kv.write().await.unwrap();
        let dw = dag::Write::new(kvw);
        let mut w = Write::new_from_head("main", dw).await.unwrap();
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

        let kvw = kv.write().await.unwrap();
        let dw = dag::Write::new(kvw);
        let w = Write::new_from_head("main", dw).await.unwrap();
        let r = w.as_read();
        let val = r.get("foo".as_bytes());
        assert_eq!(Some("bar".as_bytes()), val);
    }
}
