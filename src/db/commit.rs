use super::commit_generated::commit as commit_fb;
use crate::checksum::Checksum;
use crate::dag;
use flatbuffers::FlatBufferBuilder;
use std::collections::hash_set::HashSet;
use std::str::FromStr;
use str_macro::str;

pub const DEFAULT_HEAD_NAME: &str = "main";

#[derive(Clone, Copy)]
enum Ref<'a> {
    Strong(&'a str),
    Weak(&'a str),
}

impl<'a> Ref<'a> {
    pub fn hash(self) -> &'a str {
        match self {
            Ref::Weak(s) => s,
            Ref::Strong(s) => s,
        }
    }

    pub fn strong_or_none(self) -> Option<&'a str> {
        match self {
            Ref::Weak(_) => None,
            Ref::Strong(s) => Some(s),
        }
    }
}

// Commit is a thin wrapper around the Commit flatbuffer that makes it
// easier to read and write them. Commit::load() does validation
// so that users don't have to worry about missing fields.
#[derive(Debug, PartialEq)]
pub struct Commit {
    chunk: dag::Chunk,
}

#[allow(dead_code)]
impl Commit {
    #![allow(clippy::too_many_arguments)]
    pub fn new_local(
        basis_hash: Option<&str>,
        checksum: Checksum,
        mutation_id: u64,
        mutator_name: &str,
        mutator_args_json: &[u8],
        original_hash: Option<&str>,
        value_hash: &str,
        indexes: &[IndexRecord],
    ) -> Commit {
        let mut builder = FlatBufferBuilder::default();
        let local_meta_args = &commit_fb::LocalMetaArgs {
            mutation_id,
            mutator_name: builder.create_string(mutator_name).into(),
            mutator_args_json: builder.create_vector(mutator_args_json).into(),
            original_hash: original_hash.map(|h| builder.create_string(h)),
        };
        let local_meta = commit_fb::LocalMeta::create(&mut builder, local_meta_args);
        Commit::new_impl(
            builder,
            basis_hash.map(Ref::Strong),
            checksum,
            commit_fb::MetaTyped::LocalMeta,
            local_meta.as_union_value(),
            Ref::Strong(value_hash),
            original_hash.map(Ref::Weak),
            indexes,
        )
    }

    pub fn new_snapshot(
        basis_hash: Option<&str>,
        checksum: Checksum,
        last_mutation_id: u64,
        server_state_id: &str,
        value_hash: &str,
        indexes: &[IndexRecord],
    ) -> Commit {
        let mut builder = FlatBufferBuilder::default();
        let snapshot_meta_args = &commit_fb::SnapshotMetaArgs {
            last_mutation_id,
            server_state_id: builder.create_string(server_state_id).into(),
        };
        let snapshot_meta = commit_fb::SnapshotMeta::create(&mut builder, snapshot_meta_args);
        Commit::new_impl(
            builder,
            basis_hash.map(Ref::Weak),
            checksum,
            commit_fb::MetaTyped::SnapshotMeta,
            snapshot_meta.as_union_value(),
            Ref::Strong(value_hash),
            None,
            indexes,
        )
    }

    pub fn from_chunk(chunk: dag::Chunk) -> Result<Commit, LoadError> {
        Commit::validate(chunk.data())?;
        Ok(Commit { chunk })
    }

    pub async fn from_hash(hash: &str, dag_read: &dag::Read<'_>) -> Result<Commit, FromHashError> {
        use FromHashError::*;
        let chunk = dag_read
            .get_chunk(&hash)
            .await
            .map_err(GetChunkFailed)?
            .ok_or_else(|| ChunkMissing(hash.to_string()))?;
        let commit = Commit::from_chunk(chunk).map_err(LoadCommitFailed)?;
        Ok(commit)
    }

    pub fn chunk(&self) -> &dag::Chunk {
        &self.chunk
    }

    pub fn meta(&self) -> Meta {
        Meta {
            fb: self.commit().meta().unwrap(),
        }
    }

    pub fn value_hash(&self) -> &str {
        self.commit().value_hash().unwrap()
    }

    pub fn mutation_id(&self) -> u64 {
        let meta = self.meta();
        match meta.typed() {
            MetaTyped::Local(lm) => lm.mutation_id(),
            MetaTyped::Snapshot(sm) => sm.last_mutation_id(),
        }
    }

    pub fn next_mutation_id(&self) -> u64 {
        self.mutation_id() + 1
    }

