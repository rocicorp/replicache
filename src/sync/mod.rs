#![allow(clippy::redundant_pattern_matching)] // For derive(Deserialize).

mod patch;
pub mod push;
#[cfg(test)]
pub mod test_helpers;
mod types;

use crate::checksum;
use crate::checksum::Checksum;
use crate::dag;
use crate::db;
use crate::db::{read_indexes, Commit, MetaTyped, Whence, DEFAULT_HEAD_NAME};
use crate::fetch;
use crate::fetch::errors::FetchError;
use crate::util::rlog;
use crate::util::rlog::LogContext;
use async_trait::async_trait;
use push::PushError;
use serde::{Deserialize, Serialize};
use std::default::Default;
use std::fmt::Debug;
use std::str::FromStr;
use str_macro::str;
pub use types::*;

pub const SYNC_HEAD_NAME: &str = "sync";

pub async fn begin_sync(
    store: &dag::Store,
    lc: LogContext,
    pusher: &dyn push::Pusher,
    puller: &dyn Puller,
    begin_sync_req: BeginSyncRequest,
    client_id: String,
) -> Result<BeginSyncResponse, BeginSyncError> {
    use BeginSyncError::*;

    // TODO generate a sync id and add it to logging context (lc.add_context()).
    let sync_id = str!("TODO_sync_id");
    let mut begin_sync_resp = BeginSyncResponse::default();
    begin_sync_resp.sync_info.sync_id = sync_id.clone();

    // Push: find pending commits between the base snapshot and the main head
    // and push them to the data layer.
    let dag_read = store.read(lc.clone()).await.map_err(ReadError)?;
    let main_head_hash = dag_read
        .read()
        .get_head(DEFAULT_HEAD_NAME)
        .await
        .map_err(GetHeadError)?
        .ok_or(InternalNoMainHeadError)?;
    let base_snapshot = Commit::base_snapshot(&main_head_hash, &dag_read.read())
        .await
        .map_err(NoBaseSnapshot)?;
    let mut pending = Commit::local_mutations(&main_head_hash, &dag_read.read())
        .await
        .map_err(InternalGetPendingCommitsError)?;
    // Commit::pending gave us commits in head-first order; the bindings
    // want tail first (in mutation id order).
    pending.reverse();
    drop(dag_read); // Important! Don't hold the lock through an HTTP request!
    if !pending.is_empty() {
        let mut push_mutations: Vec<push::Mutation> = Vec::new();
        for commit in pending.iter() {
            match commit.meta().typed() {
                MetaTyped::Local(lm) => push_mutations.push(lm.into()),
                _ => return Err(InternalNonLocalPendingCommit),
            }
        }
        // Contract is that BatchPushInfo is present if we attempted to push.
        begin_sync_resp.sync_info.batch_push_info = Some(BatchPushInfo {
            http_status_code: 0,
            error_message: str!(""),
        });
        let push_req = push::BatchPushRequest {
            client_id: client_id.clone(),
            mutations: push_mutations,
        };
        debug!(lc, "Starting push...");
        let push_timer = rlog::Timer::new().map_err(InternalTimerError)?;
        let push_resp = pusher
            .push(
                &push_req,
                &begin_sync_req.batch_push_url,
                &begin_sync_req.data_layer_auth,
                &sync_id,
            )
            .await;
        // Note: no map_err(). A failed push does not fail sync, but we
        // do report it in BatchPushInfo.
        begin_sync_resp.sync_info.batch_push_info = match push_resp {
            Ok(_) => Some(BatchPushInfo {
                http_status_code: 200,
                error_message: str!(""),
            }),
            Err(PushError::FetchNotOk(status_code)) => Some(BatchPushInfo {
                http_status_code: u16::from(status_code),
                error_message: format!("{:?}", PullError::FetchNotOk(status_code)),
            }),
            Err(e) => Some(BatchPushInfo {
                http_status_code: 0, // TOOD we could return this properly in the PushError.
                error_message: format!("{:?}", e),
            }),
        };
        debug!(lc, "...Push complete in {}ms", push_timer.elapsed_ms());
    }

    // Pull.
    let base_checksum = base_snapshot.meta().checksum().to_string();
    let (base_last_mutation_id, base_state_id) =
        Commit::snapshot_meta_parts(&base_snapshot).map_err(InternalProgrammerError)?;

    let pull_req = PullRequest {
        client_view_auth: begin_sync_req.data_layer_auth,
        client_id,
        base_state_id: base_state_id.clone(),
        checksum: base_checksum.clone(),
        version: 2,
    };
    debug!(lc, "Starting pull...");
    let pull_timer = rlog::Timer::new().map_err(InternalTimerError)?;
    let pull_resp = puller
        .pull(
            &pull_req,
            &begin_sync_req.diff_server_url,
            &begin_sync_req.diff_server_auth,
            &sync_id,
        )
        .await
        .map_err(PullFailed)?;
    debug!(lc, "...Pull complete in {}ms", pull_timer.elapsed_ms());

    begin_sync_resp.sync_info.client_view_info = Some(pull_resp.client_view_info.clone());

    let expected_checksum = Checksum::from_str(&pull_resp.checksum).map_err(InvalidChecksum)?;
    if pull_resp.state_id.is_empty() {
        return Err(MissingStateID);
    } else if pull_resp.state_id == base_state_id {
        return Ok(begin_sync_resp);
    }
    // Note: if last mutation ids are equal we don't reject it: the server could
    // have new state that didn't originate from the client.
    if pull_resp.last_mutation_id < base_last_mutation_id {
        return Err(TimeTravelProhibited(format!("base state lastMutationID {} is > than client view lastMutationID {}; ignoring client view", base_last_mutation_id, pull_resp.last_mutation_id)));
    }

    // It is possible that another sync completed while we were pulling. Ensure
    // that is not the case by re-checking the base snapshot.
    let dag_write = store.write(lc.clone()).await.map_err(LockError)?;
    let dag_read = dag_write.read();
    let main_head_post_pull = dag_read
        .get_head(DEFAULT_HEAD_NAME)
        .await
        .map_err(GetHeadError)?;
    if main_head_post_pull.is_none() {
        return Err(MainHeadDisappeared);
    }
    let base_snapshot_post_pull = Commit::base_snapshot(&main_head_post_pull.unwrap(), &dag_read)
        .await
        .map_err(NoBaseSnapshot)?;
    if base_snapshot.chunk().hash() != base_snapshot_post_pull.chunk().hash() {
        return Err(OverlappingSyncsJSLogInfo);
    }

    let main_head_commit_pre_push = Commit::from_hash(&main_head_hash, &dag_read)
        .await
        .map_err(CoundNotReloadHeadHash)?;
    let mut db_write = db::Write::new_snapshot(
        Whence::Hash(base_snapshot.chunk().hash().to_string()),
        pull_resp.last_mutation_id,
        pull_resp.state_id.clone(),
        dag_write,
        read_indexes(&main_head_commit_pre_push),
    )
    .await
    .map_err(ReadCommitError)?;

    patch::apply(&mut db_write, &pull_resp.patch)
        .await
        .map_err(PatchFailed)?;
    if db_write.checksum() != expected_checksum.to_string().as_str() {
        return Err(WrongChecksum(format!(
            "expected {}, got {}",
            expected_checksum,
            db_write.checksum()
        )));
    }

    let commit_hash = db_write
        .commit(SYNC_HEAD_NAME, "TODO_local_create_date")
        .await
        .map_err(CommitError)?;
    begin_sync_resp.sync_head = commit_hash;

    Ok(begin_sync_resp)
}

