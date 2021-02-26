use super::{HttpRequestInfo, TryPushError, TryPushRequest};
use crate::fetch::errors::FetchError;
use crate::{dag, db, util::rlog::LogContext};
use crate::{fetch, util::rlog};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use str_macro::str;

#[derive(Debug, Deserialize, PartialEq, Serialize)]
pub struct BatchPushRequest {
    #[serde(rename = "clientID")]
    pub client_id: String,
    pub mutations: Vec<Mutation>,
}

#[derive(Debug, Deserialize, PartialEq, Serialize)]
pub struct Mutation {
    pub id: u64,
    pub name: String,
    pub args: serde_json::Value,
}

impl std::convert::From<db::LocalMeta<'_>> for Mutation {
    fn from(lm: db::LocalMeta<'_>) -> Self {
        // TODO clean unwraps:
        // See https://github.com/rocicorp/repc/issues/139
        let args = serde_json::from_slice(lm.mutator_args_json()).unwrap();
        Mutation {
            id: lm.mutation_id(),
            name: lm.mutator_name().to_string(),
            args,
        }
    }
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct BatchPushResponse {
    // TODO: MutationInfos []MutationInfo `json:"mutationInfos,omitempty"`
}

// We define this trait so we can provide a fake implementation for testing.
#[async_trait(?Send)]
pub trait Pusher {
    async fn push(
        &self,
        push_req: &BatchPushRequest,
        push_url: &str,
        push_auth: &str,
        sync_id: &str,
    ) -> Result<BatchPushResponse, PushError>;
}

pub struct FetchPusher<'a> {
    fetch_client: &'a fetch::client::Client,
}

impl FetchPusher<'_> {
    pub fn new(fetch_client: &fetch::client::Client) -> FetchPusher {
        FetchPusher { fetch_client }
    }
}

// TODO The implementation and tests of FetchPusher are exactly the same as as FetchPuller
// modulo the request and response types (and error names). We should probably replace both
// with a generic JsonFetcher<Req, Resp> that provides something like
// fetch(url, headers, req: Req) -> Result<Resp, JsonFetchError>.
#[async_trait(?Send)]
impl Pusher for FetchPusher<'_> {
    async fn push(
        &self,
        push_req: &BatchPushRequest,
        push_url: &str,
        push_auth: &str,
        sync_id: &str,
    ) -> Result<BatchPushResponse, PushError> {
        use PushError::*;
        let http_req = new_push_http_request(push_req, push_url, push_auth, sync_id)?;
        let http_resp: http::Response<String> = self
            .fetch_client
            .request(http_req)
            .await
            .map_err(FetchFailed)?;
        if http_resp.status() != http::StatusCode::OK {
            return Err(PushError::FetchNotOk(http_resp.status()));
        }
        let push_resp: BatchPushResponse =
            serde_json::from_str(&http_resp.body()).map_err(InvalidResponse)?;
        Ok(push_resp)
    }
}

fn new_push_http_request(
    push_req: &BatchPushRequest,
    push_url: &str,
    push_auth: &str,
    sync_id: &str,
) -> Result<http::Request<String>, PushError> {
    use PushError::*;
    let body = serde_json::to_string(push_req).map_err(SerializePushError)?;
    let builder = http::request::Builder::new();
    let http_req = builder
        .method("POST")
        .uri(push_url)
        .header("Content-type", "application/json")
        .header("Authorization", push_auth)
        .header("X-Replicache-SyncID", sync_id)
        .body(body)
        .map_err(InvalidRequest)?;
    Ok(http_req)
}

#[derive(Debug)]
pub enum PushError {
    FetchFailed(FetchError),
    FetchNotOk(http::StatusCode),
    InvalidRequest(http::Error),
    InvalidResponse(serde_json::error::Error),
    SerializePushError(serde_json::error::Error),
}

