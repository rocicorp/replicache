use super::*;
use crate::dag;
use crate::db;
use crate::db::test_helpers::*;
use crate::db::{Commit, Whence};
use crate::util::rlog;
use str_macro::str;

// See db::test_helpers for add_local, add_snapshot, etc. We can't put add_local_rebase
// there because sync depends on db, and add_local_rebase depends on sync.

// add_sync_snapshot adds a sync snapshot off of the main chain's base snapshot and
// returns it (in chain order). Caller needs to supply which commit to take indexes
// from because it is context dependent (they should come from the parent of the
// first commit to rebase, or from head if no commits will be rebased).
pub async fn add_sync_snapshot<'a>(
    chain: &'a mut Chain,
    store: &dag::Store,
    take_indexes_from: usize,
    lc: rlog::LogContext,
) -> Chain {
    assert!(chain.len() >= 2); // Have to have at least a genesis and a local commit on main chain.

    let mut maybe_base_snapshot: Option<&Commit> = None;
    for i in (1..chain.len()).rev() {
        if chain[i - 1].meta().is_snapshot() {
            maybe_base_snapshot = Some(&chain[i - 1]);
            break;
        }
    }
    if maybe_base_snapshot.is_none() {
        panic!("main chain doesnt have a snapshot or local commit");
    }
    let base_snapshot = maybe_base_snapshot.unwrap();
    let mut sync_chain: Chain = vec![];

    // Add sync snapshot.
    let ssid = format!("sync_server_state_id_{}", chain.len());
    let indexes = db::read_indexes(&chain[take_indexes_from]);
    let w = db::Write::new_snapshot(
        Whence::Hash(base_snapshot.chunk().hash().to_string()),
        base_snapshot.mutation_id(),
        ssid,
        store.write(lc.clone()).await.unwrap(),
        indexes,
    )
    .await
    .unwrap();
    w.commit(SYNC_HEAD_NAME).await.unwrap();
    let (_, commit, _) = db::read_commit(
        Whence::Head(str!(SYNC_HEAD_NAME)),
        &store.read(lc.clone()).await.unwrap().read(),
    )
    .await
    .unwrap();
    sync_chain.push(commit);

    sync_chain
}
