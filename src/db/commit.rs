use super::commit_generated::commit;
use crate::checksum::Checksum;
use crate::dag;
use flatbuffers::FlatBufferBuilder;
use std::str::FromStr;
use str_macro::str;

pub const DEFAULT_HEAD_NAME: &str = "main";

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
        local_create_date: &str,
        basis_hash: Option<&str>,
        checksum: Checksum,
        mutation_id: u64,
        mutator_name: &str,
        mutator_args_json: &[u8],
        original_hash: Option<&str>,
        value_hash: &str,
    ) -> Commit {
        let mut builder = FlatBufferBuilder::default();
        let local_meta_args = &commit::LocalMetaArgs {
            mutation_id,
            mutator_name: builder.create_string(mutator_name).into(),
            mutator_args_json: builder.create_vector(mutator_args_json).into(),
            original_hash: original_hash.map(|h| builder.create_string(h)),
        };
        let local_meta = commit::LocalMeta::create(&mut builder, local_meta_args);
        Commit::new_impl(
            builder,
            local_create_date,
            basis_hash,
            checksum,
            commit::MetaTyped::LocalMeta,
            local_meta.as_union_value(),
            value_hash,
        )
    }

    pub fn new_snapshot(
        local_create_date: &str,
        basis_hash: Option<&str>,
        checksum: Checksum,
        last_mutation_id: u64,
        server_state_id: &str,
        value_hash: &str,
    ) -> Commit {
        let mut builder = FlatBufferBuilder::default();
        let snapshot_meta_args = &commit::SnapshotMetaArgs {
            last_mutation_id,
            server_state_id: builder.create_string(server_state_id).into(),
        };
        let snapshot_meta = commit::SnapshotMeta::create(&mut builder, snapshot_meta_args);
        Commit::new_impl(
            builder,
            local_create_date,
            basis_hash,
            checksum,
            commit::MetaTyped::SnapshotMeta,
            snapshot_meta.as_union_value(),
            value_hash,
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

    pub fn next_mutation_id(&self) -> u64 {
        let meta = self.commit().meta().unwrap();
        let mid = match meta.typed_type() {
            commit::MetaTyped::LocalMeta => meta.typed_as_local_meta().unwrap().mutation_id(),
            commit::MetaTyped::SnapshotMeta => {
                meta.typed_as_snapshot_meta().unwrap().last_mutation_id()
            }
            commit::MetaTyped::NONE => unreachable!(),
        };
        mid + 1
    }

    fn validate(buffer: &[u8]) -> Result<(), LoadError> {
        use LoadError::*;
        let root = commit::get_root_as_commit(buffer);
        root.value_hash().ok_or(MissingValueHash)?;

        let meta = root.meta().ok_or(MissingMeta)?;
        meta.local_create_date().ok_or(MissingLocalCreateDate)?;
        // basis_hash is optional -- the first commit lacks a basis
        meta.checksum().ok_or(MissingChecksum)?;
        Checksum::from_str(meta.checksum().unwrap()).map_err(|_| InvalidChecksum)?;

        match meta.typed_type() {
            commit::MetaTyped::LocalMeta => {
                Commit::validate_local_meta(meta.typed_as_local_meta().ok_or(MissingTyped)?)
            }
            commit::MetaTyped::SnapshotMeta => {
                Commit::validate_snapshot_meta(meta.typed_as_snapshot_meta().ok_or(MissingTyped)?)
            }
            _ => Err(UnknownMetaType),
        }
    }

    fn validate_local_meta(local_meta: commit::LocalMeta) -> Result<(), LoadError> {
        use LoadError::*;
        local_meta.mutator_name().ok_or(MissingMutatorName)?;
        local_meta
            .mutator_args_json()
            .ok_or(MissingMutatorArgsJSON)?;
        // original_hash is optional
        Ok(())
    }

    fn validate_snapshot_meta(snapshot_meta: commit::SnapshotMeta) -> Result<(), LoadError> {
        use LoadError::*;
        // zero is allowed for last_mutation_id (for the first snapshot)
        snapshot_meta
            .server_state_id()
            .ok_or(MissingServerStateID)?;
        Ok(())
    }

    fn commit(&self) -> commit::Commit {
        commit::get_root_as_commit(&self.chunk.data())
    }

    fn new_impl(
        mut builder: FlatBufferBuilder,
        local_create_date: &str,
        basis_hash: Option<&str>,
        checksum: Checksum,
        union_type: commit::MetaTyped,
        union_value: flatbuffers::WIPOffset<flatbuffers::UnionWIPOffset>,
        value_hash: &str,
    ) -> Commit {
        let meta_args = &commit::MetaArgs {
            local_create_date: builder.create_string(local_create_date).into(),
            basis_hash: basis_hash.map(|s| builder.create_string(s)),
            checksum: builder.create_string(&checksum.to_string()).into(),
            typed_type: union_type,
            typed: union_value.into(),
        };
        let meta = commit::Meta::create(&mut builder, meta_args);
        let commit_args = &commit::CommitArgs {
            meta: meta.into(),
            value_hash: builder.create_string(value_hash).into(),
        };
        let commit = commit::Commit::create(&mut builder, commit_args);
        builder.finish(commit, None);

        let chunk = dag::Chunk::new(builder.collapse(), &[value_hash]);
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

    // Parts are (last_mutation_id, server_state_id).
    pub fn snapshot_meta_parts(c: &Commit) -> Result<(u64, String), ProgrammerError> {
        match c.meta().typed() {
            MetaTyped::Local(_) => Err(ProgrammerError::WrongType(str!("Snapshot meta expected"))),
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

pub struct Meta<'a> {
    fb: commit::Meta<'a>,
}

#[allow(dead_code)]
impl<'a> Meta<'a> {
    pub fn local_create_date(&self) -> &str {
        self.fb.local_create_date().unwrap()
    }

    pub fn basis_hash(&self) -> Option<&str> {
        self.fb.basis_hash()
    }
    pub fn checksum(&self) -> &str {
        self.fb.checksum().unwrap()
    }

    pub fn typed(&self) -> MetaTyped {
        match self.fb.typed_type() {
            commit::MetaTyped::LocalMeta => MetaTyped::Local(LocalMeta {
                fb: self.fb.typed_as_local_meta().unwrap(),
            }),
            commit::MetaTyped::SnapshotMeta => MetaTyped::Snapshot(SnapshotMeta {
                fb: self.fb.typed_as_snapshot_meta().unwrap(),
            }),
            commit::MetaTyped::NONE => panic!("notreached"),
        }
    }

    pub fn is_snapshot(&self) -> bool {
        match self.typed() {
            MetaTyped::Local(_) => false,
            MetaTyped::Snapshot(_) => true,
        }
    }
}

pub enum MetaTyped<'a> {
    Local(LocalMeta<'a>),
    Snapshot(SnapshotMeta<'a>),
}

pub struct LocalMeta<'a> {
    fb: commit::LocalMeta<'a>,
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
    fb: commit::SnapshotMeta<'a>,
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

#[derive(Debug, PartialEq)]
pub enum LoadError {
    InvalidChecksum,
    MissingMutatorName,
    MissingMutatorArgsJSON,
    MissingServerStateID,
    MissingLocalCreateDate,
    MissingChecksum,
    MissingTyped,
    MissingMeta,
    MissingValueHash,
    UnknownMetaType,
}

#[derive(Debug)]
pub enum FromHashError {
    GetChunkFailed(dag::Error),
    ChunkMissing(String),
    LoadCommitFailed(LoadError),
}

#[derive(Debug)]
pub enum ProgrammerError {
    WrongType(String),
}

#[cfg(test)]
mod tests {
    use super::super::test_helpers::*;
    use super::*;
    use crate::dag::Chunk;
    use crate::kv::memstore::MemStore;

    #[async_std::test]
    async fn test_base_snapshot() {
        let store = dag::Store::new(Box::new(MemStore::new()));
        let mut chain: Chain = vec![];

        add_genesis(&mut chain, &store).await;
        let genesis_hash = chain[0].chunk().hash();
        assert_eq!(
            genesis_hash,
            Commit::base_snapshot(genesis_hash, &store.read().await.unwrap().read())
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
                &store.read().await.unwrap().read()
            )
            .await
            .unwrap()
            .chunk()
            .hash()
        );

        add_snapshot(&mut chain, &store).await;
        let base_hash = store
            .read()
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
                &store.read().await.unwrap().read()
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
                &store.read().await.unwrap().read()
            )
            .await
            .unwrap()
            .chunk()
            .hash()
        );
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
        test(
            make_commit(
                Some(Box::new(|b: &mut FlatBufferBuilder| {
                    make_local_meta(b, 0, "".into(), Some(&[]), "".into())
                })),
                "".into(),
                "".into(),
                checksum_str,
                "".into(),
            ),
            Ok(Commit::new_local(
                "",
                "".into(),
                checksum,
                0,
                "",
                &[],
                "".into(),
                "",
            )),
        );
        test(
            make_commit(
                Some(Box::new(|b: &mut FlatBufferBuilder| {
                    make_local_meta(b, 0, None, Some(&[]), "".into())
                })),
                "".into(),
                "".into(),
                checksum_str,
                "".into(),
            ),
            Err(LoadError::MissingMutatorName),
        );
        test(
            make_commit(
                Some(Box::new(|b: &mut FlatBufferBuilder| {
                    make_local_meta(b, 0, "".into(), None, "".into())
                })),
                "".into(),
                "".into(),
                checksum_str,
                "".into(),
            ),
            Err(LoadError::MissingMutatorArgsJSON),
        );
        test(
            make_commit(
                Some(Box::new(|b: &mut FlatBufferBuilder| {
                    make_local_meta(b, 0, "".into(), Some(&[]), None)
                })),
                "".into(),
                "".into(),
                checksum_str,
                "".into(),
            ),
            Ok(Commit::new_local(
                "",
                "".into(),
                checksum,
                0,
                "",
                &[],
                None,
                "",
            )),
        );
        test(
            make_commit(
                Some(Box::new(|b: &mut FlatBufferBuilder| {
                    make_local_meta(b, 0, "".into(), Some(&[]), "".into())
                })),
                None,
                "".into(),
                checksum_str,
                "".into(),
            ),
            Err(LoadError::MissingLocalCreateDate),
        );
        test(
            make_commit(
                Some(Box::new(|b: &mut FlatBufferBuilder| {
                    make_local_meta(b, 0, "".into(), Some(&[]), "".into())
                })),
                "".into(),
                None,
                checksum_str,
                "".into(),
            ),
            Ok(Commit::new_local(
                "",
                None,
                checksum,
                0,
                "",
                &[],
                "".into(),
                "",
            )),
        );
        test(
            make_commit(
                Some(Box::new(|b: &mut FlatBufferBuilder| {
                    make_local_meta(b, 0, "".into(), Some(&[]), "".into())
                })),
                "".into(),
                "".into(),
                None,
                "".into(),
            ),
            Err(LoadError::MissingChecksum),
        );
        test(
            make_commit(
                Some(Box::new(|b: &mut FlatBufferBuilder| {
                    make_local_meta(b, 0, "".into(), Some(&[]), "".into())
                })),
                "".into(),
                "".into(),
                "BOOM".into(),
                "".into(),
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
                "".into(),
                None,
            ),
            Err(LoadError::MissingValueHash),
        );
        test(
            make_commit(
                Some(Box::new(|b: &mut FlatBufferBuilder| {
                    make_snapshot_meta(b, 0, "".into())
                })),
                "".into(),
                "".into(),
                checksum_str,
                "".into(),
            ),
            Ok(Commit::new_snapshot("", "".into(), checksum, 0, "", "")),
        );
        test(
            make_commit(
                Some(Box::new(|b: &mut FlatBufferBuilder| {
                    make_snapshot_meta(b, 0, None)
                })),
                "".into(),
                "".into(),
                checksum_str,
                "".into(),
            ),
            Err(LoadError::MissingServerStateID),
        );
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
            "local_create_date".into(),
            "basis_hash".into(),
            "11111111".into(),
            "value_hash".into(),
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
        assert_eq!(local.meta().local_create_date(), "local_create_date");
        assert_eq!(local.meta().basis_hash(), Some("basis_hash"));
        assert_eq!(local.meta().checksum(), "11111111");
        assert_eq!(local.value_hash(), "value_hash");
        assert_eq!(local.next_mutation_id(), 2);

        let snapshot = Commit::from_chunk(make_commit(
            Some(Box::new(|b: &mut FlatBufferBuilder| {
                make_snapshot_meta(b, 2, "server_state_id 2".into())
            })),
            "local_create_date 2".into(),
            "basis_hash 2".into(),
            "22222222".into(),
            "value_hash 2".into(),
        ))
        .unwrap();

        match snapshot.meta().typed() {
            MetaTyped::Local(_) => assert!(false),
            MetaTyped::Snapshot(sm) => {
                assert_eq!(sm.last_mutation_id(), 2);
                assert_eq!(sm.server_state_id(), "server_state_id 2");
            }
        }
        assert_eq!(snapshot.meta().local_create_date(), "local_create_date 2");
        assert_eq!(snapshot.meta().basis_hash(), Some("basis_hash 2"));
        assert_eq!(snapshot.meta().checksum(), "22222222");
        assert_eq!(snapshot.value_hash(), "value_hash 2");
        assert_eq!(snapshot.next_mutation_id(), 3);
    }

    fn make_commit(
        typed_meta: Option<
            Box<
                dyn FnOnce(
                    &mut FlatBufferBuilder,
                ) -> (
                    commit::MetaTyped,
                    flatbuffers::WIPOffset<flatbuffers::UnionWIPOffset>,
                ),
            >,
        >,
        local_create_date: Option<&str>,
        basis_hash: Option<&str>,
        checksum: Option<&str>,
        value_hash: Option<&str>,
    ) -> Chunk {
        let mut builder = FlatBufferBuilder::default();
        let typed_meta = typed_meta.map(|c| c(&mut builder));
        let args = &commit::MetaArgs {
            typed_type: typed_meta.map_or(commit::MetaTyped::NONE, |t| t.0),
            typed: typed_meta.map(|t| t.1),
            local_create_date: local_create_date.map(|s| builder.create_string(s)),
            basis_hash: basis_hash.map(|s| builder.create_string(s)),
            checksum: checksum.map(|s| builder.create_string(s)),
        };
        let meta = commit::Meta::create(&mut builder, args);
        let args = &commit::CommitArgs {
            meta: meta.into(),
            value_hash: value_hash.map(|s| builder.create_string(s)),
        };
        let commit = commit::Commit::create(&mut builder, args);
        builder.finish(commit, None);
        Chunk::new(
            builder.collapse(),
            value_hash.into_iter().collect::<Vec<&str>>().as_slice(),
        )
    }

    fn make_local_meta(
        builder: &mut FlatBufferBuilder,
        mutation_id: u64,
        mutator_name: Option<&str>,
        mutator_args_json: Option<&[u8]>,
        original_hash: Option<&str>,
    ) -> (
        commit::MetaTyped,
        flatbuffers::WIPOffset<flatbuffers::UnionWIPOffset>,
    ) {
        let args = &commit::LocalMetaArgs {
            mutation_id,
            mutator_name: mutator_name.map(|s| builder.create_string(s)),
            mutator_args_json: mutator_args_json.map(|b| builder.create_vector(b)),
            original_hash: original_hash.map(|s| builder.create_string(s)),
        };
        let local_meta = commit::LocalMeta::create(builder, args);
        (commit::MetaTyped::LocalMeta, local_meta.as_union_value())
    }

    fn make_snapshot_meta(
        builder: &mut FlatBufferBuilder,
        last_mutation_id: u64,
        server_state_id: Option<&str>,
    ) -> (
        commit::MetaTyped,
        flatbuffers::WIPOffset<flatbuffers::UnionWIPOffset>,
    ) {
        let args = &commit::SnapshotMetaArgs {
            last_mutation_id,
            server_state_id: server_state_id.map(|s| builder.create_string(s)),
        };
        let snapshot_meta = commit::SnapshotMeta::create(builder, args);
        (
            commit::MetaTyped::SnapshotMeta,
            snapshot_meta.as_union_value(),
        )
    }
}
