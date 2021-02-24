#![allow(clippy::redundant_pattern_matching)] // For derive(Deserialize).

pub mod client_id;
mod patch;
mod pull;
mod push;
pub mod sync_id;
#[cfg(test)]
pub mod test_helpers;
mod types;

pub use pull::*;
pub use push::*;

pub use types::*;

pub const SYNC_HEAD_NAME: &str = "sync";

#[cfg(not(target_arch = "wasm32"))]
#[cfg(test)]
mod tests {
    use super::patch::Operation;
    use super::*;
    use crate::dag;
    use crate::db;
    use crate::db::test_helpers::*;
    use crate::db::{Commit, Whence, DEFAULT_HEAD_NAME};
    use crate::fetch;
    use crate::kv::memstore::MemStore;
    use crate::util::rlog::LogContext;
    use crate::util::to_debug;
    use async_std::net::TcpListener;
    use async_trait::async_trait;
    use serde::{Deserialize, Serialize};
    use serde_json::json;
    use std::clone::Clone;
    use std::default::Default;
    use std::fmt::Debug;
    use str_macro::str;
    use tide::{Body, Response};

    #[derive(Deserialize, Serialize)]
    struct BeginSyncRequest {
        #[serde(rename = "batchPushURL")]
        pub batch_push_url: String,
        #[serde(rename = "clientViewURL")]
        pub client_view_url: String,
        // data_layer_auth is used for push and for pull (as the client_view_auth).
        #[serde(rename = "dataLayerAuth")]
        pub data_layer_auth: String,
        #[serde(rename = "diffServerURL")]
        pub diff_server_url: String,
        #[serde(rename = "diffServerAuth")]
        pub diff_server_auth: String,
    }

    // If BeginSync did not pull new state then sync_head will be empty and the sync
    // is complete: the caller should not call maybeEndPull. If sync_head is present
    // then it pulled new state and the caller should proceed to call maybeEndPull.
    #[derive(Debug, Default, Deserialize, Serialize)]
    struct BeginSyncResponse {
        #[serde(rename = "syncHead")]
        pub sync_head: String,
        #[serde(rename = "syncInfo")]
        pub sync_info: SyncInfo,
    }

    #[derive(Debug, Default, Deserialize, Serialize)]
    struct SyncInfo {
        #[serde(rename = "syncID")]
        pub sync_id: String,

        // BatchPushInfo will be set if we attempted to push, ie if there were >0 pending commits.
        // Its http_status_code will be 0 if the request was not sent, eg we couldn't create
        // the request for some reason. It will be the status code returned by the server if
        // the server returned 200 and the result parsed properly or if the server returned
        // something other than 200.
        //
        // TODO the status code will be 0 if the server returned 200 but the result
        // could not be parsed -- this is a bug we could fix by always returning the
        // status code in the PushError. (The error_message will contain the error
        // in this case however.)
        #[serde(rename = "batchPushInfo")]
        #[serde(skip_serializing_if = "Option::is_none")]
        pub batch_push_info: Option<BatchPushInfo>,
        // ClientViewInfo will be set if the request to the diffserver completed with status 200
        // and the diffserver attempted to request the client view from the data layer.
        #[serde(rename = "clientViewInfo")]
        #[serde(skip_serializing_if = "Option::is_none")]
        pub client_view_info: Option<ClientViewInfo>,
    }

    #[derive(Debug)]
    enum BeginSyncError {
        TryPushError(TryPushError),
        BeginTryPullError(BeginTryPullError),
    }

    async fn begin_sync(
        store: &dag::Store,
        lc: LogContext,
        pusher: &dyn push::Pusher,
        puller: &dyn Puller,
        begin_sync_req: BeginSyncRequest,
        client_id: String,
        sync_id: String,
    ) -> Result<BeginSyncResponse, BeginSyncError> {
        let batch_push_info = push::push(
            &sync_id,
            store,
            lc.clone(),
            client_id.clone(),
            pusher,
            TryPushRequest {
                batch_push_url: begin_sync_req.batch_push_url,
                data_layer_auth: begin_sync_req.data_layer_auth.clone(),
            },
        )
        .await
        .map_err(BeginSyncError::TryPushError)?;

        let TryBeginPullResponse {
            client_view_info,
            sync_head,
            sync_id,
        } = begin_pull(
            client_id,
            TryBeginPullRequest {
                client_view_url: begin_sync_req.client_view_url,
                data_layer_auth: begin_sync_req.data_layer_auth,
                diff_server_url: begin_sync_req.diff_server_url,
                diff_server_auth: begin_sync_req.diff_server_auth,
            },
            puller,
            sync_id,
            store,
            lc,
        )
        .await
        .map_err(BeginSyncError::BeginTryPullError)?;

        Ok(BeginSyncResponse {
            sync_info: SyncInfo {
                sync_id,
                batch_push_info,
                client_view_info: Some(client_view_info),
            },
            sync_head,
        })
    }