    pub fn indexes(&self) -> Vec<IndexRecord> {
        // TODO: Would be nice to return an iterator instead of allocating the temp vector here.
        let mut result = Vec::new();
        for idx in self.commit().indexes().iter().flat_map(|v| v.iter()) {
            let definition = IndexDefinition {
                name: idx.definition().unwrap().name().unwrap().to_string(),
                key_prefix: idx.definition().unwrap().key_prefix().unwrap().to_vec(),
                json_pointer: idx
                    .definition()
                    .unwrap()
                    .json_pointer()
                    .unwrap()
                    .to_string(),
            };
            let index = IndexRecord {
                definition,
                value_hash: idx.value_hash().unwrap().to_string(),
            };
            result.push(index);
        }
        result
    }

    fn validate(buffer: &[u8]) -> Result<(), LoadError> {
        use LoadError::*;
        let root = commit_fb::get_root_as_commit(buffer);
        root.value_hash().ok_or(MissingValueHash)?;

        let meta = root.meta().ok_or(MissingMeta)?;

        // basis_hash is optional -- the first commit lacks a basis
        meta.checksum().ok_or(MissingChecksum)?;
        Checksum::from_str(meta.checksum().unwrap()).map_err(|_| InvalidChecksum)?;

        match meta.typed_type() {
            commit_fb::MetaTyped::LocalMeta => {
                Commit::validate_local_meta(meta.typed_as_local_meta().ok_or(MissingTyped)?)
            }
            commit_fb::MetaTyped::SnapshotMeta => {
                Commit::validate_snapshot_meta(meta.typed_as_snapshot_meta().ok_or(MissingTyped)?)
            }
            _ => Err(UnknownMetaType),
        }?;

        // Indexes is optional
        if let Some(indexes) = root.indexes() {
            let mut seen = HashSet::new();
            for (i, index) in indexes.iter().enumerate() {
                // validate index
                Commit::validate_index(index).map_err(|e| InvalidIndex((i, e)))?;

                // check for dupes
                let name = index.definition().unwrap().name().unwrap();
                if seen.contains(name) {
                    return Err(DuplicateIndexName(name.to_string()));
                }
                seen.insert(name);
            }
        }

        Ok(())
    }

    fn validate_local_meta(local_meta: commit_fb::LocalMeta) -> Result<(), LoadError> {
        use LoadError::*;
        local_meta.mutator_name().ok_or(MissingMutatorName)?;
        local_meta
            .mutator_args_json()
            .ok_or(MissingMutatorArgsJSON)?;
        // original_hash is optional
        Ok(())
    }

    fn validate_snapshot_meta(snapshot_meta: commit_fb::SnapshotMeta) -> Result<(), LoadError> {
        use LoadError::*;
        // zero is allowed for last_mutation_id (for the first snapshot)
        snapshot_meta
            .server_state_id()
            .ok_or(MissingServerStateID)?;
        Ok(())
    }

    fn validate_index_definition(
        index_definition: commit_fb::IndexDefinition,
    ) -> Result<(), ValidateIndexDefinitionError> {
        use ValidateIndexDefinitionError::*;
        index_definition.name().ok_or(MissingName)?;
        index_definition.key_prefix().ok_or(MissingKeyPrefix)?;
        index_definition.json_pointer().ok_or(MissingIndexPath)?;
        Ok(())
    }

    fn validate_index(index: commit_fb::IndexRecord) -> Result<(), ValidateIndexError> {
        use ValidateIndexError::*;
        index.definition().ok_or(MissingDefinition)?;
        Commit::validate_index_definition(index.definition().unwrap()).map_err(InvalidDefintion)?;
        index.value_hash().ok_or(MissingValueHash)?;
        Ok(())
    }

    fn commit(&self) -> commit_fb::Commit {
        commit_fb::get_root_as_commit(&self.chunk.data())
    }