pub async fn push(
    sync_id: &str,
    store: &dag::Store,
    lc: LogContext,
    client_id: String,
    pusher: &dyn Pusher,
    req: TryPushRequest,
) -> Result<Option<HttpRequestInfo>, TryPushError> {
    use TryPushError::*;

    // Find pending commits between the base snapshot and the main head and push
    // them to the data layer.
    let dag_read = store.read(lc.clone()).await.map_err(ReadError)?;
    let main_head_hash = dag_read
        .read()
        .get_head(db::DEFAULT_HEAD_NAME)
        .await
        .map_err(GetHeadError)?
        .ok_or(InternalNoMainHeadError)?;
    let mut pending = db::Commit::local_mutations(&main_head_hash, &dag_read.read())
        .await
        .map_err(InternalGetPendingCommitsError)?;
    drop(dag_read); // Important! Don't hold the lock through an HTTP request!

    // Commit::pending gave us commits in head-first order; the bindings
    // want tail first (in mutation id order).
    pending.reverse();

    let mut batch_push_info = None;
    if !pending.is_empty() {
        let mut push_mutations: Vec<Mutation> = Vec::new();
        for commit in pending.iter() {
            match commit.meta().typed() {
                db::MetaTyped::Local(lm) => push_mutations.push(lm.into()),
                _ => return Err(InternalNonLocalPendingCommit),
            }
        }
        let push_req = BatchPushRequest {
            client_id,
            mutations: push_mutations,
        };
        debug!(lc, "Starting push...");
        let push_timer = rlog::Timer::new().map_err(InternalTimerError)?;
        let push_resp = pusher
            .push(&push_req, &req.push_url, &req.push_auth, sync_id)
            .await;
        // Note: no map_err(). A failed push does not fail sync, but we
        // do report it in HttpRequestInfo.
        batch_push_info = match push_resp {
            Ok(_) => Some(HttpRequestInfo {
                http_status_code: 200,
                error_message: str!(""),
            }),
            Err(PushError::FetchNotOk(status_code)) => Some(HttpRequestInfo {
                http_status_code: status_code.into(),
                error_message: format!("{:?}", PushError::FetchNotOk(status_code)),
            }),
            Err(e) => Some(HttpRequestInfo {
                http_status_code: 0, // TODO we could return this properly in the PushError.
                error_message: format!("{:?}", e),
            }),
        };
        debug!(lc, "...Push complete in {}ms", push_timer.elapsed_ms());
    }

    Ok(batch_push_info)
}

#[cfg(not(target_arch = "wasm32"))]
#[cfg(test)]
mod tests {
    use super::super::*;
    use super::*;
    use crate::dag;
    use crate::db;
    use crate::db::test_helpers::*;
    use crate::db::DEFAULT_HEAD_NAME;
    use crate::fetch;
    use crate::kv::memstore::MemStore;
    use crate::util::rlog::LogContext;
    use crate::util::to_debug;
    use async_std::net::TcpListener;
    use async_trait::async_trait;
    use serde_json::json;
    use str_macro::str;
    use tide::{Body, Response};