    // TODO: we don't have a way to test overlapping syncs. Augmenting
    // FakePuller to land a snapshot during pull() doesn't work because
    // it requires access to the dag::Store which is not Send. We should
    // probably have a unit test for the predicate.
    #[async_std::test]
    async fn test_begin_sync() {
        let store = dag::Store::new(Box::new(MemStore::new()));
        let mut chain: Chain = vec![];
        add_genesis(&mut chain, &store).await;
        add_snapshot(&mut chain, &store, Some(vec![str!("foo"), str!("bar")])).await;
        // chain[2] is an index change
        add_index_change(&mut chain, &store).await;
        let starting_num_commits = chain.len();
        let base_snapshot = &chain[1];
        let (base_last_mutation_id, base_server_state_id) =
            Commit::snapshot_meta_parts(base_snapshot).unwrap();
        let base_checksum = base_snapshot.meta().checksum().to_string();

        let sync_id = str!("sync_id");
        let client_id = str!("test_client_id");
        let data_layer_auth = str!("data_layer_auth");

        // Push
        let batch_push_url = str!("batch_push_url");
        let client_view_url = str!("client_view_url");

        // Pull
        let diff_server_url = str!("diff_server_url");
        let diff_server_auth = str!("diff_server_auth");

        let good_client_view_info = ClientViewInfo {
            http_status_code: 200,
            error_message: str!(""),
        };
        let good_pull_resp = PullResponse {
            state_id: str!("new_state_id"),
            last_mutation_id: 10,
            patch: vec![
                Operation {
                    op: str!("replace"),
                    path: str!(""),
                    value_string: str!("{}"),
                },
                Operation {
                    op: str!("add"),
                    path: str!("/new"),
                    value_string: str!("\"value\""),
                },
            ],
            checksum: str!("f9ef007b"),
            client_view_info: good_client_view_info.clone(),
        };

        struct ExpCommit {
            state_id: String,
            last_mutation_id: u64,
            checksum: String,
            indexes: Vec<String>,
        }

        struct Case<'a> {
            pub name: &'a str,

            // Push expectations.
            pub num_pending_mutations: u32,
            pub exp_push_req: Option<push::BatchPushRequest>,
            pub push_result: Option<Result<push::BatchPushResponse, String>>,

            // Pull expectations.
            pub exp_pull_req: PullRequest,
            pub pull_result: Result<PullResponse, String>,

            // BeginPull expectations.
            pub exp_err: Option<&'a str>,
            pub exp_new_sync_head: Option<ExpCommit>,
        }
        let cases: Vec<Case> = vec![
            Case {
                name: "0 pending, pulls new state -> beginpull succeeds w/synchead set",
                num_pending_mutations: 0,
                exp_push_req: None,
                push_result: None,
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Ok(good_pull_resp.clone()),
                exp_err: None,
                exp_new_sync_head: Some(ExpCommit {
                    state_id: str!("new_state_id"),
                    last_mutation_id: 10,
                    checksum: str!("f9ef007b"),
                    indexes: vec![2.to_string()],
                }),
            },
            Case {
                name: "1 pending, 0 mutations to replay, pulls new state -> beginpull succeeds w/synchead set",
                num_pending_mutations: 1,
                exp_push_req: Some(push::BatchPushRequest {
                    client_id: client_id.clone(),
                    mutations: vec![
                        push::Mutation {
                            id: 2,
                            name: "mutator_name_3".to_string(),
                            args: json!([3]),
                        },
                    ],
                }),
                push_result: Some(Ok(push::BatchPushResponse {})),
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Ok(PullResponse {
                    last_mutation_id: 2,
                    ..good_pull_resp.clone()
                }),
                exp_err: None,
                exp_new_sync_head: Some(ExpCommit {
                    state_id: str!("new_state_id"),
                    last_mutation_id: 2,
                    checksum: str!("f9ef007b"),
                    indexes: vec![2.to_string(), 4.to_string()],
                }),
            },
            Case {
                name: "1 pending, 1 mutations to replay, pulls new state -> beginpull succeeds w/synchead set",
                num_pending_mutations: 1,
                exp_push_req: Some(push::BatchPushRequest {
                    client_id: client_id.clone(),
                    mutations: vec![
                        push::Mutation {
                            id: 2,
                            name: "mutator_name_3".to_string(),
                            args: json!([3]),
                        },
                    ],
                }),
                push_result: Some(Ok(push::BatchPushResponse {})),
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Ok(PullResponse {
                    last_mutation_id: 1,
                    ..good_pull_resp.clone()
                }),
                exp_err: None,
                exp_new_sync_head: Some(ExpCommit {
                    state_id: str!("new_state_id"),
                    last_mutation_id: 1,
                    checksum: str!("f9ef007b"),
                    indexes: vec![2.to_string()],
                }),
            },
            Case {
                name: "2 pending, 0 to replay, push succeeds, pulls new state -> beginpull succeeds w/synchead set",
                num_pending_mutations: 2,
                exp_push_req: Some(push::BatchPushRequest {
                    client_id: client_id.clone(),
                    mutations: vec![
                        // These mutations aren't actually added to the chain until the test
                        // case runs, but we happen to know how they are created by the db
                        // test helpers so we use that knowledge here.
                        push::Mutation {
                            id: 2,
                            name: "mutator_name_3".to_string(),
                            args: json!([3]),
                        },
                        push::Mutation {
                            id: 3,
                            name: "mutator_name_5".to_string(),
                            args: json!([5]),
                        },
                    ],
                }),
                push_result: Some(Ok(push::BatchPushResponse {})),
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Ok(good_pull_resp.clone()),
                exp_err: None,
                exp_new_sync_head: Some(ExpCommit {
                    state_id: str!("new_state_id"),
                    last_mutation_id: 10,
                    checksum: str!("f9ef007b"),
                    indexes: vec![2.to_string(), 4.to_string(), 6.to_string()],
                }),
            },
            Case {
                name: "2 pending, 1 to replay, push succeeds, pulls new state -> beginpull succeeds w/synchead set",
                num_pending_mutations: 2,
                exp_push_req: Some(push::BatchPushRequest {
                    client_id: client_id.clone(),
                    mutations: vec![
                        // These mutations aren't actually added to the chain until the test
                        // case runs, but we happen to know how they are created by the db
                        // test helpers so we use that knowledge here.
                        push::Mutation {
                            id: 2,
                            name: "mutator_name_3".to_string(),
                            args: json!([3]),
                        },
                        push::Mutation {
                            id: 3,
                            name: "mutator_name_5".to_string(),
                            args: json!([5]),
                        },
                    ],
                }),
                push_result: Some(Ok(push::BatchPushResponse {})),
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Ok(PullResponse {
                    last_mutation_id: 2,
                    ..good_pull_resp.clone()
                }),
                exp_err: None,
                exp_new_sync_head: Some(ExpCommit {
                    state_id: str!("new_state_id"),
                    last_mutation_id: 2,
                    checksum: str!("f9ef007b"),
                    indexes: vec![2.to_string(), 4.to_string()],
                }),
            },
            Case {
                name: "2 mutations to push, push errors, pulls new state -> beginpull succeeds w/synchead set",
                num_pending_mutations: 2,
                exp_push_req: Some(push::BatchPushRequest {
                    client_id: client_id.clone(),
                    mutations: vec![
                        // These mutations aren't actually added to the chain until the test
                        // case runs, but we happen to know how they are created by the db
                        // test helpers so we use that knowledge here.
                        push::Mutation {
                            id: 2,
                            name: "mutator_name_3".to_string(),
                            args: json!([3]),
                        },
                        push::Mutation {
                            id: 3,
                            name: "mutator_name_5".to_string(),
                            args: json!([5]),
                        },
                    ],
                }),
                push_result: Some(Err(str!("FetchNotOk(500)"))),
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Ok(good_pull_resp.clone()),
                exp_err: None,
                exp_new_sync_head: Some(ExpCommit {
                    state_id: str!("new_state_id"),
                    last_mutation_id: 10,
                    checksum: str!("f9ef007b"),
                    indexes: vec![2.to_string(), 4.to_string(), 6.to_string()],
                }),
            },

            // TODO: add test for same state id but later mutation id. Right now we treat
            // it as a nop because the state id does not change, but probably we should treat
            // it like success and complete the sync. Current behavior mirrors the (probably
            // incorrect?) go behavior.
            Case {
                name: "nop push, pulls same state -> beginpull succeeds with no synchead",
                num_pending_mutations: 0,
                exp_push_req: None,
                push_result: None,
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Ok(PullResponse {
                    state_id: base_server_state_id.clone(),
                    last_mutation_id: base_last_mutation_id,
                    patch: vec![],
                    checksum: base_checksum.clone(),
                    client_view_info: good_client_view_info.clone(),
                }),
                exp_err: None,
                exp_new_sync_head: None,
            },
            Case {
                name: "nop push, pulls new state w/lesser mutation id -> beginpull errors",
                num_pending_mutations: 0,
                exp_push_req: None,
                push_result: None,
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Ok(PullResponse {
                    last_mutation_id: 0,
                    ..good_pull_resp.clone()
                }),
                exp_err: Some("TimeTravel"),
                exp_new_sync_head: None,
            },
            Case {
                name: "nop push, pulls new state w/empty state id -> beginpull errors",
                num_pending_mutations: 0,
                exp_push_req: None,
                push_result: None,
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Ok(PullResponse {
                    state_id: str!(""),
                    ..good_pull_resp.clone()
                }),
                exp_err: Some("MissingStateID"),
                exp_new_sync_head: None,
            },
            Case {
                name: "nop push, pulls new state w/no checksum -> beginpull errors",
                num_pending_mutations: 0,
                exp_push_req: None,
                push_result: None,
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Ok(PullResponse {
                    checksum: str!(""),
                    ..good_pull_resp.clone()
                }),
                exp_err: Some("InvalidChecksum"),
                exp_new_sync_head: None,
            },
            Case {
                name: "nop push, pulls new state w/bad checksum -> beginpull errors",
                num_pending_mutations: 0,
                exp_push_req: None,
                push_result: None,
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Ok(PullResponse {
                    checksum: str!(12345678),
                    ..good_pull_resp.clone()
                }),
                exp_err: Some("WrongChecksum"),
                exp_new_sync_head: None,
            },
            Case {
                name: "nop push, pull 500s -> beginpull errors",
                num_pending_mutations: 0,
                exp_push_req: None,
                push_result: None,
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Err(str!("FetchNotOk(500)")),
                exp_err: Some("FetchNotOk(500)"),
                exp_new_sync_head: None,
            },
        ];
        for c in cases.iter() {
            // Reset state of the store.
            chain.truncate(starting_num_commits);
            let w = store.write(LogContext::new()).await.unwrap();
            w.set_head(
                DEFAULT_HEAD_NAME,
                Some(chain[chain.len() - 1].chunk().hash()),
            )
            .await
            .unwrap();
            w.set_head(SYNC_HEAD_NAME, None).await.unwrap();
            w.commit().await.unwrap();
            for _ in 0..c.num_pending_mutations {
                add_local(&mut chain, &store).await;
                add_index_change(&mut chain, &store).await;
            }

            // There was an index added after the snapshot, and one for each local commit.
            // Here we scan to ensure that we get values when scanning using one of the
            // indexes created. We do this because after calling begin_sync we check that
            // the index no longer returns values, demonstrating that it was rebuilt.
            if c.num_pending_mutations > 0 {
                let dag_read = store.read(LogContext::new()).await.unwrap();
                let read = db::OwnedRead::from_whence(
                    db::Whence::Head(DEFAULT_HEAD_NAME.to_string()),
                    dag_read,
                )
                .await
                .unwrap();
                use std::cell::RefCell;
                let got = RefCell::new(false);

                read.as_read()
                    .scan(
                        db::ScanOptions {
                            prefix: Some(str!("")),
                            start_secondary_key: None,
                            start_key: None,
                            start_exclusive: None,
                            limit: None,
                            index_name: Some(str!("2")),
                        },
                        |_: db::ScanResult<'_>| {
                            *got.borrow_mut() = true;
                        },
                    )
                    .await
                    .unwrap();
                assert!(*got.borrow(), "{}: expected values, got none", c.name);
            }