#[derive(Debug)]
pub enum BeginSyncError {
    CommitError(db::CommitError),
    CoundNotReloadHeadHash(db::FromHashError),
    GetHeadError(dag::Error),
    InternalGetPendingCommitsError(db::PendingError),
    InternalNoMainHeadError,
    InternalNonLocalPendingCommit,
    InternalProgrammerError(db::InternalProgrammerError),
    InternalTimerError(rlog::TimerError),
    InvalidChecksum(checksum::ParseError),
    LockError(dag::Error),
    MainHeadDisappeared,
    MissingStateID,
    NoBaseSnapshot(db::BaseSnapshotError),
    OverlappingSyncsJSLogInfo, // "JSLogInfo" is a signal to bindings to not log this alarmingly.
    PatchFailed(patch::PatchError),
    PullFailed(PullError),
    ReadCommitError(db::ReadCommitError),
    ReadError(dag::Error),
    TimeTravelProhibited(String),
    WrongChecksum(String),
}

pub async fn maybe_end_sync(
    store: &dag::Store,
    lc: LogContext,
    maybe_end_sync_req: MaybeEndSyncRequest,
) -> Result<MaybeEndSyncResponse, MaybeEndSyncError> {
    use MaybeEndSyncError::*;

    // TODO put sync_id in the logging context (lc.add_context()).

    // Ensure sync head is what the caller thinks it is.
    let dag_write = store
        .write(lc.clone())
        .await
        .map_err(OpenWriteTxWriteError)?;
    let dag_read = dag_write.read();
    let sync_head_hash = dag_read
        .get_head(SYNC_HEAD_NAME)
        .await
        .map_err(GetSyncHeadError)?
        .ok_or(MissingSyncHead)?;
    if sync_head_hash != maybe_end_sync_req.sync_head {
        return Err(WrongSyncHeadJSLogInfo);
    }

    // Ensure another sync has not landed a new snapshot on the main chain.
    let sync_snapshot = Commit::base_snapshot(&sync_head_hash, &dag_read)
        .await
        .map_err(NoBaseSnapshot)?;
    let main_head_hash = dag_read
        .get_head(db::DEFAULT_HEAD_NAME)
        .await
        .map_err(GetMainHeadError)?
        .ok_or(MissingMainHead)?;
    let main_snapshot = Commit::base_snapshot(&main_head_hash, &dag_read)
        .await
        .map_err(NoBaseSnapshot)?;
    let meta = sync_snapshot.meta();
    let sync_snapshot_basis = meta.basis_hash().ok_or(SyncSnapshotWithNoBasis)?;
    if sync_snapshot_basis != main_snapshot.chunk().hash() {
        return Err(OverlappingSyncsJSLogInfo);
    }

    // Collect pending commits from the main chain and determine which
    // of them if any need to be replayed.
    let mut pending = Commit::local_mutations(&main_head_hash, &dag_read)
        .await
        .map_err(PendingError)?;
    let sync_head = Commit::from_hash(&sync_head_hash, &dag_read)
        .await
        .map_err(LoadSyncHeadError)?;
    pending.retain(|c| c.mutation_id() > sync_head.mutation_id());
    // pending() gave us the pending mutations in sync-head-first order whereas
    // caller wants them in the order to replay (lower mutation ids first).
    pending.reverse();

    // Return replay commits if any.
    if !pending.is_empty() {
        let mut replay_mutations: Vec<ReplayMutation> = Vec::new();
        for c in pending {
            let (name, args) = match c.meta().typed() {
                MetaTyped::Local(lm) => (
                    lm.mutator_name().to_string(),
                    String::from_utf8(lm.mutator_args_json().to_vec())
                        .map_err(InternalArgsUtf8Error)?,
                ),
                _ => {
                    return Err(InternalProgrammerError(
                        "pending mutation is not local".to_string(),
                    ))
                }
            };
            replay_mutations.push(ReplayMutation {
                id: c.mutation_id(),
                name,
                args,
                original: c.chunk().hash().to_string(),
            })
        }
        return Ok(MaybeEndSyncResponse {
            sync_head: sync_head_hash,
            replay_mutations,
        });
    }

    // TODO check invariants

    // No mutations to replay so set the main head to the sync head and sync complete!
    dag_write
        .set_head(db::DEFAULT_HEAD_NAME, Some(&sync_head_hash))
        .await
        .map_err(WriteDefaultHeadError)?;
    dag_write
        .set_head(SYNC_HEAD_NAME, None)
        .await
        .map_err(WriteSyncHeadError)?;
    dag_write.commit().await.map_err(CommitError)?;
    Ok(MaybeEndSyncResponse {
        sync_head: sync_head_hash.to_string(),
        replay_mutations: Vec::new(),
    })
}