    fn new_impl(
        mut builder: FlatBufferBuilder,
        basis_hash: Option<Ref>,
        checksum: Checksum,
        union_type: commit_fb::MetaTyped,
        union_value: flatbuffers::WIPOffset<flatbuffers::UnionWIPOffset>,
        value_hash: Ref,
        original_hash: Option<Ref>,
        indexes: &[IndexRecord],
    ) -> Commit {
        let meta_args = &commit_fb::MetaArgs {
            basis_hash: basis_hash.map(|r| builder.create_string(r.hash())),
            checksum: builder.create_string(&checksum.to_string()).into(),
            typed_type: union_type,
            typed: union_value.into(),
        };
        let meta = commit_fb::Meta::create(&mut builder, meta_args);
        let mut fb_indexes = Vec::new();
        for index in indexes {
            let args = &commit_fb::IndexDefinitionArgs {
                name: builder.create_string(&index.definition.name).into(),
                key_prefix: builder.create_vector(&index.definition.key_prefix).into(),
                json_pointer: builder.create_string(&index.definition.json_pointer).into(),
            };
            let def = commit_fb::IndexDefinition::create(&mut builder, args);
            let args = &commit_fb::IndexRecordArgs {
                definition: def.into(),
                value_hash: builder.create_string(&index.value_hash).into(),
            };
            fb_indexes.push(commit_fb::IndexRecord::create(&mut builder, args));
        }

        let commit_args = &commit_fb::CommitArgs {
            meta: meta.into(),
            value_hash: builder.create_string(value_hash.hash()).into(),
            indexes: builder.create_vector(&fb_indexes).into(),
        };
        let commit = commit_fb::Commit::create(&mut builder, commit_args);
        builder.finish(commit, None);

        let refs = std::iter::once(value_hash)
            .chain(basis_hash)
            .chain(original_hash)
            .chain(indexes.iter().map(|idx| Ref::Strong(&idx.value_hash)))
            .filter_map(Ref::strong_or_none)
            .collect::<Vec<&str>>();

        let chunk = dag::Chunk::new(builder.collapse(), &refs);
        Commit { chunk }
    }

    pub async fn base_snapshot(
        hash: &str,
        dag_read: &dag::Read<'_>,
    ) -> Result<Commit, BaseSnapshotError> {
        use BaseSnapshotError::*;
        let mut commit = Commit::from_hash(hash, dag_read)
            .await
            .map_err(NoSuchCommit)?;
        while !commit.meta().is_snapshot() {
            let meta = commit.meta();
            let basis_hash = meta
                .basis_hash()
                .ok_or_else(|| NoBasis(format!("Commit {} has no basis", commit.chunk.hash())))?;
            commit = Commit::from_hash(basis_hash, dag_read)
                .await
                .map_err(NoSuchCommit)?;
        }
        Ok(commit)
    }

    // Returns the set of local commits from the given from_commit_hash back to but not
    // including its base snapshot. If from_commit_hash is a snapshot, the returned vector
    // will be empty. When, as typical, from_commit_hash is the head of the default chain
    // then the returned commits are the set of pending commits, ie the set of local commits
    // that have not yet been pushed to the data layer.
    //
    // The vector of commits is returned in reverse chain order, that is, starting
    // with the commit with hash from_commit_hash and walking backwards.
    pub async fn local_mutations(
        from_commit_hash: &str,
        dag_read: &dag::Read<'_>,
    ) -> Result<Vec<Commit>, PendingError> {
        use PendingError::*;
        let mut commit = Commit::from_hash(from_commit_hash, dag_read)
            .await
            .map_err(NoSuchCommit)?;
        let mut commits = Vec::new();
        while !commit.meta().is_snapshot() {
            let meta = commit.meta();
            let basis_hash = meta
                .basis_hash()
                .ok_or_else(|| NoBasis(format!("Commit {} has no basis", commit.chunk.hash())))?
                .to_string();
            commits.push(commit);
            commit = Commit::from_hash(&basis_hash, dag_read)
                .await
                .map_err(NoSuchCommit)?;
        }
        Ok(commits)
    }

    // Parts are (last_mutation_id, server_state_id).
    pub fn snapshot_meta_parts(c: &Commit) -> Result<(u64, String), InternalProgrammerError> {
        match c.meta().typed() {
            MetaTyped::Local(_) => Err(InternalProgrammerError::WrongType(str!(
                "Snapshot meta expected"
            ))),
            MetaTyped::Snapshot(sm) => {
                Ok((sm.last_mutation_id(), sm.server_state_id().to_string()))
            }
        }
    }
}

#[derive(Debug)]
pub enum BaseSnapshotError {
    NoBasis(String),
    NoSuchCommit(FromHashError),
}

#[derive(Debug)]
pub enum PendingError {
    NoBasis(String),
    NoSuchCommit(FromHashError),
}

pub struct Meta<'a> {
    fb: commit_fb::Meta<'a>,
}

