use super::read::*;
use super::write::*;
use super::*;
use crate::dag;
use crate::db;
use crate::util::rlog::LogContext;
use serde_json::json;
use std::collections::hash_map::HashMap;
use str_macro::str;

pub type Chain = Vec<Commit>;

pub async fn add_genesis<'a>(chain: &'a mut Chain, store: &dag::Store) -> &'a mut Chain {
    assert_eq!(0, chain.len());
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
    chain.push(commit);
    chain
}

// Local commit has mutator name and args according to its index in the
// chain.
pub async fn add_local<'a>(chain: &'a mut Chain, store: &dag::Store) -> &'a mut Chain {
    assert!(chain.len() > 0);
    let i = chain.len() as u64;
    let mut w = Write::new_local(
        Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
        format!("mutator_name_{}", i),
        json!([i]).to_string(),
        None,
        store.write(LogContext::new()).await.unwrap(),
    )
    .await
    .unwrap();
    w.put(
        LogContext::new(),
        str!("local").into(),
        format!("\"{}\"", i).into_bytes(),
    )
    .await
    .unwrap();
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

pub async fn add_index_change<'a>(chain: &'a mut Chain, store: &dag::Store) -> &'a mut Chain {
    assert!(chain.len() > 0);
    let i = chain.len() as u64;
    let mut w = Write::new_index_change(
        Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
        store.write(LogContext::new()).await.unwrap(),
    )
    .await
    .unwrap();
    w.create_index(LogContext::new(), i.to_string(), "local".as_bytes(), "")
        .await
        .unwrap();
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

// See also sync::test_helpers for add_sync_snapshot, which can't go here because
// it depends on details of sync and sync depends on db.

// The optional map for the commit is treated as key, value pairs.
pub async fn add_snapshot<'a>(
    chain: &'a mut Chain,
    store: &dag::Store,
    map: Option<Vec<String>>,
) -> &'a mut Chain {
    assert!(chain.len() > 0);
    let cookie = serde_json::json!(format!("cookie_{}", chain.len()));
    let mut w = Write::new_snapshot(
        Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
        chain[chain.len() - 1].next_mutation_id(),
        cookie,
        store.write(LogContext::new()).await.unwrap(),
        HashMap::new(),
    )
    .await
    .unwrap();
    if let Some(m) = map {
        let mut i = 0;
        while i <= m.len() - 2 {
            w.put(
                LogContext::new(),
                m[i].as_bytes().into(),
                m[i + 1].as_bytes().into(),
            )
            .await
            .unwrap();
            i += 2;
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
