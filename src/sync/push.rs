use super::{HttpRequestInfo, TryPushError, TryPushRequest};
use crate::fetch::errors::FetchError;
use crate::{dag, db, util::rlog::LogContext};
use crate::{fetch, util::rlog};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use str_macro::str;

// Push Versions
// 0 (current): direct push to data layer
const PUSH_VERSION: u32 = 0;

#[derive(Debug, Deserialize, PartialEq, Serialize)]
pub struct PushRequest {
    #[serde(rename = "clientID")]
    pub client_id: String,
    pub mutations: Vec<Mutation>,
    #[serde(rename = "pushVersion")]
    pub push_version: u32,
    // schema_version can optionally be used to specify to the push endpoint
    // version information about the mutators the app is using (e.g., format
    // of mutator args).
    #[serde(rename = "schemaVersion")]
    pub schema_version: String,
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
pub struct PushResponse {
    // TODO: MutationInfos []MutationInfo `json:"mutationInfos,omitempty"`
}

// We define this trait so we can provide a fake implementation for testing.
#[async_trait(?Send)]
pub trait Pusher {
    async fn push(
        &self,
        push_req: &PushRequest,
        push_url: &str,
        push_auth: &str,
        request_id: &str,
    ) -> Result<(Option<PushResponse>, HttpRequestInfo), PushError>;
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
    // A failed HTTP response (non 200) is not an error. In that case we get
    // `None` for the `PushResponse`. We get errors for a few non HTTP related
    // reasons such as if we fail to create a Request object, the call to fetch
    // fails or the response is not the expected JSON format.
    async fn push(
        &self,
        push_req: &PushRequest,
        push_url: &str,
        push_auth: &str,
        request_id: &str,
    ) -> Result<(Option<PushResponse>, HttpRequestInfo), PushError> {
        use PushError::*;
        let http_req = new_push_http_request(push_req, push_url, push_auth, request_id)?;
        let http_resp: http::Response<String> = self
            .fetch_client
            .request(http_req)
            .await
            .map_err(FetchFailed)?;
        let ok = http_resp.status() == http::StatusCode::OK;
        let http_request_info = HttpRequestInfo {
            http_status_code: http_resp.status().into(),
            error_message: if ok {
                str!("")
            } else {
                http_resp.body().into()
            },
        };
        let push_resp = if ok {
            serde_json::from_str(&http_resp.body()).map_err(InvalidResponse)?
        } else {
            None
        };
        Ok((push_resp, http_request_info))
    }
}

fn new_push_http_request(
    push_req: &PushRequest,
    push_url: &str,
    push_auth: &str,
    request_id: &str,
) -> Result<http::Request<String>, PushError> {
    use PushError::*;
    let body = serde_json::to_string(push_req).map_err(SerializePushError)?;
    let builder = http::request::Builder::new();
    let http_req = builder
        .method("POST")
        .uri(push_url)
        .header("Content-type", "application/json")
        .header("Authorization", push_auth)
        .header("X-Replicache-RequestID", request_id)
        .body(body)
        .map_err(InvalidRequest)?;
    Ok(http_req)
}

#[derive(Debug)]
pub enum PushError {
    FetchFailed(FetchError),
    InvalidRequest(http::Error),
    InvalidResponse(serde_json::error::Error),
    SerializePushError(serde_json::error::Error),
}

pub async fn push(
    request_id: &str,
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

    let mut http_request_info: Option<HttpRequestInfo> = None;
    if !pending.is_empty() {
        let mut push_mutations: Vec<Mutation> = Vec::new();
        for commit in pending.iter() {
            match commit.meta().typed() {
                db::MetaTyped::Local(lm) => push_mutations.push(lm.into()),
                _ => return Err(InternalNonLocalPendingCommit),
            }
        }
        let push_req = PushRequest {
            client_id,
            mutations: push_mutations,
            push_version: PUSH_VERSION,
            schema_version: req.schema_version,
        };
        debug!(lc, "Starting push...");
        let push_timer = rlog::Timer::new();
        let (_push_resp, req_info) = pusher
            .push(&push_req, &req.push_url, &req.push_auth, request_id)
            .await
            .map_err(PushFailed)?;
        http_request_info = Some(req_info);

        debug!(lc, "...Push complete in {}ms", push_timer.elapsed_ms());
    }

    Ok(http_request_info)
}

#[cfg(test)]
mod tests {
    use super::super::*;
    use super::*;
    use crate::dag;
    use crate::db;
    use crate::db::test_helpers::*;
    use crate::db::DEFAULT_HEAD_NAME;
    #[cfg(not(target_arch = "wasm32"))]
    use crate::fetch;
    use crate::kv::memstore::MemStore;
    use crate::util::rlog::LogContext;
    #[cfg(not(target_arch = "wasm32"))]
    use crate::util::to_debug;
    #[cfg(not(target_arch = "wasm32"))]
    use async_std::net::TcpListener;
    #[cfg(not(target_arch = "wasm32"))]
    use async_trait::async_trait;
    use serde_json::json;
    use str_macro::str;
    #[cfg(not(target_arch = "wasm32"))]
    use tide::{Body, Response};