#[allow(dead_code)]
impl<'a> Meta<'a> {
    pub fn basis_hash(&self) -> Option<&str> {
        self.fb.basis_hash()
    }
    pub fn checksum(&self) -> &str {
        self.fb.checksum().unwrap()
    }

    pub fn typed(&self) -> MetaTyped {
        match self.fb.typed_type() {
            commit_fb::MetaTyped::LocalMeta => MetaTyped::Local(LocalMeta {
                fb: self.fb.typed_as_local_meta().unwrap(),
            }),
            commit_fb::MetaTyped::SnapshotMeta => MetaTyped::Snapshot(SnapshotMeta {
                fb: self.fb.typed_as_snapshot_meta().unwrap(),
            }),
            commit_fb::MetaTyped::NONE => panic!("notreached"),
        }
    }

    pub fn is_snapshot(&self) -> bool {
        match self.typed() {
            MetaTyped::Local(_) => false,
            MetaTyped::Snapshot(_) => true,
        }
    }

    pub fn is_local(&self) -> bool {
        !self.is_snapshot()
    }
}

pub enum MetaTyped<'a> {
    Local(LocalMeta<'a>),
    Snapshot(SnapshotMeta<'a>),
}

pub struct LocalMeta<'a> {
    fb: commit_fb::LocalMeta<'a>,
}

#[allow(dead_code)]
impl<'a> LocalMeta<'a> {
    pub fn mutation_id(&self) -> u64 {
        self.fb.mutation_id()
    }

    pub fn mutator_name(&self) -> &str {
        self.fb.mutator_name().unwrap()
    }

    pub fn mutator_args_json(&self) -> &[u8] {
        self.fb.mutator_args_json().unwrap()
    }

    pub fn original_hash(&self) -> Option<&str> {
        // original_hash is legitimately optional, it's only present if the
        // local commit was rebased.
        self.fb.original_hash()
    }
}

pub struct SnapshotMeta<'a> {
    fb: commit_fb::SnapshotMeta<'a>,
}

#[allow(dead_code)]
impl<'a> SnapshotMeta<'a> {
    pub fn last_mutation_id(&self) -> u64 {
        self.fb.last_mutation_id()
    }

    pub fn server_state_id(&self) -> &str {
        self.fb.server_state_id().unwrap()
    }
}

#[derive(Clone, Debug)]
pub struct IndexRecord {
    pub definition: IndexDefinition,
    pub value_hash: String,
}

#[derive(Clone, Debug, PartialEq)]
pub struct IndexDefinition {
    pub name: String,
    // key_prefix describes a subset of the primary key to index
    pub key_prefix: Vec<u8>,
    // json_pointer describes the (sub-)value to index (secondary index)
    pub json_pointer: String,
}

#[derive(Debug, PartialEq)]
pub enum LoadError {
    InvalidChecksum,
    MissingMutatorName,
    MissingMutatorArgsJSON,
    MissingServerStateID,
    MissingChecksum,
    MissingTyped,
    MissingMeta,
    MissingValueHash,
    UnknownMetaType,
    InvalidIndex((usize, ValidateIndexError)),
    DuplicateIndexName(String),
}

#[derive(Debug, PartialEq)]
pub enum ValidateIndexDefinitionError {
    MissingName,
    MissingKeyPrefix,
    MissingIndexPath,
}

#[derive(Debug, PartialEq)]
pub enum ValidateIndexError {
    MissingDefinition,
    InvalidDefintion(ValidateIndexDefinitionError),
    MissingValueHash,
}

#[derive(Debug)]
pub enum FromHashError {
    GetChunkFailed(dag::Error),
    ChunkMissing(String),
    LoadCommitFailed(LoadError),
}

#[derive(Debug)]
pub enum InternalProgrammerError {
    WrongType(String),
}

#[cfg(test)]
mod tests {
    use super::super::test_helpers::*;
    use super::*;
    use crate::dag::Chunk;
    use crate::kv::memstore::MemStore;
    use crate::util::rlog::LogContext;

