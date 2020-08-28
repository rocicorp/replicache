#![allow(clippy::redundant_pattern_matching)] // For derive(DeJson).

use crate::checksum;
use crate::checksum::Checksum;
use crate::dag;
use crate::db;
use crate::db::{Commit, Whence, DEFAULT_HEAD_NAME};
use crate::embed::types::*;
use crate::fetch;
use crate::fetch::errors::FetchError;
use async_trait::async_trait;
use nanoserde::{DeJson, DeJsonErr, SerJson};
use std::default::Default;
use std::fmt::Debug;
use std::str::FromStr;

const SYNC_HEAD_NAME: &str = "sync";

pub async fn begin_sync(
    store: &dag::Store,
    puller: &dyn Puller,
    begin_sync_req: &BeginSyncRequest,
) -> Result<BeginSyncResponse, BeginSyncError> {
    use BeginSyncError::*;

    let read = store.read().await.map_err(ReadError)?;
    let base_snapshot = Commit::base_snapshot(
        &read
            .read()
            .get_head(DEFAULT_HEAD_NAME)
            .await
            .map_err(GetHeadError)?
            .unwrap(),
        &read.read(),
    )
    .await
    .map_err(NoBaseSnapshot)?;
    drop(read); // Important! Don't hold the lock through an HTTP request!
    let base_checksum = base_snapshot.meta().checksum().to_string();
    let (base_last_mutation_id, base_state_id) =
        Commit::snapshot_meta_parts(&base_snapshot).map_err(ProgrammerError)?;

    let pull_req = PullRequest {
        client_view_auth: begin_sync_req.data_layer_auth.clone(),
        client_id: "TODO".to_string(),
        base_state_id: base_state_id.clone(),
        checksum: base_checksum.clone(),
    };
    let sync_id = "TODO";
    let pull_resp = puller
        .pull(
            &pull_req,
            &begin_sync_req.diff_server_url,
            &begin_sync_req.diff_server_auth,
            sync_id,
        )
        .await
        .map_err(PullFailed)?;

    let _ = Checksum::from_str(&pull_resp.checksum).map_err(InvalidChecksum)?;
    if pull_resp.state_id.is_empty() {
        return Err(InvalidStateID);
    } else if pull_resp.state_id == base_state_id {
        return Ok(Default::default());
    }
    // Note: if last mutation ids are equal we don't reject it: the server could
    // have new state that didn't originate from the client.
    if pull_resp.last_mutation_id < base_last_mutation_id {
        return Err(TimeTravelProhibited(format!("base state lastMutationID {} is > than client view lastMutationID {}; ignoring client view", base_last_mutation_id, pull_resp.last_mutation_id)));
    }
    // TODO: apply patch and verify checksum. Here's the go code:
    // patchedMap, err := kv.ApplyPatch(noms, baseMap, pullResp.Patch)
    // if err != nil {
    // 	return Commit{}, pullResp.ClientViewInfo, errors.Wrap(err, "couldn't apply patch")
    // }
    // expectedChecksum, err := kv.ChecksumFromString(pullResp.Checksum)
    // if err != nil {
    // 	return Commit{}, pullResp.ClientViewInfo, errors.Wrapf(err, "response checksum malformed: %s", pullResp.Checksum)
    // }
    // if patchedMap.Checksum() != expectedChecksum.String() {
    // 	return Commit{}, pullResp.ClientViewInfo, fmt.Errorf("checksum mismatch! Expected %s, got %s", expectedChecksum, patchedMap.Checksum())
    // }

    // It is possible that another sync completed while we were pulling. Ensure
    // that is not the case by re-checking the base snapshot.
    let dag_write = store.write().await.map_err(LockError)?;
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
        return Err(OverlappingSyncs);
    }

    let db_write = db::Write::new_snapshot(
        Whence::Hash(base_snapshot.chunk().hash().to_string()),
        pull_resp.last_mutation_id,
        pull_resp.state_id.clone(),
        dag_write,
    )
    .await
    .map_err(ReadCommitError)?;
    let commit_hash = db_write
        .commit(SYNC_HEAD_NAME, "TODO_local_create_date")
        .await
        .map_err(CommitError)?;

    let resp = BeginSyncResponse {
        sync_head: commit_hash,
    };

    Ok(resp)
}

