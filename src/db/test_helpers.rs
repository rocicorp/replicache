use super::read::*;
use super::write::*;
use super::*;
use crate::dag;
use crate::db;
use crate::util::nanoserde::any::Any;
use crate::util::rlog::LogContext;
use str_macro::str;

pub type Chain = Vec<Commit>;

pub async fn add_genesis<'a>(chain: &'a mut Chain, store: &dag::Store) -> &'a mut Chain {
    assert_eq!(0, chain.len());
    init_db(
        store.write(LogContext::new()).await.unwrap(),
        db::DEFAULT_HEAD_NAME,
        "local_create_date",
    )
    .await
    .unwrap();
    let (_, commit, _) = read_commit(
        Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
        &store.read(LogContext::new()).await.unwrap().read(),
    )
    .await
    .unwrap();
    chain.push(commit);
    chain
}

pub async fn add_local<'a>(chain: &'a mut Chain, store: &dag::Store) -> &'a mut Chain {
    assert!(chain.len() > 0);
    let i = chain.len() as u64;
    let mut w = Write::new_local(
        Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
        format!("mutator_name_{}", i),
        Any::Array(vec![Any::U64(i)]),
        None,
        store.write(LogContext::new()).await.unwrap(),
    )
    .await
    .unwrap();
    w.put(vec![4, 2], format!("{}", chain.len()).into_bytes());
    w.commit(db::DEFAULT_HEAD_NAME, "local_create_date")
        .await
        .unwrap();
    let (_, commit, _) = read_commit(
        Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
        &store.read(LogContext::new()).await.unwrap().read(),
    )
    .await
    .unwrap();
    chain.push(commit);
    chain
}

// See also sync::test_helpers for add_sync_snapshot, which can't go here because
// it depends on details of sync and sync depends on db.

// The optional map for the commit is treated as key, value pairs.
pub async fn add_snapshot<'a>(
    chain: &'a mut Chain,
    store: &dag::Store,
    map: Option<Vec<String>>,
) -> &'a mut Chain {
    assert!(chain.len() > 0);
    let ssid = format!("server_state_id_{}", chain.len());
    let mut w = Write::new_snapshot(
        Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
        chain[chain.len() - 1].next_mutation_id(),
        ssid,
        store.write(LogContext::new()).await.unwrap(),
    )
    .await
    .unwrap();
    if let Some(m) = map {
        let mut i = 0;
        while i <= m.len() - 2 {
            w.put(m[i].as_bytes().into(), m[i + 1].as_bytes().into());
            i += 2;
        }
    }
    w.commit(db::DEFAULT_HEAD_NAME, "local_create_date")
        .await
        .unwrap();
    let (_, commit, _) = read_commit(
        Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
        &store.read(LogContext::new()).await.unwrap().read(),
    )
    .await
    .unwrap();
    chain.push(commit);
    chain
}
