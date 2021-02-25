#![allow(clippy::redundant_pattern_matching)] // For derive(Deserialize).

use super::patch;
use super::types::*;
use super::SYNC_HEAD_NAME;
use crate::dag;
use crate::db;
use crate::db::{Commit, MetaTyped, Whence, DEFAULT_HEAD_NAME};
use crate::fetch;
use crate::fetch::errors::FetchError;
use crate::util::rlog;
use crate::util::rlog::LogContext;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::collections::hash_map::HashMap;
use std::default::Default;
use std::fmt::Debug;
use str_macro::str;

pub async fn begin_pull(
    client_id: String,
    begin_pull_req: BeginTryPullRequest,
    puller: &dyn Puller,
    sync_id: String,
    store: &dag::Store,
    lc: LogContext,
) -> Result<BeginTryPullResponse, BeginTryPullError> {
    use BeginTryPullError::*;

    let BeginTryPullRequest {
        client_view_url,
        data_layer_auth,
        diff_server_url,
        diff_server_auth,
    } = begin_pull_req;

    let dag_read = store.read(lc.clone()).await.map_err(ReadError)?;
    let main_head_hash = dag_read
        .read()
        .get_head(db::DEFAULT_HEAD_NAME)
        .await
        .map_err(GetHeadError)?
        .ok_or(InternalNoMainHeadError)?;
    let base_snapshot = db::Commit::base_snapshot(&main_head_hash, &dag_read.read())
        .await
        .map_err(NoBaseSnapshot)?;
    // Close read transaction.
    drop(dag_read);

    let (base_last_mutation_id, base_state_id) =
        Commit::snapshot_meta_parts(&base_snapshot).map_err(InternalProgrammerError)?;

    let pull_req = PullRequest {
        client_view_auth: data_layer_auth,
        client_view_url,
        client_id,
        base_state_id: base_state_id.clone(),
        last_mutation_id: base_snapshot.mutation_id(),
        version: 3,
    };
    debug!(lc, "Starting pull...");
    let pull_timer = rlog::Timer::new().map_err(InternalTimerError)?;
    let pull_resp = puller
        .pull(&pull_req, &diff_server_url, &diff_server_auth, &sync_id)
        .await
        .map_err(PullFailed)?;
    debug!(
        lc.clone(),
        "...Pull complete in {}ms",
        pull_timer.elapsed_ms()
    );

    if pull_resp.state_id.is_empty() {
        return Err(MissingStateID);
    } else if pull_resp.state_id == base_state_id {
        let sync_head = str!("");
        return Ok(BeginTryPullResponse {
            client_view_info: pull_resp.client_view_info,
            sync_head,
            sync_id,
        });
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
    let base_snapshot_post_pull =
        Commit::base_snapshot(main_head_post_pull.as_ref().unwrap(), &dag_read)
            .await
            .map_err(NoBaseSnapshot)?;
    if base_snapshot.chunk().hash() != base_snapshot_post_pull.chunk().hash() {
        return Err(OverlappingSyncsJSLogInfo);
    }

    // We are going to need to rebuild the indexes. We want to take the definitions from
    // the last commit on the chain that will not be rebased. We do this here before creating
    // the new snapshot while we still have the dag_read borrowed.
    let chain = Commit::chain(main_head_post_pull.as_ref().unwrap(), &dag_read)
        .await
        .map_err(InternalGetChainError)?;
    let index_records: Vec<db::IndexRecord> = chain
        .iter()
        .find(|c| c.mutation_id() <= pull_resp.last_mutation_id)
        .ok_or(InternalInvalidChainError)?
        .indexes();
    drop(dag_read);

    let mut db_write = db::Write::new_snapshot(
        Whence::Hash(base_snapshot.chunk().hash().to_string()),
        pull_resp.last_mutation_id,
        pull_resp.state_id.clone(),
        dag_write,
        HashMap::new(), // Note: created with no indexes
    )
    .await
    .map_err(ReadCommitError)?;

    // Rebuild the indexes
    // TODO would be so nice to have a way to re-use old indexes, which are likely
    //      only a small diff from what we want.
    for m in index_records.iter() {
        let def = &m.definition;
        println!("Got {:?}\n", def);
        db_write
            .create_index(
                lc.clone(),
                def.name.clone(),
                &def.key_prefix,
                &def.json_pointer,
            )
            .await
            .map_err(InternalRebuildIndexError)?;
    }

    patch::apply(&mut db_write, &pull_resp.patch)
        .await
        .map_err(PatchFailed)?;

    let commit_hash = db_write.commit(SYNC_HEAD_NAME).await.map_err(CommitError)?;

    Ok(BeginTryPullResponse {
        client_view_info: pull_resp.client_view_info,
        sync_head: commit_hash,
        sync_id,
    })
}

pub async fn maybe_end_pull(
    store: &dag::Store,
    lc: LogContext,
    maybe_end_pull_req: MaybeEndTryPullRequest,
) -> Result<MaybeEndTryPullResponse, MaybeEndTryPullError> {
    use MaybeEndTryPullError::*;

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
    if sync_head_hash != maybe_end_pull_req.sync_head {
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
        let mut replay_mutations: Vec<ReplayMutation> = Vec::with_capacity(pending.len());
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
        return Ok(MaybeEndTryPullResponse {
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
    Ok(MaybeEndTryPullResponse {
        sync_head: sync_head_hash.to_string(),
        replay_mutations: Vec::new(),
    })
}

#[derive(Debug, Default, PartialEq, Serialize)]
pub struct PullRequest {
    #[serde(rename = "clientViewAuth")]
    pub client_view_auth: String,
    #[serde(rename = "clientViewURL")]
    pub client_view_url: String,
    #[serde(rename = "clientID")]
    pub client_id: String,
    #[serde(rename = "baseStateID")]
    pub base_state_id: String,
    #[serde(rename = "lastMutationID")]
    pub last_mutation_id: u64,

    pub version: u32,
}

#[derive(Clone, Debug, Default, Deserialize, PartialEq)]
pub struct PullResponse {
    #[serde(rename = "stateID")]
    #[allow(dead_code)]
    pub state_id: String,
    #[serde(rename = "lastMutationID")]
    #[allow(dead_code)]
    pub last_mutation_id: u64,
    pub patch: Vec<patch::Operation>,
    #[serde(rename = "clientViewInfo")]
    pub client_view_info: ClientViewInfo,
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
    use crate::fetch;
    use crate::util::to_debug;
    use async_std::net::TcpListener;
    use str_macro::str;
    use tide::{Body, Response};

    #[async_std::test]
    async fn test_pull_http_part() {
        lazy_static! {
            static ref PULL_REQ: PullRequest = PullRequest {
                client_view_auth: str!("client-view-auth"),
                client_view_url: str!("client-view-url"),
                client_id: str!("client_id"),
                base_state_id: str!("base-state-id"),
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
                resp_body: r#"{"stateID": "1", "lastMutationID": 2, "patch": [{"op":"replace","path":"","valueString":"{}"}], "clientViewInfo": { "httpStatusCode": 200, "errorMessage": "" }}"#,
                exp_err: None,
                exp_resp: Some(PullResponse {
                    state_id: str!("1"),
                    last_mutation_id: 2,
                    patch: vec![Operation {
                        op: str!("replace"),
                        path: str!(""),
                        value_string: str!("{}"),
                    }],
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