    #[async_std::test]
    async fn test_base_snapshot() {
        let store = dag::Store::new(Box::new(MemStore::new()));
        let mut chain: Chain = vec![];

        add_genesis(&mut chain, &store).await;
        let genesis_hash = chain[0].chunk().hash();
        assert_eq!(
            genesis_hash,
            Commit::base_snapshot(
                genesis_hash,
                &store.read(LogContext::new()).await.unwrap().read()
            )
            .await
            .unwrap()
            .chunk()
            .hash()
        );

        add_local(&mut chain, &store).await;
        add_local(&mut chain, &store).await;
        let genesis_hash = chain[0].chunk().hash();
        assert_eq!(
            genesis_hash,
            Commit::base_snapshot(
                chain[chain.len() - 1].chunk().hash(),
                &store.read(LogContext::new()).await.unwrap().read()
            )
            .await
            .unwrap()
            .chunk()
            .hash()
        );

        add_snapshot(&mut chain, &store, None).await;
        let base_hash = store
            .read(LogContext::new())
            .await
            .unwrap()
            .read()
            .get_head("main")
            .await
            .unwrap()
            .unwrap();
        assert_eq!(
            base_hash,
            Commit::base_snapshot(
                chain[chain.len() - 1].chunk().hash(),
                &store.read(LogContext::new()).await.unwrap().read()
            )
            .await
            .unwrap()
            .chunk()
            .hash()
        );

        add_local(&mut chain, &store).await;
        add_local(&mut chain, &store).await;
        assert_eq!(
            base_hash,
            Commit::base_snapshot(
                chain[chain.len() - 1].chunk().hash(),
                &store.read(LogContext::new()).await.unwrap().read()
            )
            .await
            .unwrap()
            .chunk()
            .hash()
        );
    }

    #[async_std::test]
    async fn test_local_mutations() {
        let store = dag::Store::new(Box::new(MemStore::new()));
        let mut chain: Chain = vec![];

        add_genesis(&mut chain, &store).await;
        let genesis_hash = chain[0].chunk().hash();
        assert_eq!(
            0,
            Commit::local_mutations(
                genesis_hash,
                &store.read(LogContext::new()).await.unwrap().read()
            )
            .await
            .unwrap()
            .len()
        );

        add_local(&mut chain, &store).await;
        add_local(&mut chain, &store).await;
        let head_hash = chain[2].chunk().hash();
        let commits = Commit::local_mutations(
            head_hash,
            &store.read(LogContext::new()).await.unwrap().read(),
        )
        .await
        .unwrap();
        assert_eq!(2, commits.len());
        assert_eq!(chain[2], commits[0]);
        assert_eq!(chain[1], commits[1]);
    }