    #[cfg(not(target_arch = "wasm32"))]
    #[async_std::test]
    async fn test_fetch_pusher() {
        lazy_static! {
            static ref PUSH_REQ: PushRequest = PushRequest {
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
                push_version: PUSH_VERSION,
                schema_version: str!("schema_version")
            };
            // EXP_BODY must be 'static to be used in HTTP handler closure.
            static ref EXP_BODY: String = serde_json::to_string(&*PUSH_REQ).unwrap();
        }
        let batch_push_auth = "batch-push-auth";
        let request_id = "TODO";
        let path = "/push";

        let good_http_request_info = HttpRequestInfo {
            http_status_code: http::StatusCode::OK.into(),
            error_message: str!(""),
        };

        struct Case<'a> {
            pub name: &'a str,
            pub resp_status: u16,
            pub resp_body: &'a str,
            pub exp_err: Option<&'a str>,
            pub exp_resp: Option<PushResponse>,
            pub exp_http_request_info: HttpRequestInfo,
        }
        let cases = [
            Case {
                name: "200",
                resp_status: 200,
                resp_body: r#"{}"#,
                exp_err: None,
                exp_resp: Some(PushResponse {}),
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
                // Not used when there was an error
                exp_http_request_info: good_http_request_info.clone(),
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
            let puller = FetchPusher::new(&client);
            let result = puller
                .push(
                    &PUSH_REQ,
                    &format!("http://{}{}", addr, path),
                    batch_push_auth,
                    request_id,
                )
                .await;

            if let Ok(result) = &result {
                assert_eq!(result.0, c.exp_resp, "{}", c.name);
            }

            match &c.exp_err {
                None => {
                    let got_push_resp = result.expect(c.name).0;
                    assert_eq!(c.exp_resp, got_push_resp);
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
        exp_push_req: Option<&'a push::PushRequest>,
        exp_push_url: &'a str,
        exp_push_auth: &'a str,
        exp_request_id: &'a str,

        // We would like to write here:
        //    result: Result<PushResponse, PushError>,
        // but pull takes &self so we can't move out of result if we did.
        // Cloning and returning result would work except for that our error
        // enums contain values that are not cloneable, eg http::Status and
        // DeserializeErr. (Or, I guess we could make pull take &mut self as another
        // solution, so long as all contained errors are Send. I think.)
        resp: Option<push::PushResponse>,
        err: Option<String>,
    }

    #[async_trait(?Send)]
    impl<'a> push::Pusher for FakePusher<'a> {
        async fn push(
            &self,
            push_req: &push::PushRequest,
            push_url: &str,
            push_auth: &str,
            request_id: &str,
        ) -> Result<(Option<push::PushResponse>, HttpRequestInfo), push::PushError> {
            assert!(self.exp_push);

            if self.exp_push_req.is_some() {
                assert_eq!(self.exp_push_req.unwrap(), push_req);
                assert_eq!(self.exp_push_url, push_url);
                assert_eq!(self.exp_push_auth, push_auth);
                assert_eq!(self.exp_request_id, request_id);
            }

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
    async fn test_try_push() {
        let store = dag::Store::new(Box::new(MemStore::new()));
        let mut chain: Chain = vec![];
        add_genesis(&mut chain, &store).await;
        add_snapshot(&mut chain, &store, Some(vec![("foo", "bar")])).await;
        // chain[2] is an index change
        add_index_change(&mut chain, &store).await;
        let starting_num_commits = chain.len();

        let request_id = str!("request_id");
        let client_id = str!("test_client_id");
        let push_auth = str!("push_auth");

        // Push
        let push_url = str!("push_url");
        let push_schema_version = str!("push_schema_version");

        struct Case<'a> {
            pub name: &'a str,

            // Push expectations.
            pub num_pending_mutations: u32,
            pub exp_push_req: Option<push::PushRequest>,
            pub push_result: Option<Result<push::PushResponse, String>>,
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
                exp_push_req: Some(push::PushRequest {
                    client_id: client_id.clone(),
                    mutations: vec![push::Mutation {
                        id: 2,
                        name: "mutator_name_3".to_string(),
                        args: json!([3]),
                    }],
                    push_version: PUSH_VERSION,
                    schema_version: push_schema_version.clone(),
                }),
                push_result: Some(Ok(push::PushResponse {})),
                exp_batch_push_info: Some(HttpRequestInfo {
                    http_status_code: 200,
                    error_message: str!(""),
                }),
            },
            Case {
                name: "2 pending",
                num_pending_mutations: 2,
                exp_push_req: Some(push::PushRequest {
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
                    push_version: PUSH_VERSION,
                    schema_version: push_schema_version.clone(),
                }),
                push_result: Some(Ok(push::PushResponse {})),
                exp_batch_push_info: Some(HttpRequestInfo {
                    http_status_code: 200,
                    error_message: str!(""),
                }),
            },
            Case {
                name: "2 mutations to push, push errors",
                num_pending_mutations: 2,
                exp_push_req: Some(push::PushRequest {
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
                    push_version: PUSH_VERSION,
                    schema_version: push_schema_version.clone(),
                }),
                push_result: Some(Err(str!("FetchNotOk(500)"))),
                exp_batch_push_info: Some(HttpRequestInfo {
                    http_status_code: 500,
                    error_message: str!("Fetch not OK"),
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
                exp_request_id: &request_id,
                resp: push_resp,
                err: push_err,
            };

            let lc = LogContext::new();
            let pusher = &fake_pusher;
            let client_id = str!("test_client_id");
            let request_id = request_id.clone();
            let batch_push_info = super::push(
                &request_id,
                &store,
                lc.clone(),
                client_id.clone(),
                pusher,
                TryPushRequest {
                    push_url: push_url.clone(),
                    push_auth: push_auth.clone(),
                    schema_version: push_schema_version.clone(),
                },
            )
            .await
            .unwrap();

            assert_eq!(batch_push_info, c.exp_batch_push_info, "name: {}", c.name);
        }
    }
}
