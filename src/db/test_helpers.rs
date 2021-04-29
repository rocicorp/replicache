use super::read::*;
use super::write::*;
use super::*;
use crate::dag;
use crate::db;
use crate::util::rlog::LogContext;
use serde_json::json;
use str_macro::str;

pub type Chain = Vec<Commit>;

pub async fn add_genesis<'a>(chain: &'a mut Chain, store: &dag::Store) -> &'a mut Chain {
    assert_eq!(0, chain.len());
    let commit = create_genesis(store).await;
    chain.push(commit);
    chain
}

pub async fn create_genesis<'a>(store: &dag::Store) -> Commit {
    init_db(
        store.write(LogContext::new()).await.unwrap(),
        db::DEFAULT_HEAD_NAME,
    )
    .await
    .unwrap();
    let (_, commit, _) = read_commit(
        Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
        &store.read(LogContext::new()).await.unwrap().read(),
    )
    .await
    .unwrap();
    commit
}

// Local commit has mutator name and args according to its index in the
// chain.
pub async fn add_local<'a>(chain: &'a mut Chain, store: &dag::Store) -> &'a mut Chain {
    assert!(chain.len() > 0);
    let i = chain.len() as u64;
    let commit = create_local(
        vec![(str!("local").into(), format!("\"{}\"", i).into_bytes())],
        store,
        i,
    )
    .await;
    chain.push(commit);
    chain
}

pub async fn create_local(entries: Vec<(Vec<u8>, Vec<u8>)>, store: &dag::Store, i: u64) -> Commit {
    let mut w = Write::new_local(
        Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
        format!("mutator_name_{}", i),
        json!([i]).to_string(),
        None,
        store.write(LogContext::new()).await.unwrap(),
    )
    .await
    .unwrap();
    for (key, val) in entries {
        w.put(LogContext::new(), key, val).await.unwrap();
    }
    w.commit(db::DEFAULT_HEAD_NAME).await.unwrap();
    let (_, commit, _) = read_commit(
        Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
        &store.read(LogContext::new()).await.unwrap().read(),
    )
    .await
    .unwrap();
    commit
}

pub async fn add_index_change<'a>(chain: &'a mut Chain, store: &dag::Store) -> &'a mut Chain {
    assert!(chain.len() > 0);
    let i = chain.len() as u64;
    let commit = create_index(i.to_string(), "local", "", store).await;
    chain.push(commit);
    chain
}

pub async fn create_index(
    name: String,
    prefix: &str,
    json_pointer: &str,
    store: &dag::Store,
) -> Commit {
    let mut w = Write::new_index_change(
        Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
        store.write(LogContext::new()).await.unwrap(),
    )
    .await
    .unwrap();
    w.create_index(LogContext::new(), name, prefix.as_bytes(), json_pointer)
        .await
        .unwrap();
    w.commit(db::DEFAULT_HEAD_NAME).await.unwrap();
    let (_, commit, _) = read_commit(
        Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
        &store.read(LogContext::new()).await.unwrap().read(),
    )
    .await
    .unwrap();
    commit
}

// See also sync::test_helpers for add_sync_snapshot, which can't go here because
// it depends on details of sync and sync depends on db.

// The optional map for the commit is treated as key, value pairs.
pub async fn add_snapshot<'a>(
    chain: &'a mut Chain,
    store: &dag::Store,
    map: Option<Vec<(&str, &str)>>,
) -> &'a mut Chain {
    assert!(chain.len() > 0);
    let cookie = serde_json::json!(format!("cookie_{}", chain.len()));
    let mut w = Write::new_snapshot(
        Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
        chain.last().unwrap().next_mutation_id(),
        cookie,
        store.write(LogContext::new()).await.unwrap(),
        db::read_indexes(chain.last().unwrap()),
    )
    .await
    .unwrap();
    if let Some(m) = map {
        for (k, v) in m {
            w.put(LogContext::new(), k.as_bytes().into(), v.as_bytes().into())
                .await
                .unwrap();
        }
    }
    w.commit(db::DEFAULT_HEAD_NAME).await.unwrap();
    let (_, commit, _) = read_commit(
        Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
        &store.read(LogContext::new()).await.unwrap().read(),
    )
    .await
    .unwrap();
    chain.push(commit);
    chain
}