#[derive(Debug)]
pub enum BeginSyncError {
    CommitError(db::CommitError),
    GetHeadError(dag::Error),
    InvalidChecksum(checksum::ParseError),
    InvalidStateID,
    LockError(dag::Error),
    MainHeadDisappeared,
    NoBaseSnapshot(db::BaseSnapshotError),
    OverlappingSyncs,
    ProgrammerError(db::ProgrammerError),
    PullFailed(PullError),
    ReadCommitError(db::ReadCommitError),
    ReadError(dag::Error),
    TimeTravelProhibited(String),
}

#[derive(Debug, Default, PartialEq, SerJson)]
pub struct PullRequest {
    #[nserde(rename = "clientViewAuth")]
    pub client_view_auth: String,
    #[nserde(rename = "clientID")]
    pub client_id: String,
    #[nserde(rename = "baseStateID")]
    pub base_state_id: String,
    #[nserde(rename = "checksum")]
    pub checksum: String,
}

#[derive(Clone, Debug, Default, DeJson, PartialEq)]
pub struct PullResponse {
    #[nserde(rename = "stateID")]
    #[allow(dead_code)]
    state_id: String,
    #[nserde(rename = "lastMutationID")]
    #[allow(dead_code)]
    last_mutation_id: u64,
    // 	TODO Patch          []kv.Operation `json:"patch"`
    #[nserde(rename = "checksum")]
    #[allow(dead_code)]
    checksum: String,
    // TODO ClientViewInfo ClientViewInfo `json:"clientViewInfo"`
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
            DeJson::deserialize_json(http_resp.body()).map_err(InvalidResponse)?;
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
    let body = SerJson::serialize_json(pull_req);
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
    InvalidResponse(DeJsonErr),
}

