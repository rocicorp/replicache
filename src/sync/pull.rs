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

// Pull Versions
// 0 (current): direct pull from data layer
const PULL_VERSION: u32 = 0;

pub async fn begin_pull(
    client_id: String,
    begin_pull_req: BeginTryPullRequest,
    puller: &dyn Puller,
    request_id: String,
    store: &dag::Store,
    lc: LogContext,
) -> Result<BeginTryPullResponse, BeginTryPullError> {
    use BeginTryPullError::*;

    let BeginTryPullRequest {
        pull_url,
        pull_auth,
        schema_version,
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

    let (base_last_mutation_id, base_cookie) =
        Commit::snapshot_meta_parts(&base_snapshot).map_err(InternalProgrammerError)?;

    let pull_req = PullRequest {
        client_id,
        cookie: base_cookie.clone(),
        last_mutation_id: base_snapshot.mutation_id(),
        pull_version: PULL_VERSION,
        schema_version,
    };
    debug!(lc, "Starting pull...");
    let pull_timer = rlog::Timer::new().map_err(InternalTimerError)?;
    let (pull_resp, http_request_info) = puller
        .pull(&pull_req, &pull_url, &pull_auth, &request_id)
        .await
        .map_err(PullFailed)?;

    debug!(
        lc.clone(),
        "...Pull {} in {}ms",
        if pull_resp.is_some() {
            "complete"
        } else {
            "failed"
        },
        pull_timer.elapsed_ms()
    );

    // If Puller did not get a pull response we still want to return the  HTTP
    // request info to the JS SDK.
    if pull_resp.is_none() {
        return Ok(BeginTryPullResponse {
            http_request_info,
            sync_head: str!(""),
            request_id,
        });
    }

    let pull_resp = pull_resp.unwrap();

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

    // If other entities (eg, other clients) are modifying the client view
    // the client view can change but the last_mutation_id stays the same.
    // So be careful here to reject only a lesser last_mutation_id.
    if pull_resp.last_mutation_id < base_last_mutation_id {
        return Err(TimeTravelProhibited(format!(
            "base lastMutationID {} is > than client view lastMutationID {}; ignoring client view",
            base_last_mutation_id, pull_resp.last_mutation_id
        )));
    }

    // If there is no patch and the lmid and cookie don't change, it's a nop.
    // Otherwise, we will write a new commit, including for the case of just
    // a cookie change.
    if pull_resp.patch.is_empty()
        && pull_resp.last_mutation_id == base_last_mutation_id
        && pull_resp.cookie == base_cookie
    {
        let sync_head = str!("");
        return Ok(BeginTryPullResponse {
            http_request_info,
            sync_head,
            request_id,
        });
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
        pull_resp.cookie.clone(),
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
        http_request_info: HttpRequestInfo {
            http_status_code: http::StatusCode::OK.into(),
            error_message: str!(""),
        },
        sync_head: commit_hash,
        request_id,
    })
}