#[derive(Debug)]
pub enum MaybeEndSyncError {
    CommitError(dag::Error),
    GetMainHeadError(dag::Error),
    GetSyncHeadError(dag::Error),
    InternalArgsUtf8Error(std::string::FromUtf8Error),
    InternalProgrammerError(String),
    InvalidArgs(std::str::Utf8Error),
    LoadSyncHeadError(db::FromHashError),
    MissingMainHead,
    MissingSyncHead,
    NoBaseSnapshot(db::BaseSnapshotError),
    OpenWriteTxWriteError(dag::Error),
    OverlappingSyncsJSLogInfo, // "JSLogInfo" is a signal to bindings to not log this alarmingly.
    PendingError(db::PendingError),
    ReadError(dag::Error),
    SyncSnapshotWithNoBasis,
    WriteDefaultHeadError(dag::Error),
    WriteSyncHeadError(dag::Error),
    WrongSyncHeadJSLogInfo, // "JSLogInfo" is a signal to bindings to not log this alarmingly.
}

#[derive(Debug, Default, PartialEq, Serialize)]
pub struct PullRequest {
    #[serde(rename = "clientViewAuth")]
    pub client_view_auth: String,
    #[serde(rename = "clientID")]
    pub client_id: String,
    #[serde(rename = "baseStateID")]
    pub base_state_id: String,
    #[serde(rename = "checksum")]
    pub checksum: String,
    pub version: u32,
}