#[cfg(not(target_arch = "wasm32"))]
#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::test_helpers::*;
    use crate::kv::memstore::MemStore;
    use async_std::net::TcpListener;
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
        add_snapshot(&mut chain, &store).await;
        let base_snapshot = &chain[chain.len() - 1];
        let (base_last_mutation_id, base_server_state_id) =
            Commit::snapshot_meta_parts(base_snapshot).unwrap();
        let base_checksum = base_snapshot.meta().checksum().to_string();

        let client_view_auth = str!("client_view_auth");
        let client_id = str!("TODO");
        let diff_server_url = str!("diff_server_url");
        let diff_server_auth = str!("diff_server_auth");
        let sync_id = str!("TODO");

        struct ExpCommit {
            state_id: String,
            last_mutation_id: u64,
            checksum: String,
        }

        struct Case<'a> {
            pub name: &'a str,

            // Pull expectations.
            pub exp_pull_req: PullRequest,
            pub pull_result: Result<PullResponse, String>,

            // BeginSync expectations.
            pub exp_err: Option<&'a str>,
            pub exp_new_sync_head: Option<ExpCommit>,
        }
        let cases = [
            Case {
                name: "pulls new state -> beginsync succeeds w/synchead set",
                exp_pull_req: PullRequest {
                    client_view_auth: client_view_auth.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                },
                pull_result: Ok(PullResponse {
                    state_id: str!("new_state_id"),
                    last_mutation_id: 10,
                    checksum: str!("12345678"), // TODO update when patch works
                }),
                exp_err: None,
                exp_new_sync_head: Some(ExpCommit {
                    state_id: str!("new_state_id"),
                    last_mutation_id: 10,
                    checksum: base_checksum.clone(), // TODO update when patch works
                }),
            },
            Case {
                name: "pulls same state -> beginsync succeeds with no synchead",
                exp_pull_req: PullRequest {
                    client_view_auth: client_view_auth.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                },
                pull_result: Ok(PullResponse {
                    state_id: base_server_state_id.clone(),
                    last_mutation_id: base_last_mutation_id,
                    checksum: base_checksum.clone(),
                }),
                exp_err: None,
                exp_new_sync_head: None,
            },
            Case {
                name: "pulls new state w/lesser mutation id -> beginsync errors",
                exp_pull_req: PullRequest {
                    client_view_auth: client_view_auth.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                },
                pull_result: Ok(PullResponse {
                    state_id: str!("new_state_id"),
                    last_mutation_id: 0,
                    checksum: str!("12345678"),
                }),
                exp_err: Some("TimeTravel"),
                exp_new_sync_head: None,
            },
            Case {
                name: "pulls new state w/empty state id -> beginsync errors",
                exp_pull_req: PullRequest {
                    client_view_auth: client_view_auth.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                },
                pull_result: Ok(PullResponse {
                    state_id: str!(""),
                    last_mutation_id: 0,
                    checksum: str!("12345678"),
                }),
                exp_err: Some("InvalidStateID"),
                exp_new_sync_head: None,
            },
            Case {
                name: "pulls new state w/invalid checksum -> beginsync errors",
                exp_pull_req: PullRequest {
                    client_view_auth: client_view_auth.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                },
                pull_result: Ok(PullResponse {
                    state_id: str!("new_state_id"),
                    last_mutation_id: 0,
                    checksum: str!(""),
                }),
                exp_err: Some("InvalidChecksum"),
                exp_new_sync_head: None,
            },
            Case {
                name: "pull 500s -> beginsync errors",
                exp_pull_req: PullRequest {
                    client_view_auth: client_view_auth.clone(),
                    client_id: client_id.clone(),
                    base_state_id: base_server_state_id.clone(),
                    checksum: base_checksum.clone(),
                },
                pull_result: Err(str!("FetchNotOk")),
                exp_err: Some("FetchNotOk(500)"),
                exp_new_sync_head: None,
            },
        ];
        for c in cases.iter() {
            // Reset state of the store.
            let mut w = store.write().await.unwrap();
            w.set_head(DEFAULT_HEAD_NAME, Some(base_snapshot.chunk().hash()))
                .await
                .unwrap();
            w.set_head(SYNC_HEAD_NAME, None).await.unwrap();
            w.commit().await.unwrap();

            // See explanation in FakePuller for why we do this dance with the pull_result.
            let (resp, err) = match &c.pull_result {
                Ok(resp) => (Some(resp.clone()), None),
                Err(e) => (None, Some(e.clone())),
            };
            let fake_puller = FakePuller {
                exp_pull_req: &c.exp_pull_req,
                exp_diff_server_url: &diff_server_url,
                exp_diff_server_auth: &diff_server_auth,
                exp_sync_id: &sync_id,
                resp,
                err,
            };

            let begin_sync_req = BeginSyncRequest {
                data_layer_auth: client_view_auth.clone(),
                diff_server_url: diff_server_url.clone(),
                diff_server_auth: diff_server_auth.clone(),
            };
            let result = begin_sync(&store, &fake_puller, &begin_sync_req).await;
            let mut got_resp: Option<BeginSyncResponse> = None;
            match c.exp_err {
                None => {
                    assert!(result.is_ok(), format!("{}: {:?}", c.name, result));
                    got_resp = Some(result.unwrap());
                }
                Some(e) => assert!(format!("{:?}", result.unwrap_err()).contains(e)),
            };
            let owned_read = store.read().await.unwrap();
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
                        assert!(got_resp.unwrap().sync_head.is_empty());
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
                        sync_head.meta().checksum(),
                        "{}",
                        c.name
                    );

                    assert_eq!(sync_head_hash, got_resp.unwrap().sync_head);
                }
            };
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
        // DeJSONErr. (Or, I guess we could make pull take &mut self as another
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
                    "FetchNotOk" => Err(PullError::FetchNotOk(
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
    async fn test_pull() {
        lazy_static! {
            static ref PULL_REQ: PullRequest = PullRequest {
                client_view_auth: str!("client-view-auth"),
                client_id: str!("TODO"),
                base_state_id: str!("base-state-id"),
                checksum: str!("00000000"),
            };
            // EXP_BODY must be 'static to be used in HTTP handler closure.
            static ref EXP_BODY: String = SerJson::serialize_json(&*PULL_REQ);
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
                resp_body: r#"{"stateID": "1", "lastMutationID": 2, "checksum": "12345678"}"#,
                exp_err: None,
                exp_resp: Some(PullResponse {
                    state_id: str!("1"),
                    last_mutation_id: 2,
                    checksum: str!("12345678"),
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
                exp_err: Some("Json Deserialize error"),
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
                    let got_err_str = format!("{:?}", result.expect_err(c.name));
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