    #[async_std::test]
    async fn test_push() {
        lazy_static! {
            static ref PUSH_REQ: BatchPushRequest = BatchPushRequest {
                client_id: str!("client_id"),
                mutations: vec![Mutation {
                    id: 1,
                    name: "mutator_name".to_string(),
                    args: serde_json::Value::Bool(true),
                },
                Mutation {
                    id: 2,
                    name: "some_other_mutator_name".to_string(),
                    args: serde_json::Value::Null,
                }],
            };
            // EXP_BODY must be 'static to be used in HTTP handler closure.
            static ref EXP_BODY: String = serde_json::to_string(&*PUSH_REQ).unwrap();
        }
        let batch_push_auth = "batch-push-auth";
        let sync_id = "TODO";
        let path = "/push";

        struct Case<'a> {
            pub name: &'a str,
            pub resp_status: u16,
            pub resp_body: &'a str,
            pub exp_err: Option<&'a str>,
            pub exp_resp: Option<BatchPushResponse>,
        }
        let cases = [
            Case {
                name: "200",
                resp_status: 200,
                resp_body: r#"{}"#,
                exp_err: None,
                exp_resp: Some(BatchPushResponse {}),
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
                        batch_push_auth
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
            let puller = FetchPusher::new(&client);
            let result = puller
                .push(
                    &PUSH_REQ,
                    &format!("http://{}{}", addr, path),
                    batch_push_auth,
                    sync_id,
                )
                .await;

            match &c.exp_err {
                None => {
                    let got_push_resp = result.expect(c.name);
                    assert_eq!(c.exp_resp.as_ref().unwrap(), &got_push_resp);
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

    pub struct FakePusher<'a> {
        exp_push: bool,
        exp_push_req: Option<&'a push::BatchPushRequest>,
        exp_push_url: &'a str,
        exp_push_auth: &'a str,
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
            push_url: &str,
            push_auth: &str,
            sync_id: &str,
        ) -> Result<push::BatchPushResponse, push::PushError> {
            assert!(self.exp_push);

            if self.exp_push_req.is_some() {
                assert_eq!(self.exp_push_req.unwrap(), push_req);
                assert_eq!(self.exp_push_url, push_url);
                assert_eq!(self.exp_push_auth, push_auth);
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

    #[async_std::test]
    async fn test_try_push() {
        let store = dag::Store::new(Box::new(MemStore::new()));
        let mut chain: Chain = vec![];
        add_genesis(&mut chain, &store).await;
        add_snapshot(&mut chain, &store, Some(vec![str!("foo"), str!("bar")])).await;
        // chain[2] is an index change
        add_index_change(&mut chain, &store).await;
        let starting_num_commits = chain.len();

        let sync_id = str!("sync_id");
        let client_id = str!("test_client_id");
        let push_auth = str!("push_auth");

        // Push
        let push_url = str!("push_url");

        struct Case<'a> {
            pub name: &'a str,

            // Push expectations.
            pub num_pending_mutations: u32,
            pub exp_push_req: Option<push::BatchPushRequest>,
            pub push_result: Option<Result<push::BatchPushResponse, String>>,
            pub exp_batch_push_info: Option<HttpRequestInfo>,
        }
        let cases: Vec<Case> = vec![
            Case {
                name: "0 pending",
                num_pending_mutations: 0,
                exp_push_req: None,
                push_result: None,
                exp_batch_push_info: None,
            },
            Case {
                name: "1 pending",
                num_pending_mutations: 1,
                exp_push_req: Some(push::BatchPushRequest {
                    client_id: client_id.clone(),
                    mutations: vec![push::Mutation {
                        id: 2,
                        name: "mutator_name_3".to_string(),
                        args: json!([3]),
                    }],
                }),
                push_result: Some(Ok(push::BatchPushResponse {})),
                exp_batch_push_info: Some(HttpRequestInfo {
                    http_status_code: 200,
                    error_message: str!(""),
                }),
            },
            Case {
                name: "2 pending",
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
                exp_batch_push_info: Some(HttpRequestInfo {
                    http_status_code: 200,
                    error_message: str!(""),
                }),
            },
            Case {
                name: "2 mutations to push, push errors",
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
                exp_batch_push_info: Some(HttpRequestInfo {
                    http_status_code: 500,
                    error_message: str!("FetchNotOk(500)"),
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
                exp_push_url: &push_url,
                exp_push_auth: &push_auth,
                exp_sync_id: &sync_id,
                resp: push_resp,
                err: push_err,
            };

            let lc = LogContext::new();
            let pusher = &fake_pusher;
            let client_id = str!("test_client_id");
            let sync_id = sync_id.clone();
            let batch_push_info = super::push(
                &sync_id,
                &store,
                lc.clone(),
                client_id.clone(),
                pusher,
                TryPushRequest {
                    push_url: push_url.clone(),
                    push_auth: push_auth.clone(),
                },
            )
            .await
            .unwrap();

            assert_eq!(batch_push_info, c.exp_batch_push_info, "name: {}", c.name);
        }
    }
}