#[derive(Clone, Debug, Default, Deserialize, PartialEq)]
pub struct PullResponse {
    #[serde(rename = "stateID")]
    #[allow(dead_code)]
    state_id: String,
    #[serde(rename = "lastMutationID")]
    #[allow(dead_code)]
    last_mutation_id: u64,
    patch: Vec<patch::Operation>,
    #[serde(rename = "checksum")]
    #[allow(dead_code)]
    checksum: String,
    #[serde(rename = "clientViewInfo")]
    client_view_info: ClientViewInfo,
}

// We define this trait so we can provide a fake implementation for testing.
#[async_trait(?Send)]
pub trait Puller {
    async fn pull(
        &self,
        pull_req: &PullRequest,
        diff_server_url: &str,
        diff_server_auth: &str,
        sync_id: &str,
    ) -> Result<PullResponse, PullError>;
}

pub struct FetchPuller<'a> {
    fetch_client: &'a fetch::client::Client,
}

impl FetchPuller<'_> {
    pub fn new(fetch_client: &fetch::client::Client) -> FetchPuller {
        FetchPuller { fetch_client }
    }
}

#[async_trait(?Send)]
impl Puller for FetchPuller<'_> {
    async fn pull(
        &self,
        pull_req: &PullRequest,
        diff_server_url: &str,
        diff_server_auth: &str,
        sync_id: &str,
    ) -> Result<PullResponse, PullError> {
        use PullError::*;
        let http_req = new_pull_http_request(pull_req, diff_server_url, diff_server_auth, sync_id)?;
        let http_resp: http::Response<String> = self
            .fetch_client
            .request(http_req)
            .await
            .map_err(FetchFailed)?;
        if http_resp.status() != http::StatusCode::OK {
            return Err(PullError::FetchNotOk(http_resp.status()));
        }
        let pull_resp: PullResponse =
            serde_json::from_str(&http_resp.body()).map_err(InvalidResponse)?;
        Ok(pull_resp)
    }
}

// Pulled into a helper fn because we use it integration tests.
pub fn new_pull_http_request(
    pull_req: &PullRequest,
    diff_server_url: &str,
    diff_server_auth: &str,
    sync_id: &str,
) -> Result<http::Request<String>, PullError> {
    use PullError::*;
    let body = serde_json::to_string(pull_req).map_err(SerializeRequestError)?;
    let builder = http::request::Builder::new();
    let http_req = builder
        .method("POST")
        .uri(diff_server_url)
        .header("Content-type", "application/json")
        .header("Authorization", diff_server_auth)
        .header("X-Replicache-SyncID", sync_id)
        .body(body)
        .map_err(InvalidRequest)?;
    Ok(http_req)
}