    #[test]
    fn load_roundtrip() {
        let checksum = Checksum::from_str("12345678").unwrap();
        let tmp = checksum.to_string();
        let checksum_str = Some(tmp.as_ref());
        fn test(chunk: Chunk, expected: Result<Commit, LoadError>) {
            let actual = Commit::from_chunk(chunk);
            assert_eq!(expected, actual);
        }
        for basis_hash in &[None, Some(""), Some("hash")] {
            test(
                make_commit(
                    Some(Box::new(|b: &mut FlatBufferBuilder| {
                        make_local_meta(b, 0, "".into(), Some(&[]), "original".into())
                    })),
                    *basis_hash,
                    checksum_str,
                    "value".into(),
                    &(if basis_hash.is_none() {
                        vec!["value"]
                    } else {
                        vec!["value", basis_hash.unwrap()]
                    }),
                    vec![].into(),
                ),
                Ok(Commit::new_local(
                    *basis_hash,
                    checksum,
                    0,
                    "",
                    &[],
                    "original".into(),
                    "value",
                    &vec![],
                )),
            );
        }
        test(
            make_commit(
                Some(Box::new(|b: &mut FlatBufferBuilder| {
                    make_local_meta(b, 0, None, Some(&[]), "".into())
                })),
                "".into(),
                checksum_str,
                "".into(),
                &["", ""],
                None,
            ),
            Err(LoadError::MissingMutatorName),
        );
        test(
            make_commit(
                Some(Box::new(|b: &mut FlatBufferBuilder| {
                    make_local_meta(b, 0, "".into(), None, "".into())
                })),
                "".into(),
                checksum_str,
                "".into(),
                &["", ""],
                None,
            ),
            Err(LoadError::MissingMutatorArgsJSON),
        );
        for basis_hash in &[None, Some(""), Some("hash")] {
            test(
                make_commit(
                    Some(Box::new(|b: &mut FlatBufferBuilder| {
                        make_local_meta(b, 0, "".into(), Some(&[]), None)
                    })),
                    *basis_hash,
                    checksum_str,
                    "".into(),
                    &(if basis_hash.is_none() {
                        vec![""]
                    } else {
                        vec!["", basis_hash.unwrap()]
                    }),
                    None,
                ),
                Ok(Commit::new_local(
                    *basis_hash,
                    checksum,
                    0,
                    "",
                    &[],
                    None,
                    "",
                    &vec![],
                )),
            );
        }
        test(
            make_commit(
                Some(Box::new(|b: &mut FlatBufferBuilder| {
                    make_local_meta(b, 0, "".into(), Some(&[]), "".into())
                })),
                "".into(),
                None,
                "".into(),
                &["", ""],
                None,
            ),
            Err(LoadError::MissingChecksum),
        );
        test(
            make_commit(
                Some(Box::new(|b: &mut FlatBufferBuilder| {
                    make_local_meta(b, 0, "".into(), Some(&[]), "".into())
                })),
                "".into(),
                "BOOM".into(),
                "".into(),
                &["", ""],
                None,
            ),
            Err(LoadError::InvalidChecksum),
        );
        test(
            make_commit(
                Some(Box::new(|b: &mut FlatBufferBuilder| {
                    make_local_meta(b, 0, "".into(), Some(&[]), "".into())
                })),
                "".into(),
                "".into(),
                None,
                &["", ""],
                None,
            ),
            Err(LoadError::MissingValueHash),
        );
        for basis_hash in &[None, Some(""), Some("hash")] {
            test(
                make_commit(
                    Some(Box::new(|b: &mut FlatBufferBuilder| {
                        make_snapshot_meta(b, 0, "".into())
                    })),
                    *basis_hash,
                    checksum_str,
                    "".into(),
                    &[""],
                    None,
                ),
                Ok(Commit::new_snapshot(
                    *basis_hash,
                    checksum,
                    0,
                    "",
                    "",
                    &vec![],
                )),
            );
        }
        test(
            make_commit(
                Some(Box::new(|b: &mut FlatBufferBuilder| {
                    make_snapshot_meta(b, 0, None)
                })),
                "".into(),
                checksum_str,
                "".into(),
                &["", ""],
                None,
            ),
            Err(LoadError::MissingServerStateID),
        );

        // invalid index definitions
    }

    #[test]
    fn accessors() {
        let local = Commit::from_chunk(make_commit(
            Some(Box::new(|b: &mut FlatBufferBuilder| {
                make_local_meta(
                    b,
                    1,
                    "foo_mutator".into(),
                    Some(vec![42u8].as_slice()),
                    "original_hash".into(),
                )
            })),
            "basis_hash".into(),
            "11111111".into(),
            "value_hash".into(),
            &["value_hash", "basis_hash"],
            None,
        ))
        .unwrap();

        match local.meta().typed() {
            MetaTyped::Snapshot(_) => assert!(false),
            MetaTyped::Local(lm) => {
                assert_eq!(lm.mutation_id(), 1);
                assert_eq!(lm.mutator_name(), "foo_mutator");
                assert_eq!(lm.mutator_args_json(), vec![42u8].as_slice());
                assert_eq!(lm.original_hash(), Some("original_hash"));
            }
        }
        assert_eq!(local.meta().basis_hash(), Some("basis_hash"));
        assert_eq!(local.meta().checksum(), "11111111");
        assert_eq!(local.value_hash(), "value_hash");
        assert_eq!(local.next_mutation_id(), 2);

        let snapshot = Commit::from_chunk(make_commit(
            Some(Box::new(|b: &mut FlatBufferBuilder| {
                make_snapshot_meta(b, 2, "server_state_id 2".into())
            })),
            "basis_hash 2".into(),
            "22222222".into(),
            "value_hash 2".into(),
            &["value_hash 2", "basis_hash 2"],
            None,
        ))
        .unwrap();

        match snapshot.meta().typed() {
            MetaTyped::Local(_) => assert!(false),
            MetaTyped::Snapshot(sm) => {
                assert_eq!(sm.last_mutation_id(), 2);
                assert_eq!(sm.server_state_id(), "server_state_id 2");
            }
        }
        assert_eq!(snapshot.meta().basis_hash(), Some("basis_hash 2"));
        assert_eq!(snapshot.meta().checksum(), "22222222");
        assert_eq!(snapshot.value_hash(), "value_hash 2");
        assert_eq!(snapshot.next_mutation_id(), 3);
    }