            // See explanation in FakePusher for why we do this dance with the push_result.
            let (exp_push, push_resp, push_err) = match &c.push_result {
                Some(Ok(resp)) => (true, Some(resp.clone()), None),
                Some(Err(e)) => (true, None, Some(e.clone())),
                None => (false, None, None),
            };
            let fake_pusher = FakePusher {
                exp_push,
                exp_push_req: c.exp_push_req.as_ref(),
                exp_batch_push_url: &batch_push_url,
                exp_batch_push_auth: &data_layer_auth,
                exp_sync_id: &sync_id,
                resp: push_resp,
                err: push_err,
            };

            // See explanation in FakePuller for why we do this dance with the pull_result.
            let (pull_resp, pull_err) = match &c.pull_result {
                Ok(resp) => (Some(resp.clone()), None),
                Err(e) => (None, Some(e.clone())),
            };
            let fake_puller = FakePuller {
                exp_pull_req: &c.exp_pull_req,
                exp_diff_server_url: &diff_server_url,
                exp_diff_server_auth: &diff_server_auth,
                exp_sync_id: &sync_id,
                resp: pull_resp,
                err: pull_err,
            };

            let begin_sync_req = BeginSyncRequest {
                batch_push_url: batch_push_url.clone(),
                client_view_url: client_view_url.clone(),
                data_layer_auth: data_layer_auth.clone(),
                diff_server_url: diff_server_url.clone(),
                diff_server_auth: diff_server_auth.clone(),
            };
            let result = begin_sync(
                &store,
                LogContext::new(),
                &fake_pusher,
                &fake_puller,
                begin_sync_req,
                str!("test_client_id"),
                sync_id.clone(),
            )
            .await;
            let mut got_resp: Option<BeginSyncResponse> = None;
            match c.exp_err {
                None => {
                    assert!(result.is_ok(), format!("{}: {:?}", c.name, result));
                    got_resp = Some(result.unwrap());
                }
                Some(e) => assert!(to_debug(result.unwrap_err()).contains(e)),
            };
            let owned_read = store.read(LogContext::new()).await.unwrap();
            let read = owned_read.read();
            match &c.exp_new_sync_head {
                None => {
                    let got_head = read.get_head(SYNC_HEAD_NAME).await.unwrap();
                    assert!(
                        got_head.is_none(),
                        format!(
                            "{}: expected head to be None, was {}",
                            c.name,
                            got_head.unwrap()
                        )
                    );
                    // In a nop sync we except Beginpull to succeed but sync_head will
                    // be empty.
                    if c.exp_err.is_none() {
                        assert!(&got_resp.as_ref().unwrap().sync_head.is_empty());
                    }
                }
                Some(exp_sync_head) => {
                    let sync_head_hash = read.get_head(SYNC_HEAD_NAME).await.unwrap().unwrap();
                    let sync_head =
                        Commit::from_chunk(read.get_chunk(&sync_head_hash).await.unwrap().unwrap())
                            .unwrap();
                    let (got_last_mutation_id, got_server_state_id) =
                        Commit::snapshot_meta_parts(&sync_head).unwrap();
                    assert_eq!(exp_sync_head.last_mutation_id, got_last_mutation_id);
                    assert_eq!(exp_sync_head.state_id, got_server_state_id);
                    assert_eq!(
                        exp_sync_head.checksum,
                        sync_head.meta().checksum().to_string().as_str(),
                        "{}",
                        c.name
                    );

                    // Check we have the expected index definitions.
                    let indexes: Vec<String> = sync_head
                        .indexes()
                        .iter()
                        .map(|i| i.definition.name.clone())
                        .collect();
                    assert_eq!(
                        exp_sync_head.indexes.len(),
                        indexes.len(),
                        "{}: expected indexes {:?}, got {:?}",
                        c.name,
                        exp_sync_head.indexes,
                        indexes
                    );
                    exp_sync_head
                        .indexes
                        .iter()
                        .for_each(|i| assert!(indexes.contains(i)));

                    // Check that we *don't* have old indexed values. The indexes should
                    // have been rebuilt with a client view returned by the server that
                    // does not include local= values. The check for len > 1 is because
                    // the snapshot's index is not what we want; we want the first index
                    // change's index ("2").
                    if exp_sync_head.indexes.len() > 1 {
                        let dag_read = store.read(LogContext::new()).await.unwrap();
                        let read = db::OwnedRead::from_whence(
                            db::Whence::Head(SYNC_HEAD_NAME.to_string()),
                            dag_read,
                        )
                        .await
                        .unwrap();
                        read.as_read()
                            .scan(
                                db::ScanOptions {
                                    prefix: Some(str!("")),
                                    start_secondary_key: None,
                                    start_key: None,
                                    start_exclusive: None,
                                    limit: None,
                                    index_name: Some(str!("2")),
                                },
                                |sr: db::ScanResult<'_>| {
                                    assert!(false, "{}: expected no values, got {:?}", c.name, sr);
                                },
                            )
                            .await
                            .unwrap();
                    }

                    assert_eq!(&sync_head_hash, &got_resp.as_ref().unwrap().sync_head);
                }
            }

            // Check that SyncInfo is filled like we would expect.
            if c.exp_err.is_none() {
                let resp = got_resp.unwrap();
                let got_push_info = resp.sync_info.batch_push_info;
                match &c.push_result {
                    Some(Ok(_)) => assert_eq!(200, got_push_info.unwrap().http_status_code),
                    Some(Err(_)) => assert_eq!(500, got_push_info.unwrap().http_status_code),
                    _ => (),
                };

                let got_client_view_info = resp.sync_info.client_view_info.as_ref().unwrap();
                if !&c.pull_result.is_err() {
                    assert_eq!(
                        &c.pull_result.as_ref().unwrap().client_view_info,
                        got_client_view_info
                    );
                }
            }
        }
    }

    #[async_std::test]
    async fn test_push() {
        let store = dag::Store::new(Box::new(MemStore::new()));
        let mut chain: Chain = vec![];
        add_genesis(&mut chain, &store).await;
        add_snapshot(&mut chain, &store, Some(vec![str!("foo"), str!("bar")])).await;
        // chain[2] is an index change
        add_index_change(&mut chain, &store).await;
        let starting_num_commits = chain.len();
        let base_snapshot = &chain[1];
        let (base_last_mutation_id, base_server_state_id) =
            Commit::snapshot_meta_parts(base_snapshot).unwrap();
        let base_checksum = base_snapshot.meta().checksum().to_string();

        let sync_id = str!("sync_id");
        let client_id = str!("test_client_id");
        let data_layer_auth = str!("data_layer_auth");

        // Push
        let batch_push_url = str!("batch_push_url");
        let client_view_url = str!("client_view_url");

        // Pull
        let diff_server_url = str!("diff_server_url");
        let diff_server_auth = str!("diff_server_auth");

        let good_client_view_info = ClientViewInfo {
            http_status_code: 200,
            error_message: str!(""),
        };
        let good_pull_resp = PullResponse {
            state_id: str!("new_state_id"),
            last_mutation_id: 10,
            patch: vec![
                Operation {
                    op: str!("replace"),
                    path: str!(""),
                    value_string: str!("{}"),
                },
                Operation {
                    op: str!("add"),
                    path: str!("/new"),
                    value_string: str!("\"value\""),
                },
            ],
            checksum: str!("f9ef007b"),
            client_view_info: good_client_view_info.clone(),
        };

        struct ExpCommit {
            state_id: String,
            last_mutation_id: u64,
            checksum: String,
            indexes: Vec<String>,
        }

        struct Case<'a> {
            pub name: &'a str,

            // Push expectations.
            pub num_pending_mutations: u32,
            pub exp_push_req: Option<push::BatchPushRequest>,
            pub push_result: Option<Result<push::BatchPushResponse, String>>,

            // Pull expectations.
            pub exp_pull_req: PullRequest,
            pub pull_result: Result<PullResponse, String>,

            // BeginPull expectations.
            pub exp_err: Option<&'a str>,
            pub exp_new_sync_head: Option<ExpCommit>,
        }
        let cases: Vec<Case> = vec![
            Case {
                name: "0 pending, pulls new state -> beginpull succeeds w/synchead set",
                num_pending_mutations: 0,
                exp_push_req: None,
                push_result: None,
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Ok(good_pull_resp.clone()),
                exp_err: None,
                exp_new_sync_head: Some(ExpCommit {
                    state_id: str!("new_state_id"),
                    last_mutation_id: 10,
                    checksum: str!("f9ef007b"),
                    indexes: vec![2.to_string()],
                }),
            },
            Case {
                name: "1 pending, 0 mutations to replay, pulls new state -> beginpull succeeds w/synchead set",
                num_pending_mutations: 1,
                exp_push_req: Some(push::BatchPushRequest {
                    client_id: client_id.clone(),
                    mutations: vec![
                        push::Mutation {
                            id: 2,
                            name: "mutator_name_3".to_string(),
                            args: json!([3]),
                        },
                    ],
                }),
                push_result: Some(Ok(push::BatchPushResponse {})),
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Ok(PullResponse {
                    last_mutation_id: 2,
                    ..good_pull_resp.clone()
                }),
                exp_err: None,
                exp_new_sync_head: Some(ExpCommit {
                    state_id: str!("new_state_id"),
                    last_mutation_id: 2,
                    checksum: str!("f9ef007b"),
                    indexes: vec![2.to_string(), 4.to_string()],
                }),
            },
            Case {
                name: "1 pending, 1 mutations to replay, pulls new state -> beginpull succeeds w/synchead set",
                num_pending_mutations: 1,
                exp_push_req: Some(push::BatchPushRequest {
                    client_id: client_id.clone(),
                    mutations: vec![
                        push::Mutation {
                            id: 2,
                            name: "mutator_name_3".to_string(),
                            args: json!([3]),
                        },
                    ],
                }),
                push_result: Some(Ok(push::BatchPushResponse {})),
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Ok(PullResponse {
                    last_mutation_id: 1,
                    ..good_pull_resp.clone()
                }),
                exp_err: None,
                exp_new_sync_head: Some(ExpCommit {
                    state_id: str!("new_state_id"),
                    last_mutation_id: 1,
                    checksum: str!("f9ef007b"),
                    indexes: vec![2.to_string()],
                }),
            },
            Case {
                name: "2 pending, 0 to replay, push succeeds, pulls new state -> beginpull succeeds w/synchead set",
                num_pending_mutations: 2,
                exp_push_req: Some(push::BatchPushRequest {
                    client_id: client_id.clone(),
                    mutations: vec![
                        // These mutations aren't actually added to the chain until the test
                        // case runs, but we happen to know how they are created by the db
                        // test helpers so we use that knowledge here.
                        push::Mutation {
                            id: 2,
                            name: "mutator_name_3".to_string(),
                            args: json!([3]),
                        },
                        push::Mutation {
                            id: 3,
                            name: "mutator_name_5".to_string(),
                            args: json!([5]),
                        },
                    ],
                }),
                push_result: Some(Ok(push::BatchPushResponse {})),
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Ok(good_pull_resp.clone()),
                exp_err: None,
                exp_new_sync_head: Some(ExpCommit {
                    state_id: str!("new_state_id"),
                    last_mutation_id: 10,
                    checksum: str!("f9ef007b"),
                    indexes: vec![2.to_string(), 4.to_string(), 6.to_string()],
                }),
            },
            Case {
                name: "2 pending, 1 to replay, push succeeds, pulls new state -> beginpull succeeds w/synchead set",
                num_pending_mutations: 2,
                exp_push_req: Some(push::BatchPushRequest {
                    client_id: client_id.clone(),
                    mutations: vec![
                        // These mutations aren't actually added to the chain until the test
                        // case runs, but we happen to know how they are created by the db
                        // test helpers so we use that knowledge here.
                        push::Mutation {
                            id: 2,
                            name: "mutator_name_3".to_string(),
                            args: json!([3]),
                        },
                        push::Mutation {
                            id: 3,
                            name: "mutator_name_5".to_string(),
                            args: json!([5]),
                        },
                    ],
                }),
                push_result: Some(Ok(push::BatchPushResponse {})),
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Ok(PullResponse {
                    last_mutation_id: 2,
                    ..good_pull_resp.clone()
                }),
                exp_err: None,
                exp_new_sync_head: Some(ExpCommit {
                    state_id: str!("new_state_id"),
                    last_mutation_id: 2,
                    checksum: str!("f9ef007b"),
                    indexes: vec![2.to_string(), 4.to_string()],
                }),
            },
            Case {
                name: "2 mutations to push, push errors, pulls new state -> beginpull succeeds w/synchead set",
                num_pending_mutations: 2,
                exp_push_req: Some(push::BatchPushRequest {
                    client_id: client_id.clone(),
                    mutations: vec![
                        // These mutations aren't actually added to the chain until the test
                        // case runs, but we happen to know how they are created by the db
                        // test helpers so we use that knowledge here.
                        push::Mutation {
                            id: 2,
                            name: "mutator_name_3".to_string(),
                            args: json!([3]),
                        },
                        push::Mutation {
                            id: 3,
                            name: "mutator_name_5".to_string(),
                            args: json!([5]),
                        },
                    ],
                }),
                push_result: Some(Err(str!("FetchNotOk(500)"))),
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Ok(good_pull_resp.clone()),
                exp_err: None,
                exp_new_sync_head: Some(ExpCommit {
                    state_id: str!("new_state_id"),
                    last_mutation_id: 10,
                    checksum: str!("f9ef007b"),
                    indexes: vec![2.to_string(), 4.to_string(), 6.to_string()],
                }),
            },

            // TODO: add test for same state id but later mutation id. Right now we treat
            // it as a nop because the state id does not change, but probably we should treat
            // it like success and complete the sync. Current behavior mirrors the (probably
            // incorrect?) go behavior.
            Case {
                name: "nop push, pulls same state -> beginpull succeeds with no synchead",
                num_pending_mutations: 0,
                exp_push_req: None,
                push_result: None,
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Ok(PullResponse {
                    state_id: base_server_state_id.clone(),
                    last_mutation_id: base_last_mutation_id,
                    patch: vec![],
                    checksum: base_checksum.clone(),
                    client_view_info: good_client_view_info.clone(),
                }),
                exp_err: None,
                exp_new_sync_head: None,
            },
            Case {
                name: "nop push, pulls new state w/lesser mutation id -> beginpull errors",
                num_pending_mutations: 0,
                exp_push_req: None,
                push_result: None,
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Ok(PullResponse {
                    last_mutation_id: 0,
                    ..good_pull_resp.clone()
                }),
                exp_err: Some("TimeTravel"),
                exp_new_sync_head: None,
            },
            Case {
                name: "nop push, pulls new state w/empty state id -> beginpull errors",
                num_pending_mutations: 0,
                exp_push_req: None,
                push_result: None,
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Ok(PullResponse {
                    state_id: str!(""),
                    ..good_pull_resp.clone()
                }),
                exp_err: Some("MissingStateID"),
                exp_new_sync_head: None,
            },
            Case {
                name: "nop push, pulls new state w/no checksum -> beginpull errors",
                num_pending_mutations: 0,
                exp_push_req: None,
                push_result: None,
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Ok(PullResponse {
                    checksum: str!(""),
                    ..good_pull_resp.clone()
                }),
                exp_err: Some("InvalidChecksum"),
                exp_new_sync_head: None,
            },
            Case {
                name: "nop push, pulls new state w/bad checksum -> beginpull errors",
                num_pending_mutations: 0,
                exp_push_req: None,
                push_result: None,
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Ok(PullResponse {
                    checksum: str!(12345678),
                    ..good_pull_resp.clone()
                }),
                exp_err: Some("WrongChecksum"),
                exp_new_sync_head: None,
            },
            Case {
                name: "nop push, pull 500s -> beginpull errors",
                num_pending_mutations: 0,
                exp_push_req: None,
                push_result: None,
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_view_url: client_view_url.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    last_mutation_id: base_last_mutation_id,
                    version: 3,
                },
                pull_result: Err(str!("FetchNotOk(500)")),
                exp_err: Some("FetchNotOk(500)"),
                exp_new_sync_head: None,
            },
        ];
        for c in cases.iter() {
            // Reset state of the store.
            chain.truncate(starting_num_commits);
            let w = store.write(LogContext::new()).await.unwrap();
            w.set_head(
                DEFAULT_HEAD_NAME,
                Some(chain[chain.len() - 1].chunk().hash()),
            )
            .await
            .unwrap();
            w.set_head(SYNC_HEAD_NAME, None).await.unwrap();
            w.commit().await.unwrap();
            for _ in 0..c.num_pending_mutations {
                add_local(&mut chain, &store).await;
                add_index_change(&mut chain, &store).await;
            }

            // There was an index added after the snapshot, and one for each local commit.
            // Here we scan to ensure that we get values when scanning using one of the
            // indexes created. We do this because after calling begin_sync we check that
            // the index no longer returns values, demonstrating that it was rebuilt.
            if c.num_pending_mutations > 0 {
                let dag_read = store.read(LogContext::new()).await.unwrap();
                let read = db::OwnedRead::from_whence(
                    db::Whence::Head(DEFAULT_HEAD_NAME.to_string()),
                    dag_read,
                )
                .await
                .unwrap();
                use std::cell::RefCell;
                let got = RefCell::new(false);

                read.as_read()
                    .scan(
                        db::ScanOptions {
                            prefix: Some(str!("")),
                            start_secondary_key: None,
                            start_key: None,
                            start_exclusive: None,
                            limit: None,
                            index_name: Some(str!("2")),
                        },
                        |_: db::ScanResult<'_>| {
                            *got.borrow_mut() = true;
                        },
                    )
                    .await
                    .unwrap();
                assert!(*got.borrow(), "{}: expected values, got none", c.name);
            }

            // See explanation in FakePusher for why we do this dance with the push_result.
            let (exp_push, push_resp, push_err) = match &c.push_result {
                Some(Ok(resp)) => (true, Some(resp.clone()), None),
                Some(Err(e)) => (true, None, Some(e.clone())),
                None => (false, None, None),
            };
            let fake_pusher = FakePusher {
                exp_push,
                exp_push_req: c.exp_push_req.as_ref(),
                exp_batch_push_url: &batch_push_url,
                exp_batch_push_auth: &data_layer_auth,
                exp_sync_id: &sync_id,
                resp: push_resp,
                err: push_err,
            };

            // See explanation in FakePuller for why we do this dance with the pull_result.
            let (pull_resp, pull_err) = match &c.pull_result {
                Ok(resp) => (Some(resp.clone()), None),
                Err(e) => (None, Some(e.clone())),
            };
            let fake_puller = FakePuller {
                exp_pull_req: &c.exp_pull_req,
                exp_diff_server_url: &diff_server_url,
                exp_diff_server_auth: &diff_server_auth,
                exp_sync_id: &sync_id,
                resp: pull_resp,
                err: pull_err,
            };

            let begin_sync_req = BeginSyncRequest {
                batch_push_url: batch_push_url.clone(),
                client_view_url: client_view_url.clone(),
                data_layer_auth: data_layer_auth.clone(),
                diff_server_url: diff_server_url.clone(),
                diff_server_auth: diff_server_auth.clone(),
            };
            let result = begin_sync(
                &store,
                LogContext::new(),
                &fake_pusher,
                &fake_puller,
                begin_sync_req,
                str!("test_client_id"),
                sync_id.clone(),
            )
            .await;
            let mut got_resp: Option<BeginSyncResponse> = None;
            match c.exp_err {
                None => {
                    assert!(result.is_ok(), format!("{}: {:?}", c.name, result));
                    got_resp = Some(result.unwrap());
                }
                Some(e) => assert!(to_debug(result.unwrap_err()).contains(e)),
            };
            let owned_read = store.read(LogContext::new()).await.unwrap();
            let read = owned_read.read();
            match &c.exp_new_sync_head {
                None => {
                    let got_head = read.get_head(SYNC_HEAD_NAME).await.unwrap();
                    assert!(
                        got_head.is_none(),
                        format!(
                            "{}: expected head to be None, was {}",
                            c.name,
                            got_head.unwrap()
                        )
                    );
                    // In a nop sync we except Beginpull to succeed but sync_head will
                    // be empty.
                    if c.exp_err.is_none() {
                        assert!(&got_resp.as_ref().unwrap().sync_head.is_empty());
                    }
                }
                Some(exp_sync_head) => {
                    let sync_head_hash = read.get_head(SYNC_HEAD_NAME).await.unwrap().unwrap();
                    let sync_head =
                        Commit::from_chunk(read.get_chunk(&sync_head_hash).await.unwrap().unwrap())
                            .unwrap();
                    let (got_last_mutation_id, got_server_state_id) =
                        Commit::snapshot_meta_parts(&sync_head).unwrap();
                    assert_eq!(exp_sync_head.last_mutation_id, got_last_mutation_id);
                    assert_eq!(exp_sync_head.state_id, got_server_state_id);
                    assert_eq!(
                        exp_sync_head.checksum,
                        sync_head.meta().checksum().to_string().as_str(),
                        "{}",
                        c.name
                    );

                    // Check we have the expected index definitions.
                    let indexes: Vec<String> = sync_head
                        .indexes()
                        .iter()
                        .map(|i| i.definition.name.clone())
                        .collect();
                    assert_eq!(
                        exp_sync_head.indexes.len(),
                        indexes.len(),
                        "{}: expected indexes {:?}, got {:?}",
                        c.name,
                        exp_sync_head.indexes,
                        indexes
                    );
                    exp_sync_head
                        .indexes
                        .iter()
                        .for_each(|i| assert!(indexes.contains(i)));

                    // Check that we *don't* have old indexed values. The indexes should
                    // have been rebuilt with a client view returned by the server that
                    // does not include local= values. The check for len > 1 is because
                    // the snapshot's index is not what we want; we want the first index
                    // change's index ("2").
                    if exp_sync_head.indexes.len() > 1 {
                        let dag_read = store.read(LogContext::new()).await.unwrap();
                        let read = db::OwnedRead::from_whence(
                            db::Whence::Head(SYNC_HEAD_NAME.to_string()),
                            dag_read,
                        )
                        .await
                        .unwrap();
                        read.as_read()
                            .scan(
                                db::ScanOptions {
                                    prefix: Some(str!("")),
                                    start_secondary_key: None,
                                    start_key: None,
                                    start_exclusive: None,
                                    limit: None,
                                    index_name: Some(str!("2")),
                                },
                                |sr: db::ScanResult<'_>| {
                                    assert!(false, "{}: expected no values, got {:?}", c.name, sr);
                                },
                            )
                            .await
                            .unwrap();
                    }

                    assert_eq!(&sync_head_hash, &got_resp.as_ref().unwrap().sync_head);
                }
            }

            // Check that SyncInfo is filled like we would expect.
            if c.exp_err.is_none() {
                let resp = got_resp.unwrap();
                let got_push_info = resp.sync_info.batch_push_info;
                match &c.push_result {
                    Some(Ok(_)) => assert_eq!(200, got_push_info.unwrap().http_status_code),
                    Some(Err(_)) => assert_eq!(500, got_push_info.unwrap().http_status_code),
                    _ => (),
                };

                let got_client_view_info = resp.sync_info.client_view_info.as_ref().unwrap();
                if !&c.pull_result.is_err() {
                    assert_eq!(
                        &c.pull_result.as_ref().unwrap().client_view_info,
                        got_client_view_info
                    );
                }
            }
        }
    }

    pub struct FakePusher<'a> {
        exp_push: bool,
        exp_push_req: Option<&'a push::BatchPushRequest>,
        exp_batch_push_url: &'a str,
        exp_batch_push_auth: &'a str,
        exp_sync_id: &'a str,

        // We would like to write here:
        //    result: Result<BatchPushResponse, PushError>,
        // but pull takes &self so we can't move out of result if we did.
        // Cloning and returning result would work except for that our error
        // enums contain values that are not cloneable, eg http::Status and
        // DeserializeErr. (Or, I guess we could make pull take &mut self as another
        // solution, so long as all contained errors are Send. I think.)
        resp: Option<push::BatchPushResponse>,
        err: Option<String>,
    }

    #[async_trait(?Send)]
    impl<'a> push::Pusher for FakePusher<'a> {
        async fn push(
            &self,
            push_req: &push::BatchPushRequest,
            batch_push_url: &str,
            batch_push_auth: &str,
            sync_id: &str,
        ) -> Result<push::BatchPushResponse, push::PushError> {
            assert!(self.exp_push);

            if self.exp_push_req.is_some() {
                assert_eq!(self.exp_push_req.unwrap(), push_req);
                assert_eq!(self.exp_batch_push_url, batch_push_url);
                assert_eq!(self.exp_batch_push_auth, batch_push_auth);
                assert_eq!(self.exp_sync_id, sync_id);
            }

            match &self.err {
                Some(s) => match s.as_str() {
                    "FetchNotOk(500)" => Err(push::PushError::FetchNotOk(
                        http::StatusCode::INTERNAL_SERVER_ERROR,
                    )),
                    _ => panic!("not implemented"),
                },
                None => {
                    let r = self.resp.as_ref();
                    Ok(r.unwrap().clone())
                }
            }
        }
    }

    pub struct FakePuller<'a> {
        exp_pull_req: &'a PullRequest,
        exp_diff_server_url: &'a str,
        exp_diff_server_auth: &'a str,
        exp_sync_id: &'a str,

        // We would like to write here:
        //    result: Result<PullResponse, PullError>,
        // but pull takes &self so we can't move out of result if we did.
        // Cloning and returning result would work except for that our error
        // enums contain values that are not cloneable, eg http::Status and
        // DeserializeErr. (Or, I guess we could make pull take &mut self as another
        // solution, so long as all contained errors are Send. I think.)
        resp: Option<PullResponse>,
        err: Option<String>,
    }

    #[async_trait(?Send)]
    impl<'a> Puller for FakePuller<'a> {
        async fn pull(
            &self,
            pull_req: &PullRequest,
            diff_server_url: &str,
            diff_server_auth: &str,
            sync_id: &str,
        ) -> Result<PullResponse, PullError> {
            assert_eq!(self.exp_pull_req, pull_req);
            assert_eq!(self.exp_diff_server_url, diff_server_url);
            assert_eq!(self.exp_diff_server_auth, diff_server_auth);
            assert_eq!(self.exp_sync_id, sync_id);

            match &self.err {
                Some(s) => match s.as_str() {
                    "FetchNotOk(500)" => Err(PullError::FetchNotOk(
                        http::StatusCode::INTERNAL_SERVER_ERROR,
                    )),
                    _ => panic!("not implemented"),
                },
                None => {
                    let r = self.resp.as_ref();
                    Ok(r.unwrap().clone())
                }
            }
        }
    }

    #[async_std::test]
    async fn test_maybe_end_pull() {
        struct Case<'a> {
            pub name: &'a str,
            pub num_pending: usize,
            pub num_needing_replay: usize,
            pub intervening_sync: bool,
            pub exp_replay_ids: Vec<u64>,
            pub exp_err: Option<&'a str>,
        }
        let cases = [
            Case {
                name: "nothing pending",
                num_pending: 0,
                num_needing_replay: 0,
                intervening_sync: false,
                exp_replay_ids: vec![],
                exp_err: None,
            },
            Case {
                name: "2 pending but nothing to replay",
                num_pending: 2,
                num_needing_replay: 0,
                intervening_sync: false,
                exp_replay_ids: vec![],
                exp_err: None,
            },
            Case {
                name: "3 pending, 2 to replay",
                num_pending: 3,
                num_needing_replay: 2,
                intervening_sync: false,
                exp_replay_ids: vec![2, 3],
                exp_err: None,
            },
            Case {
                name: "another sync landed during replay",
                num_pending: 0,
                num_needing_replay: 0,
                intervening_sync: true,
                exp_replay_ids: vec![],
                exp_err: Some("OverlappingSyncsJSLogInfo"),
            },
        ];
        for c in cases.iter() {
            let store = dag::Store::new(Box::new(MemStore::new()));
            let mut chain: Chain = vec![];
            add_genesis(&mut chain, &store).await;
            // Add pending commits to the main chain.
            for _ in 0..c.num_pending {
                add_local(&mut chain, &store).await;
            }
            let dag_write = store.write(LogContext::new()).await.unwrap();
            dag_write
                .set_head(
                    db::DEFAULT_HEAD_NAME,
                    Some(chain[chain.len() - 1].chunk().hash()),
                )
                .await
                .unwrap();

            // Add snapshot and replayed commits to the sync chain.
            let w = db::Write::new_snapshot(
                db::Whence::Hash(chain[0].chunk().hash().to_string()),
                0,
                str!("sync_ssid"),
                dag_write,
                db::read_indexes(&chain[0]),
            )
            .await
            .unwrap();
            let mut basis_hash = w.commit(SYNC_HEAD_NAME).await.unwrap();

            if c.intervening_sync {
                add_snapshot(&mut chain, &store, None).await;
            }

            for i in 0..c.num_pending - c.num_needing_replay {
                let chain_index = i + 1; // chain[0] is genesis
                let original = &chain[chain_index];
                let (mutator_name, mutator_args) = match original.meta().typed() {
                    db::MetaTyped::Local(lm) => (
                        lm.mutator_name().to_string(),
                        String::from_utf8(lm.mutator_args_json().to_vec()).unwrap(),
                    ),
                    _ => panic!("impossible"),
                };
                let w = db::Write::new_local(
                    Whence::Hash(basis_hash),
                    mutator_name,
                    mutator_args,
                    Some(original.chunk().hash().to_string()),
                    store.write(LogContext::new()).await.unwrap(),
                )
                .await
                .unwrap();
                basis_hash = w.commit(SYNC_HEAD_NAME).await.unwrap();
            }
            let sync_head = basis_hash;

            let req = MaybeEndTryPullRequest {
                sync_id: str!("sync_id"),
                sync_head: sync_head.clone(),
            };
            let result = maybe_end_pull(&store, LogContext::new(), req).await;

            match c.exp_err {
                Some(e) => assert!(to_debug(result.unwrap_err()).contains(e)),
                None => {
                    assert!(result.is_ok(), format!("{}: {:?}", c.name, result));
                    let resp = result.unwrap();
                    assert_eq!(sync_head, resp.sync_head);
                    assert_eq!(
                        c.exp_replay_ids.len(),
                        resp.replay_mutations.len(),
                        "{}: expected {:?}, got {:?}",
                        c.name,
                        c.exp_replay_ids,
                        &resp.replay_mutations
                    );
                    for i in 0..c.exp_replay_ids.len() {
                        let chain_idx = chain.len() - c.num_needing_replay + i;
                        assert_eq!(c.exp_replay_ids[i], resp.replay_mutations[i].id);
                        match chain[chain_idx].meta().typed() {
                            db::MetaTyped::Local(lm) => {
                                assert_eq!(
                                    lm.mutator_name(),
                                    resp.replay_mutations[i].name,
                                    "{}: expected {:?}, got {:?}",
                                    c.name,
                                    lm.mutator_name(),
                                    resp.replay_mutations[i].name
                                );
                                let got_args = &resp.replay_mutations[i].args;
                                let exp_args =
                                    String::from_utf8(lm.mutator_args_json().to_vec()).unwrap();
                                assert_eq!(&exp_args, got_args);
                            }
                            _ => panic!("inconceivable"),
                        };
                    }

                    // Check if we set the main head like we should have.
                    if c.exp_replay_ids.len() == 0 {
                        let owned_read = store.read(LogContext::new()).await.unwrap();
                        let read = owned_read.read();
                        assert_eq!(
                            Some(sync_head),
                            read.get_head(db::DEFAULT_HEAD_NAME).await.unwrap(),
                            "{}",
                            c.name
                        );
                        assert_eq!(None, read.get_head(SYNC_HEAD_NAME).await.unwrap());
                    }
                }
            };
        }
    }

    #[async_std::test]
    async fn test_pull() {
        lazy_static! {
            static ref PULL_REQ: PullRequest = PullRequest {
                client_view_auth: str!("client-view-auth"),
                client_view_url: str!("client-view-url"),
                client_id: str!("client_id"),
                base_state_id: str!("base-state-id"),
                checksum: str!("00000000"),
                last_mutation_id: 123,
                version: 3,
            };
            // EXP_BODY must be 'static to be used in HTTP handler closure.
            static ref EXP_BODY: String = serde_json::to_string(&*PULL_REQ).unwrap();
        }
        let diff_server_auth = "diff-server-auth";
        let sync_id = "sync_id";
        let path = "/pull";

        struct Case<'a> {
            pub name: &'a str,
            pub resp_status: u16,
            pub resp_body: &'a str,
            pub exp_err: Option<&'a str>,
            pub exp_resp: Option<PullResponse>,
        }
        let cases = [
            Case {
                name: "200",
                resp_status: 200,
                resp_body: r#"{"stateID": "1", "lastMutationID": 2, "checksum": "12345678", "patch": [{"op":"replace","path":"","valueString":"{}"}], "clientViewInfo": { "httpStatusCode": 200, "errorMessage": "" }}"#,
                exp_err: None,
                exp_resp: Some(PullResponse {
                    state_id: str!("1"),
                    last_mutation_id: 2,
                    patch: vec![Operation {
                        op: str!("replace"),
                        path: str!(""),
                        value_string: str!("{}"),
                    }],
                    checksum: str!("12345678"),
                    client_view_info: ClientViewInfo {
                        http_status_code: 200,
                        error_message: str!(""),
                    },
                }),
            },
            Case {
                name: "403",
                resp_status: 403,
                resp_body: "forbidden",
                exp_err: Some("FetchNotOk(403)"),
                exp_resp: None,
            },
            Case {
                name: "invalid response",
                resp_status: 200,
                resp_body: r#"not json"#,
                exp_err: Some("\"expected ident\", line: 1, column: 2"),
                exp_resp: None,
            },
        ];

        for c in cases.iter() {
            let mut app = tide::new();

            let status = c.resp_status;
            let body = c.resp_body;
            app.at(path)
                .post(move |mut req: tide::Request<()>| async move {
                    assert_eq!(
                        req.header("Authorization").unwrap().as_str(),
                        diff_server_auth
                    );
                    assert_eq!(
                        req.header("Content-Type").unwrap().as_str(),
                        "application/json"
                    );
                    assert_eq!(req.header("X-Replicache-SyncID").unwrap().as_str(), sync_id);
                    assert_eq!(req.body_string().await?, *EXP_BODY);
                    Ok(Response::builder(status).body(Body::from_string(body.to_string())))
                });

            let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
            let addr = listener.local_addr().unwrap();
            let handle = async_std::task::spawn_local(app.listen(listener));

            let client = fetch::client::Client::new();
            let puller = FetchPuller::new(&client);
            let result = puller
                .pull(
                    &PULL_REQ,
                    &format!("http://{}{}", addr, path),
                    diff_server_auth,
                    sync_id,
                )
                .await;

            match &c.exp_err {
                None => {
                    let got_pull_resp = result.expect(c.name);
                    assert_eq!(c.exp_resp.as_ref().unwrap(), &got_pull_resp);
                }
                Some(err_str) => {
                    let got_err_str = to_debug(result.expect_err(c.name));
                    assert!(
                        got_err_str.contains(err_str),
                        format!(
                            "{}: '{}' does not contain '{}'",
                            c.name, got_err_str, err_str
                        )
                    );
                }
            }
            handle.cancel().await;
        }
    }
}