#[derive(Debug)]
pub enum PullError {
    FetchFailed(FetchError),
    FetchNotOk(http::StatusCode),
    InvalidRequest(http::Error),
    InvalidResponse(serde_json::error::Error),
    SerializeRequestError(serde_json::error::Error),
}

#[cfg(not(target_arch = "wasm32"))]
#[cfg(test)]
mod tests {
    use super::patch::Operation;
    use super::*;
    use crate::db::test_helpers::*;
    use crate::kv::memstore::MemStore;
    use crate::util::rlog::LogContext;
    use crate::util::to_debug;
    use async_std::net::TcpListener;
    use serde_json::json;
    use std::clone::Clone;
    use str_macro::str;
    use tide::{Body, Response};

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
        let base_snapshot = &chain[chain.len() - 1];
        let (base_last_mutation_id, base_server_state_id) =
            Commit::snapshot_meta_parts(base_snapshot).unwrap();
        let base_checksum = base_snapshot.meta().checksum().to_string();

        let sync_id = str!("TODO_sync_id");
        let client_id = str!("test_client_id");
        let data_layer_auth = str!("data_layer_auth");

        // Push
        let batch_push_url = str!("batch_push_url");

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

            // BeginSync expectations.
            pub exp_err: Option<&'a str>,
            pub exp_new_sync_head: Option<ExpCommit>,
        }
        let cases: Vec<Case> = vec![
            Case {
                name: "0 mutations to push, pulls new state -> beginsync succeeds w/synchead set",
                num_pending_mutations: 0,
                exp_push_req: None,
                push_result: None,
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    version: 2,
                },
                pull_result: Ok(good_pull_resp.clone()),
                exp_err: None,
                exp_new_sync_head: Some(ExpCommit {
                    state_id: str!("new_state_id"),
                    last_mutation_id: 10,
                    checksum: str!("f9ef007b"),
                }),
            },
            Case {
                name: "2 mutations to push, push succeeds, pulls new state -> beginsync succeeds w/synchead set",
                num_pending_mutations: 2,
                exp_push_req: Some(push::BatchPushRequest {
                    client_id: client_id.clone(),
                    mutations: vec![
                        // These mutations aren't actually added to the chain until the test
                        // case runs, but we happen to know how they are created by the db
                        // test helpers so we use that knowledge here.
                        push::Mutation {
                            id: 2,
                            name: "mutator_name_2".to_string(),
                            args: json!([2]),
                        },
                        push::Mutation {
                            id: 3,
                            name: "mutator_name_3".to_string(),
                            args: json!([3]),
                        },
                    ],
                }),
                push_result: Some(Ok(push::BatchPushResponse {})),
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    version: 2,
                },
                pull_result: Ok(good_pull_resp.clone()),
                exp_err: None,
                exp_new_sync_head: Some(ExpCommit {
                    state_id: str!("new_state_id"),
                    last_mutation_id: 10,
                    checksum: str!("f9ef007b"),
                }),
            },
            Case {
                name: "2 mutations to push, push errors, pulls new state -> beginsync succeeds w/synchead set",
                num_pending_mutations: 2,
                exp_push_req: Some(push::BatchPushRequest {
                    client_id: client_id.clone(),
                    mutations: vec![
                        // These mutations aren't actually added to the chain until the test
                        // case runs, but we happen to know how they are created by the db
                        // test helpers so we use that knowledge here.
                        push::Mutation {
                            id: 2,
                            name: "mutator_name_2".to_string(),
                            args: json!([2]),
                        },
                        push::Mutation {
                            id: 3,
                            name: "mutator_name_3".to_string(),
                            args: json!([3]),
                        },
                    ],
                }),
                push_result: Some(Err(str!("FetchNotOk(500)"))),
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    version: 2,
                },
                pull_result: Ok(good_pull_resp.clone()),
                exp_err: None,
                exp_new_sync_head: Some(ExpCommit {
                    state_id: str!("new_state_id"),
                    last_mutation_id: 10,
                    checksum: str!("f9ef007b"),
                }),
            },

            // TODO: add test for same state id but later mutation id. Right now we treat
            // it as a nop because the state id does not change, but probably we should treat
            // it like success and complete the sync. Current behavior mirrors the (probably
            // incorrect?) go behavior.
            Case {
                name: "nop push, pulls same state -> beginsync succeeds with no synchead",
                num_pending_mutations: 0,
                exp_push_req: None,
                push_result: None,
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    version: 2,
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
                name: "nop push, pulls new state w/lesser mutation id -> beginsync errors",
                num_pending_mutations: 0,
                exp_push_req: None,
                push_result: None,
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    version: 2,
                },
                pull_result: Ok(PullResponse {
                    last_mutation_id: 0,
                    ..good_pull_resp.clone()
                }),
                exp_err: Some("TimeTravel"),
                exp_new_sync_head: None,
            },
            Case {
                name: "nop push, pulls new state w/empty state id -> beginsync errors",
                num_pending_mutations: 0,
                exp_push_req: None,
                push_result: None,
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    version: 2,
                },
                pull_result: Ok(PullResponse {
                    state_id: str!(""),
                    ..good_pull_resp.clone()
                }),
                exp_err: Some("MissingStateID"),
                exp_new_sync_head: None,
            },
            Case {
                name: "nop push, pulls new state w/no checksum -> beginsync errors",
                num_pending_mutations: 0,
                exp_push_req: None,
                push_result: None,
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    version: 2,
                },
                pull_result: Ok(PullResponse {
                    checksum: str!(""),
                    ..good_pull_resp.clone()
                }),
                exp_err: Some("InvalidChecksum"),
                exp_new_sync_head: None,
            },
            Case {
                name: "nop push, pulls new state w/bad checksum -> beginsync errors",
                num_pending_mutations: 0,
                exp_push_req: None,
                push_result: None,
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    version: 2,
                },
                pull_result: Ok(PullResponse {
                    checksum: str!(12345678),
                    ..good_pull_resp.clone()
                }),
                exp_err: Some("WrongChecksum"),
                exp_new_sync_head: None,
            },
            Case {
                name: "nop push, pull 500s -> beginsync errors",
                num_pending_mutations: 0,
                exp_push_req: None,
                push_result: None,
                exp_pull_req: PullRequest {
                    client_view_auth: data_layer_auth.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                    version: 2,
                },
                pull_result: Err(str!("FetchNotOk(500)")),
                exp_err: Some("FetchNotOk(500)"),
                exp_new_sync_head: None,
            },
        ];
        for c in cases.iter() {
            // Reset state of the store.
            chain.truncate(2);
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
                    // In a nop sync we except BeginSync to succeed but sync_head will
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

                    assert_eq!(&sync_head_hash, &got_resp.as_ref().unwrap().sync_head);
                }
            };

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
    async fn test_maybe_end_sync() {
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
                read_indexes(&chain[0]),
            )
            .await
            .unwrap();
            let mut basis_hash = w.commit(SYNC_HEAD_NAME, "TODO local date").await.unwrap();

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
                basis_hash = w.commit(SYNC_HEAD_NAME, "local_create_date").await.unwrap();
            }
            let sync_head = basis_hash;

            let req = MaybeEndSyncRequest {
                sync_id: str!("TODO"),
                sync_head: sync_head.clone(),
            };
            let result = maybe_end_sync(&store, LogContext::new(), req).await;

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
                client_id: str!("client_id"),
                base_state_id: str!("base-state-id"),
                checksum: str!("00000000"),
                version: 2,
            };
            // EXP_BODY must be 'static to be used in HTTP handler closure.
            static ref EXP_BODY: String = serde_json::to_string(&*PULL_REQ).unwrap();
        }
        let diff_server_auth = "diff-server-auth";
        let sync_id = "TODO";
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
