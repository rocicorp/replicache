use super::*;
use crate::dag;
use crate::db;
use crate::db::test_helpers::*;
use crate::util::nanoserde::any::Any;
use str_macro::str;

// See db::test_helpers for add_local, add_snapshot, etc. We can't put add_local_rebase
// there because sync depends on db, and add_local_rebase depends on sync.

// add_sync_snapshot adds a sync snapshot and, optionally, a local rebase commit off of the main
// chain's base snapshot and returns them (in chain order).
pub async fn add_sync_snapshot<'a>(
    chain: &'a mut Chain,
    store: &dag::Store,
    add_replayed: bool,
) -> Chain {
    assert!(chain.len() >= 2); // Have to have at least a genesis and a local commit on main chain.

    let mut maybe_base_snapshot: Option<&Commit> = None;
    let mut maybe_rebased_original: Option<&Commit> = None;
    for i in (1..chain.len()).rev() {
        if chain[i - 1].meta().is_snapshot() {
            maybe_base_snapshot = Some(&chain[i - 1]);
            maybe_rebased_original = Some(&chain[i]);
        }
    }
    if maybe_base_snapshot.is_none() || maybe_rebased_original.is_none() {
        panic!("main chain doesnt have a snapshot or local commit");
    }
    let base_snapshot = maybe_base_snapshot.unwrap();
    let rebased_original = maybe_rebased_original.unwrap();
    let mut sync_chain: Chain = vec![];

    // Add sync snapshot.
    let ssid = format!("sync_server_state_id_{}", chain.len());
    let w = db::Write::new_snapshot(
        Whence::Hash(base_snapshot.chunk().hash().to_string()),
        base_snapshot.mutation_id(),
        ssid,
        store.write().await.unwrap(),
    )
    .await
    .unwrap();
    w.commit(SYNC_HEAD_NAME, "local_create_date").await.unwrap();
    let (sync_snapshot_hash, commit, _) = db::read_commit(
        Whence::Head(str!(SYNC_HEAD_NAME)),
        &store.read().await.unwrap().read(),
    )
    .await
    .unwrap();
    sync_chain.push(commit);
    if !add_replayed {
        return sync_chain;
    }

    // Add rebase.
    let meta = rebased_original.meta();
    let lm = match meta.typed() {
        MetaTyped::Local(lm) => lm,
        _ => panic!("not local"),
    };
    let w = db::Write::new_local(
        Whence::Hash(sync_snapshot_hash),
        str!(lm.mutator_name()),
        Any::deserialize_json(std::str::from_utf8(lm.mutator_args_json()).unwrap()).unwrap(),
        Some(str!(rebased_original.chunk().hash())),
        store.write().await.unwrap(),
    )
    .await
    .unwrap();
    w.commit(SYNC_HEAD_NAME, "local_create_date").await.unwrap();
    let (_, commit, _) = db::read_commit(
        Whence::Head(str!(SYNC_HEAD_NAME)),
        &store.read().await.unwrap().read(),
    )
    .await
    .unwrap();
    sync_chain.push(commit);

    sync_chain
}