    struct MakeIndexDefinition {
        name: Option<String>,
        key_prefix: Option<Vec<u8>>,
        json_pointer: Option<String>,
    }

    struct MakeIndex {
        definition: Option<MakeIndexDefinition>,
        value_hash: Option<String>,
    }

    fn make_commit(
        typed_meta: Option<
            Box<
                dyn FnOnce(
                    &mut FlatBufferBuilder,
                ) -> (
                    commit_fb::MetaTyped,
                    flatbuffers::WIPOffset<flatbuffers::UnionWIPOffset>,
                ),
            >,
        >,
        basis_hash: Option<&str>,
        checksum: Option<&str>,
        value_hash: Option<&str>,
        refs: &[&str],
        indexes: Option<Vec<MakeIndex>>,
    ) -> Chunk {
        let mut builder = FlatBufferBuilder::default();
        let typed_meta = typed_meta.map(|c| c(&mut builder));
        let args = &commit_fb::MetaArgs {
            typed_type: typed_meta.map_or(commit_fb::MetaTyped::NONE, |t| t.0),
            typed: typed_meta.map(|t| t.1),
            basis_hash: basis_hash.map(|s| builder.create_string(s)),
            checksum: checksum.map(|s| builder.create_string(s)),
        };
        let meta = commit_fb::Meta::create(&mut builder, args);

        fn make_index<'bldr: 'mut_bldr, 'mut_bldr>(
            builder: &'mut_bldr mut FlatBufferBuilder<'bldr>,
            make_index: &MakeIndex,
        ) -> flatbuffers::WIPOffset<commit_fb::IndexRecord<'bldr>> {
            let definition = make_index.definition.as_ref().map(|mid| {
                let args = commit_fb::IndexDefinitionArgs {
                    name: mid.name.as_ref().map(|s| builder.create_string(s)),
                    key_prefix: mid.key_prefix.as_ref().map(|s| builder.create_vector(s)),
                    json_pointer: mid.json_pointer.as_ref().map(|s| builder.create_string(&s)),
                };
                commit_fb::IndexDefinition::create(builder, &args)
            });
            let args = commit_fb::IndexRecordArgs {
                definition,
                value_hash: make_index
                    .value_hash
                    .as_ref()
                    .map(|s| builder.create_string(s)),
            };
            commit_fb::IndexRecord::create(builder, &args)
        }

        let mut fb_indexes = Vec::new();
        if let Some(v) = indexes {
            for mi in &v {
                let idx = make_index(&mut builder, mi);
                fb_indexes.push(idx);
            }
        };

        let args = &commit_fb::CommitArgs {
            meta: meta.into(),
            value_hash: value_hash.map(|s| builder.create_string(s)),
            indexes: builder.create_vector(&fb_indexes).into(),
        };
        let commit = commit_fb::Commit::create(&mut builder, args);
        builder.finish(commit, None);

        Chunk::new(builder.collapse(), &refs)
    }

    fn make_local_meta(
        builder: &mut FlatBufferBuilder,
        mutation_id: u64,
        mutator_name: Option<&str>,
        mutator_args_json: Option<&[u8]>,
        original_hash: Option<&str>,
    ) -> (
        commit_fb::MetaTyped,
        flatbuffers::WIPOffset<flatbuffers::UnionWIPOffset>,
    ) {
        let args = &commit_fb::LocalMetaArgs {
            mutation_id,
            mutator_name: mutator_name.map(|s| builder.create_string(s)),
            mutator_args_json: mutator_args_json.map(|b| builder.create_vector(b)),
            original_hash: original_hash.map(|s| builder.create_string(s)),
        };
        let local_meta = commit_fb::LocalMeta::create(builder, args);
        (commit_fb::MetaTyped::LocalMeta, local_meta.as_union_value())
    }

    fn make_snapshot_meta(
        builder: &mut FlatBufferBuilder,
        last_mutation_id: u64,
        server_state_id: Option<&str>,
    ) -> (
        commit_fb::MetaTyped,
        flatbuffers::WIPOffset<flatbuffers::UnionWIPOffset>,
    ) {
        let args = &commit_fb::SnapshotMetaArgs {
            last_mutation_id,
            server_state_id: server_state_id.map(|s| builder.create_string(s)),
        };
        let snapshot_meta = commit_fb::SnapshotMeta::create(builder, args);
        (
            commit_fb::MetaTyped::SnapshotMeta,
            snapshot_meta.as_union_value(),
        )
    }
}