pub async fn maybe_end_try_pull(
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
#[cfg_attr(test, derive(Clone))]
pub struct PullRequest {
    #[serde(rename = "clientID")]
    pub client_id: String,
    #[serde(default)]
    pub cookie: serde_json::Value,
    #[serde(rename = "lastMutationID")]
    pub last_mutation_id: u64,
    #[serde(rename = "pullVersion")]
    pub pull_version: u32,
    // schema_version can optionally be used by the customer's app
    // to indicate to the data layer what format of Client View the
    // app understands.
    #[serde(rename = "schemaVersion")]
    pub schema_version: String,
}

#[derive(Deserialize)]
#[cfg_attr(test, derive(Clone, Debug, PartialEq))]
pub struct PullResponse {
    #[serde(default)]
    pub cookie: serde_json::Value,
    #[serde(rename = "lastMutationID")]
    pub last_mutation_id: u64,
    pub patch: Vec<patch::Operation>,
}

// We define this trait so we can provide a fake implementation for testing.
#[async_trait(?Send)]
pub trait Puller {
    async fn pull(
        &self,
        pull_req: &PullRequest,
        ur: &str,
        auth: &str,
        request_id: &str,
    ) -> Result<(Option<PullResponse>, HttpRequestInfo), PullError>;
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
    // A failed HTTP response (non 200) is not an error. In that case we get
    // `None` for the `PullResponse`. We get errors for a few non HTTP related
    // reasons such as if we fail to create a Request object, the call to fetch
    // fails or the response is not the expected JSON format.
    async fn pull(
        &self,
        pull_req: &PullRequest,
        url: &str,
        auth: &str,
        request_id: &str,
    ) -> Result<(Option<PullResponse>, HttpRequestInfo), PullError> {
        use PullError::*;
        let http_req = new_pull_http_request(pull_req, url, auth, request_id)?;
        let http_resp: http::Response<String> = self
            .fetch_client
            .request(http_req)
            .await
            .map_err(FetchFailed)?;
        let ok = http_resp.status() == http::StatusCode::OK;
        let http_request_info = HttpRequestInfo {
            http_status_code: http_resp.status().into(),
            error_message: if !ok {
                http_resp.body().into()
            } else {
                str!("")
            },
        };
        let pull_response = if ok {
            Some(serde_json::from_str(&http_resp.body()).map_err(InvalidResponse)?)
        } else {
            None
        };
        Ok((pull_response, http_request_info))
    }
}

// Pulled into a helper fn because we use it integration tests.
pub fn new_pull_http_request(
    pull_req: &PullRequest,
    url: &str,
    auth: &str,
    request_id: &str,
) -> Result<http::Request<String>, PullError> {
    use PullError::*;
    let body = serde_json::to_string(pull_req).map_err(SerializeRequestError)?;
    let builder = http::request::Builder::new();
    let http_req = builder
        .method("POST")
        .uri(url)
        .header("Content-type", "application/json")
        .header("Authorization", auth)
        .header("X-Replicache-RequestID", request_id)
        .body(body)
        .map_err(InvalidRequest)?;
    Ok(http_req)
}

#[derive(Debug)]
pub enum PullError {
    FetchFailed(FetchError),
    InvalidRequest(http::Error),
    InvalidResponse(serde_json::error::Error),
    SerializeRequestError(serde_json::error::Error),
}

#[cfg(test)]
mod tests {
    use super::super::*;
    use super::patch::Operation;
    use super::*;
    use crate::dag;
    use crate::db;
    use crate::db::test_helpers::*;
    use crate::db::{Commit, Whence, DEFAULT_HEAD_NAME};
    #[cfg(not(target_arch = "wasm32"))]
    use crate::fetch;
    use crate::kv::memstore::MemStore;
    use crate::util::rlog::LogContext;
    use crate::util::to_debug;
    #[cfg(not(target_arch = "wasm32"))]
    use async_std::net::TcpListener;
    use async_trait::async_trait;
    use itertools::Itertools;
    use serde_json::json;
    use std::clone::Clone;
    use std::collections::HashMap;
    use str_macro::str;
    #[cfg(not(target_arch = "wasm32"))]
    use tide::{Body, Response};

    #[cfg(not(target_arch = "wasm32"))]
    #[async_std::test]
    async fn test_fetch_puller() {
        lazy_static! {
            static ref PULL_REQ: PullRequest = PullRequest {
                client_id: str!("client_id"),
                cookie: json!("cookie"),
                last_mutation_id: 123,
                pull_version: PULL_VERSION,
                schema_version: str!("")
            };
            // EXP_BODY must be 'static to be used in HTTP handler closure.
            static ref EXP_BODY: String = serde_json::to_string(&*PULL_REQ).unwrap();
        }
        let pull_auth = "pull-auth";
        let request_id = "request_id";
        let path = "/pull";

        let good_http_request_info = HttpRequestInfo {
            http_status_code: http::StatusCode::OK.into(),
            error_message: str!(""),
        };

        struct Case<'a> {
            pub name: &'a str,
            pub resp_status: u16,
            pub resp_body: &'a str,
            pub exp_err: Option<&'a str>,
            pub exp_resp: Option<PullResponse>,
            pub exp_http_request_info: HttpRequestInfo,
        }
        let cases = [
            Case {
                name: "200",
                resp_status: 200,
                resp_body: r#"{
                    "cookie": "1",
                    "lastMutationID": 2,
                    "patch": [{"op":"clear"}]
                }"#,
                exp_err: None,
                exp_resp: Some(PullResponse {
                    cookie: json!("1"),
                    last_mutation_id: 2,
                    patch: vec![Operation::Clear],
                }),
                exp_http_request_info: good_http_request_info.clone(),
            },
            Case {
                name: "403",
                resp_status: 403,
                resp_body: "forbidden",
                exp_err: None,
                exp_resp: None,
                exp_http_request_info: HttpRequestInfo {
                    http_status_code: http::StatusCode::FORBIDDEN.into(),
                    error_message: str!("forbidden"),
                },
            },
            Case {
                name: "invalid response",
                resp_status: 200,
                resp_body: r#"not json"#,
                exp_err: Some("\"expected ident\", line: 1, column: 2"),
                exp_resp: None,
                // Not used in when exp_err is Some
                exp_http_request_info: good_http_request_info.clone(),
            },
        ];

        for c in cases.iter() {
            let mut app = tide::new();

            let status = c.resp_status;
            let body = c.resp_body;
            app.at(path)
                .post(move |mut req: tide::Request<()>| async move {
                    assert_eq!(req.header("Authorization").unwrap().as_str(), pull_auth);
                    assert_eq!(
                        req.header("Content-Type").unwrap().as_str(),
                        "application/json"
                    );
                    assert_eq!(
                        req.header("X-Replicache-RequestID").unwrap().as_str(),
                        request_id
                    );
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
                    pull_auth,
                    request_id,
                )
                .await;

            if let Ok(ref result) = result {
                assert_eq!(result.1, c.exp_http_request_info);
            }

            match &c.exp_err {
                None => {
                    let got_pull_resp = result.expect(c.name).0;
                    assert_eq!(c.exp_resp, got_pull_resp, "{}", c.name);
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

    macro_rules! map(
        { $($key:expr => $value:expr),+ } => {
            {
                let mut m = ::std::collections::HashMap::new();
                $(
                    m.insert($key, $value);
                )+
                m
            }
         };
    );

    // TODO: we don't have a way to test overlapping pulls. Augmenting
    // FakePuller to land a snapshot during pull() doesn't work because
    // it requires access to the dag::Store which is not Send. We should
    // probably have a unit test for the predicate.
    #[async_std::test]
    async fn test_begin_try_pull() {
        let store = dag::Store::new(Box::new(MemStore::new()));
        let mut chain: Chain = vec![];
        add_genesis(&mut chain, &store).await;
        add_snapshot(&mut chain, &store, Some(vec![str!("foo"), str!("\"bar\"")])).await;
        // chain[2] is an index change
        add_index_change(&mut chain, &store).await;
        let starting_num_commits = chain.len();
        let base_snapshot = &chain[1];
        let (base_last_mutation_id, base_cookie) =
            Commit::snapshot_meta_parts(base_snapshot).unwrap();
        let base_value_map = map!("foo" => "\"bar\"");

        let request_id = str!("request_id");
        let client_id = str!("test_client_id");
        let pull_auth = str!("pull_auth");
        let pull_url = str!("pull_url");
        let schema_version = str!("schema_version");

        let good_http_request_info = HttpRequestInfo {
            http_status_code: http::StatusCode::OK.into(),
            error_message: str!(""),
        };
        // The good_pull_resp has a patch, a new cookie, and a new
        // last_mutation_id. Tests can clone it and override those
        // fields they wish to change. This minimizes test changes required
        // when PullResponse changes.
        let new_cookie = json!("new_cookie");
        let good_pull_resp = PullResponse {
            cookie: new_cookie.clone(),
            last_mutation_id: 10,
            patch: vec![
                Operation::Clear,
                Operation::Put {
                    key: str!("new"),
                    value: json!("value"),
                },
            ],
        };
        let good_pull_resp_value_map = map!("/new" => "\"value\"");

        struct ExpCommit<'a> {
            cookie: serde_json::Value,
            last_mutation_id: u64,
            value_map: HashMap<&'a str, &'a str>,
            indexes: Vec<String>,
        }

        struct Case<'a> {
            pub name: &'a str,
            pub num_pending_mutations: u32,
            pub pull_result: Result<PullResponse, String>,
            // BeginTryPull expectations.
            pub exp_new_sync_head: Option<ExpCommit<'a>>,
            pub exp_begin_try_pull_result: Result<BeginTryPullResponse, BeginTryPullError>,
        }

        let exp_pull_req = PullRequest {
            client_id: client_id.clone(),
            cookie: base_cookie.clone(),
            last_mutation_id: base_last_mutation_id,
            pull_version: PULL_VERSION,
            schema_version: schema_version.clone(),
        };

        let cases: Vec<Case> = vec![
            Case {
                name: "0 pending, pulls new state -> beginpull succeeds w/synchead set",
                num_pending_mutations: 0,
                pull_result: Ok(good_pull_resp.clone()),
                exp_new_sync_head: Some(ExpCommit {
                    cookie: new_cookie.clone(),
                    last_mutation_id: good_pull_resp.last_mutation_id,
                    value_map: good_pull_resp_value_map.clone(),
                    indexes: vec![2.to_string()],
                }),
                exp_begin_try_pull_result: Ok(BeginTryPullResponse {
                    http_request_info: good_http_request_info.clone(),
                    sync_head: str!(""),
                    request_id: request_id.clone(),
                }),
            },
            Case {
                name: "1 pending, 0 mutations to replay, pulls new state -> beginpull succeeds w/synchead set",
                num_pending_mutations: 1,
                pull_result: Ok(PullResponse {
                    last_mutation_id: 2,
                    ..good_pull_resp.clone()
                }),
                exp_new_sync_head: Some(ExpCommit {
                    cookie: new_cookie.clone(),
                    last_mutation_id: 2,
                    value_map: good_pull_resp_value_map.clone(),
                    indexes: vec![2.to_string(), 4.to_string()],
                }),
                exp_begin_try_pull_result: Ok(BeginTryPullResponse {
                    http_request_info: good_http_request_info.clone(),
                    sync_head: str!(""),
                    request_id: request_id.clone(),
                }),
            },
            Case {
                name: "1 pending, 1 mutations to replay, pulls new state -> beginpull succeeds w/synchead set",
                num_pending_mutations: 1,
                pull_result: Ok(PullResponse {
                    last_mutation_id: 1,
                    ..good_pull_resp.clone()
                }),
                exp_new_sync_head: Some(ExpCommit {
                    cookie: new_cookie.clone(),
                    last_mutation_id: 1,
                    value_map: good_pull_resp_value_map.clone(),
                    indexes: vec![2.to_string()],
                }),
                exp_begin_try_pull_result: Ok(BeginTryPullResponse {
                    http_request_info: good_http_request_info.clone(),
                    sync_head: str!(""),
                    request_id: request_id.clone(),
                }),
            },
            Case {
                name: "2 pending, 0 to replay, pulls new state -> beginpull succeeds w/synchead set",
                num_pending_mutations: 2,
                pull_result: Ok(good_pull_resp.clone()),
                exp_new_sync_head: Some(ExpCommit {
                    cookie: new_cookie.clone(),
                    last_mutation_id: good_pull_resp.last_mutation_id,
                    value_map: good_pull_resp_value_map.clone(),
                    indexes: vec![2.to_string(), 4.to_string(), 6.to_string()],
                }),
                exp_begin_try_pull_result: Ok(BeginTryPullResponse {
                    http_request_info: good_http_request_info.clone(),
                    sync_head: str!(""),
                    request_id: request_id.clone(),
                }),
            },
            Case {
                name: "2 pending, 1 to replay, pulls new state -> beginpull succeeds w/synchead set",
                num_pending_mutations: 2,
                pull_result: Ok(PullResponse {
                    last_mutation_id: 2,
                    ..good_pull_resp.clone()
                }),
                exp_new_sync_head: Some(ExpCommit {
                    cookie: new_cookie.clone(),
                    last_mutation_id: 2,
                    value_map: good_pull_resp_value_map.clone(),
                    indexes: vec![2.to_string(), 4.to_string()],
                }),
                exp_begin_try_pull_result: Ok(BeginTryPullResponse {
                    http_request_info: good_http_request_info.clone(),
                    sync_head: str!(""),
                    request_id: request_id.clone(),
                }),
            },
            // The patch, last_mutation_id, and cookie determine whether we write a new
            // Commit. Here we run through the different combinations.
            Case {
                name: "no patch, same lmid, same cookie -> beginpull succeeds w/no synchead",
                num_pending_mutations: 0,
                pull_result: Ok(PullResponse {
                    last_mutation_id: base_last_mutation_id,
                    cookie: base_cookie.clone(),
                    patch: vec![],
                    ..good_pull_resp.clone()
                }),
                exp_new_sync_head: None,
                exp_begin_try_pull_result: Ok(BeginTryPullResponse {
                    http_request_info: good_http_request_info.clone(),
                    sync_head: str!(""),
                    request_id: request_id.clone(),
                }),
            },
            Case {
                name: "new patch, same lmid, same cookie -> beginpull succeeds w/synchead set",
                num_pending_mutations: 0,
                pull_result: Ok(PullResponse {
                    last_mutation_id: base_last_mutation_id,
                    cookie: base_cookie.clone(),
                    ..good_pull_resp.clone()
                }),
                exp_new_sync_head: Some(ExpCommit {
                    cookie: base_cookie.clone(),
                    last_mutation_id: base_last_mutation_id,
                    value_map: good_pull_resp_value_map.clone(),
                    indexes: vec![2.to_string()],
                }),
                exp_begin_try_pull_result: Ok(BeginTryPullResponse {
                    http_request_info: good_http_request_info.clone(),
                    sync_head: str!(""),
                    request_id: request_id.clone(),
                }),
            },
            Case {
                name: "no patch, new lmid, same cookie -> beginpull succeeds w/synchead set",
                num_pending_mutations: 0,
                pull_result: Ok(PullResponse {
                    last_mutation_id: base_last_mutation_id+1,
                    cookie: base_cookie.clone(),
                    patch: vec![],
                    ..good_pull_resp.clone()
                }),
                exp_new_sync_head: Some(ExpCommit {
                    cookie: base_cookie.clone(),
                    last_mutation_id: base_last_mutation_id+1,
                    value_map: base_value_map.clone(),
                    indexes: vec![2.to_string()],
                }),
                exp_begin_try_pull_result: Ok(BeginTryPullResponse {
                    http_request_info: good_http_request_info.clone(),
                    sync_head: str!(""),
                    request_id: request_id.clone(),
                }),
            },
            Case {
                name: "no patch, same lmid, new cookie -> beginpull succeeds w/synchead set",
                num_pending_mutations: 0,
                pull_result: Ok(PullResponse {
                    last_mutation_id: base_last_mutation_id,
                    cookie: json!("new_cookie"),
                    patch: vec![],
                    ..good_pull_resp.clone()
                }),
                exp_new_sync_head: Some(ExpCommit {
                    cookie: json!("new_cookie"),
                    last_mutation_id: base_last_mutation_id,
                    value_map: base_value_map.clone(),
                    indexes: vec![2.to_string()],
                }),
                exp_begin_try_pull_result: Ok(BeginTryPullResponse {
                    http_request_info: good_http_request_info.clone(),
                    sync_head: str!(""),
                    request_id: request_id.clone(),
                }),
            },
            Case {
                name: "new patch, new lmid, same cookie -> beginpull succeeds w/synchead set",
                num_pending_mutations: 0,
                pull_result: Ok(PullResponse {
                    cookie: base_cookie.clone(),
                    ..good_pull_resp.clone()
                }),
                exp_new_sync_head: Some(ExpCommit {
                    cookie: base_cookie.clone(),
                    last_mutation_id: good_pull_resp.last_mutation_id,
                    value_map: good_pull_resp_value_map.clone(),
                    indexes: vec![2.to_string()],
                }),
                exp_begin_try_pull_result: Ok(BeginTryPullResponse {
                    http_request_info: good_http_request_info.clone(),
                    sync_head: str!(""),
                    request_id: request_id.clone(),
                }),
            },
            Case {
                name: "new patch, same lmid, new cookie -> beginpull succeeds w/synchead set",
                num_pending_mutations: 0,
                pull_result: Ok(PullResponse {
                    last_mutation_id: base_last_mutation_id,
                    ..good_pull_resp.clone()
                }),
                exp_new_sync_head: Some(ExpCommit {
                    cookie: good_pull_resp.cookie.clone(),
                    last_mutation_id: base_last_mutation_id,
                    value_map: good_pull_resp_value_map.clone(),
                    indexes: vec![2.to_string()],
                }),
                exp_begin_try_pull_result: Ok(BeginTryPullResponse {
                    http_request_info: good_http_request_info.clone(),
                    sync_head: str!(""),
                    request_id: request_id.clone(),
                }),
            },
            Case {
                name: "no patch, new lmid, new cookie -> beginpull succeeds w/synchead set",
                num_pending_mutations: 0,
                pull_result: Ok(PullResponse {
                    patch: vec![],
                    ..good_pull_resp.clone()
                }),
                exp_new_sync_head: Some(ExpCommit {
                    cookie: good_pull_resp.cookie.clone(),
                    last_mutation_id: good_pull_resp.last_mutation_id,
                    value_map: base_value_map.clone(),
                    indexes: vec![2.to_string()],
                }),
                exp_begin_try_pull_result: Ok(BeginTryPullResponse {
                    http_request_info: good_http_request_info.clone(),
                    sync_head: str!(""),
                    request_id: request_id.clone(),
                }),
            },
            Case {
                name: "new patch, new lmid, new cookie -> beginpull succeeds w/synchead set",
                num_pending_mutations: 0,
                pull_result: Ok(PullResponse {
                    ..good_pull_resp.clone()
                }),
                exp_new_sync_head: Some(ExpCommit {
                    cookie: good_pull_resp.cookie.clone(),
                    last_mutation_id: good_pull_resp.last_mutation_id,
                    value_map: good_pull_resp_value_map.clone(),
                    indexes: vec![2.to_string()],
                }),
                exp_begin_try_pull_result: Ok(BeginTryPullResponse {
                    http_request_info: good_http_request_info.clone(),
                    sync_head: str!(""),
                    request_id: request_id.clone(),
                }),
            },
            Case {
                name: "pulls new state w/lesser mutation id -> beginpull errors",
                num_pending_mutations: 0,
                pull_result: Ok(PullResponse {
                    last_mutation_id: 0,
                    ..good_pull_resp.clone()
                }),
                exp_new_sync_head: None,
                exp_begin_try_pull_result: Err(BeginTryPullError::TimeTravelProhibited(str!(
                    "base lastMutationID 1 is > than client view lastMutationID 0; ignoring client view"
                ))),
            },
            Case {
                name: "pull 500s -> beginpull errors",
                num_pending_mutations: 0,
                pull_result: Err(str!("FetchNotOk(500)")),
                exp_new_sync_head: None,
                exp_begin_try_pull_result: Ok(BeginTryPullResponse {
                    http_request_info: HttpRequestInfo {
                        error_message: str!("Fetch not OK"),
                        http_status_code: 500,
            },
                    sync_head: str!(""),
                    request_id: request_id.clone(),
                }),
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
            // indexes created. We do this because after calling begin_try_pull we check that
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

            // See explanation in FakePuller for why we do this dance with the pull_result.
            let (pull_resp, pull_err) = match &c.pull_result {
                Ok(resp) => (Some(resp.clone()), None),
                Err(e) => (None, Some(e.clone())),
            };
            let fake_puller = FakePuller {
                exp_pull_req: &exp_pull_req.clone(),
                exp_pull_url: &pull_url.clone(),
                exp_pull_auth: &pull_auth.clone(),
                exp_request_id: &request_id,
                resp: pull_resp,
                err: pull_err,
            };

            let begin_try_pull_req = BeginTryPullRequest {
                pull_url: pull_url.clone(),
                pull_auth: pull_auth.clone(),
                schema_version: schema_version.clone(),
            };

            let result = begin_pull(
                client_id.clone(),
                begin_try_pull_req,
                &fake_puller,
                request_id.clone(),
                &store,
                LogContext::new(),
            )
            .await;

            let owned_read = store.read(LogContext::new()).await.unwrap();
            let read = owned_read.read();
            if let Some(exp_sync_head) = &c.exp_new_sync_head {
                let sync_head_hash = read.get_head(SYNC_HEAD_NAME).await.unwrap().unwrap();
                let sync_head =
                    Commit::from_chunk(read.get_chunk(&sync_head_hash).await.unwrap().unwrap())
                        .unwrap();
                let (got_last_mutation_id, got_cookie) =
                    Commit::snapshot_meta_parts(&sync_head).unwrap();
                assert_eq!(exp_sync_head.last_mutation_id, got_last_mutation_id);
                assert_eq!(exp_sync_head.cookie, got_cookie);
                // Check the value is what's expected.
                let (_, _, map) = db::read_commit(
                    db::Whence::Hash(sync_head.chunk().hash().to_string()),
                    &read,
                )
                .await
                .unwrap();
                let mut got_value_map = map
                    .iter()
                    .map(|entry| (entry.key.to_vec(), entry.val.to_vec()))
                    .collect::<Vec<(Vec<u8>, Vec<u8>)>>();
                got_value_map.sort_by(|a, b| a.0.cmp(&b.0));
                let exp_value_map = exp_sync_head
                    .value_map
                    .iter()
                    .sorted()
                    .map(|item| (item.0.as_bytes().to_vec(), item.1.as_bytes().to_vec()))
                    .collect::<Vec<(Vec<u8>, Vec<u8>)>>();
                assert_eq!(exp_value_map.len(), got_value_map.len());

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

                assert_eq!(&sync_head_hash, &result.as_ref().unwrap().sync_head);
            } else {
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
                if c.exp_begin_try_pull_result.is_ok() {
                    assert!(&result.as_ref().unwrap().sync_head.is_empty());
                }
            }

            assert_eq!(result.is_ok(), c.exp_begin_try_pull_result.is_ok());
            if let Ok(result) = result {
                assert_eq!(
                    result.http_request_info,
                    c.exp_begin_try_pull_result
                        .as_ref()
                        .unwrap()
                        .http_request_info
                );
                // syncHead is checked above based on the exp_sync_head
                assert_eq!(
                    result.request_id,
                    c.exp_begin_try_pull_result.as_ref().unwrap().request_id
                );
            } else {
                // use to_debug since some errors cannot be made PartialEq
                assert_eq!(
                    to_debug(result.unwrap_err()),
                    to_debug(c.exp_begin_try_pull_result.as_ref().unwrap_err())
                );
            }
        }
    }

    pub struct FakePuller<'a> {
        exp_pull_req: &'a PullRequest,
        exp_pull_url: &'a str,
        exp_pull_auth: &'a str,
        exp_request_id: &'a str,

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
            url: &str,
            auth: &str,
            request_id: &str,
        ) -> Result<(Option<PullResponse>, HttpRequestInfo), PullError> {
            assert_eq!(self.exp_pull_req, pull_req);
            assert_eq!(self.exp_pull_url, url);
            assert_eq!(self.exp_pull_auth, auth);
            assert_eq!(self.exp_request_id, request_id);

            let http_request_info = match &self.err {
                Some(s) => match s.as_str() {
                    "FetchNotOk(500)" => HttpRequestInfo {
                        http_status_code: http::StatusCode::INTERNAL_SERVER_ERROR.into(),
                        error_message: str!("Fetch not OK"),
                    },
                    _ => panic!("not implemented"),
                },
                None => HttpRequestInfo {
                    http_status_code: http::StatusCode::OK.into(),
                    error_message: str!(""),
                },
            };

            Ok((self.resp.clone(), http_request_info))
        }
    }

    #[async_std::test]
    async fn test_maybe_end_try_pull() {
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
                json!("sync_cookie"),
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
                request_id: str!("request_id"),
                sync_head: sync_head.clone(),
            };
            let result = maybe_end_try_pull(&store, LogContext::new(), req).await;

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
}
