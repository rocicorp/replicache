use super::commit;
use crate::dag;
use crate::prolly;
use crate::util::nanoserde::any::Any;
use nanoserde::SerJson;

pub struct Write<'a> {
    dag_write: dag::Write<'a>,
    map: prolly::Map,
    basis_hash: Option<String>,
    mutator_name: String,
    mutator_args: Any,
    mutation_id: u64,
    original_hash: Option<String>,
}

#[allow(dead_code)]
impl<'a> Write<'a> {
    pub async fn new_from_head(
        head_name: String,
        mutator_name: String,
        mutator_args: Any,
        original_hash: Option<String>,
        dag_write: dag::Write<'a>,
    ) -> Result<Write<'a>, NewWriteFromHeadError> {
        use NewWriteFromHeadError::*;
        let basis_hash = dag_write
            .read()
            .get_head(&head_name)
            .await
            .map_err(GetHeadError)?;
        // TODO: when we have new_genesis
        //.ok_or(UnknownHead(head_name.to_string()))?;

        let mut commit: Option<commit::Commit> = None;
        if let Some(basis_hash) = basis_hash.as_ref() {
            commit = commit::Commit::from_hash(basis_hash.as_str(), dag_write.read())
                .await
                .map_err(CommitFromHashError)?;
        }

        // TODO: This branch goes away once we have new_genesis.
        let map = match &commit {
            None => prolly::Map::new(),
            Some(commit) => prolly::Map::load(commit.value_hash(), dag_write.read())
                .await
                .map_err(MapLoadError)?,
        };
        let mutation_id = commit.as_ref().map_or(0, |c| c.next_mutation_id());
        Ok(Write {
            basis_hash,
            dag_write,
            map,
            mutator_name,
            mutator_args,
            mutation_id,
            original_hash,
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
    ) -> Result<(), CommitError> {
        use CommitError::*;
        let value_hash = self
            .map
            .flush(&mut self.dag_write)
            .await
            .map_err(FlushError)?;

        let Write {
            basis_hash,
            mutation_id,
            mutator_name,
            mutator_args,
            original_hash,
            ..
        } = self;

        let commit = commit::Commit::new_local(
            local_create_date,
            basis_hash.as_deref(),
            checksum,
            mutation_id,
            &mutator_name,
            mutator_args.serialize_json().as_bytes(),
            original_hash.as_deref(),
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
    GetHeadError(dag::Error),
    CommitFromHashError(commit::FromHashError),
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
    use str_macro::str;

    #[async_std::test]
    async fn basics() {
        let kv = MemStore::new();
        let kvw = kv.write().await.unwrap();
        let dw = dag::Write::new(kvw);
        let mut w = Write::new_from_head(
            str!("main"),
            str!("mutator_name"),
            Any::Array(vec![]),
            None,
            dw,
        )
        .await
        .unwrap();
        w.put("foo".as_bytes().to_vec(), "bar".as_bytes().to_vec());
        w.commit("main", "local_create_date", "checksum")
            .await
            .unwrap();

        let kvw = kv.write().await.unwrap();
        let dw = dag::Write::new(kvw);
        let w = Write::new_from_head(str!("main"), str!("mutator_name"), Any::Null, None, dw)
            .await
            .unwrap();
        let r = w.as_read();
        let val = r.get("foo".as_bytes());
        assert_eq!(Some("bar".as_bytes()), val);
    }
}
