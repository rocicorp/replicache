use super::read::*;
use super::write::*;
use super::*;
use crate::dag;
use crate::db;
use crate::util::nanoserde::any::Any;
use str_macro::str;

pub type Chain = Vec<Commit>;

pub async fn add_genesis<'a>(chain: &'a mut Chain, store: &dag::Store) -> &'a mut Chain {
    assert_eq!(0, chain.len());
    init_db(
        store.write().await.unwrap(),
        db::DEFAULT_HEAD_NAME,
        "local_create_date",
    )
    .await
    .unwrap();
    let (_, commit, _) = read_commit(
        Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
        &store.read().await.unwrap().read(),
    )
    .await
    .unwrap();
    chain.push(commit);
    chain
}

pub async fn add_local<'a>(chain: &'a mut Chain, store: &dag::Store) -> &'a mut Chain {
    assert!(chain.len() > 0);
    let w = Write::new_local(
        Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
        str!("mutator_name"),
        Any::Array(vec![]),
        None,
        store.write().await.unwrap(),
    )
    .await
    .unwrap();
    let checksum = format!("checksum{}", chain.len());
    w.commit(db::DEFAULT_HEAD_NAME, "local_create_date", &checksum)
        .await
        .unwrap();
    let (_, commit, _) = read_commit(
        Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
        &store.read().await.unwrap().read(),
    )
    .await
    .unwrap();
    chain.push(commit);
    chain
}

pub async fn add_snapshot<'a>(chain: &'a mut Chain, store: &dag::Store) -> &'a mut Chain {
    assert!(chain.len() > 0);
    let ssid = format!("server_state_id_{}", chain.len());
    let w = Write::new_snapshot(
        Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
        chain[chain.len() - 1].next_mutation_id(),
        ssid,
        store.write().await.unwrap(),
    )
    .await
    .unwrap();
    let checksum = format!("checksum{}", chain.len());
    w.commit(db::DEFAULT_HEAD_NAME, "local_create_date", &checksum)
        .await
        .unwrap();
    let (_, commit, _) = read_commit(
        Whence::Head(str!(db::DEFAULT_HEAD_NAME)),
        &store.read().await.unwrap().read(),
    )
    .await
    .unwrap();
    chain.push(commit);
    chain
}
