use crate::fetch::errors::FetchError;
use crate::{dag, db, util::rlog::LogContext};
use crate::{fetch, util::rlog};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use str_macro::str;

use super::{BatchPushInfo, TryPushError, TryPushRequest};

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
        batch_push_url: &str,
        batch_push_auth: &str,
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
        batch_push_url: &str,
        batch_push_auth: &str,
        sync_id: &str,
    ) -> Result<BatchPushResponse, PushError> {
        use PushError::*;
        let http_req = new_push_http_request(push_req, batch_push_url, batch_push_auth, sync_id)?;
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
    batch_push_url: &str,
    batch_push_auth: &str,
    sync_id: &str,
) -> Result<http::Request<String>, PushError> {
    use PushError::*;
    let body = serde_json::to_string(push_req).map_err(SerializePushError)?;
    let builder = http::request::Builder::new();
    let http_req = builder
        .method("POST")
        .uri(batch_push_url)
        .header("Content-type", "application/json")
        .header("Authorization", batch_push_auth)
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
) -> Result<Option<BatchPushInfo>, TryPushError> {
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
            .push(
                &push_req,
                &req.batch_push_url,
                &req.data_layer_auth,
                sync_id,
            )
            .await;
        // Note: no map_err(). A failed push does not fail sync, but we
        // do report it in BatchPushInfo.
        batch_push_info = match push_resp {
            Ok(_) => Some(BatchPushInfo {
                http_status_code: 200,
                error_message: str!(""),
            }),
            Err(PushError::FetchNotOk(status_code)) => Some(BatchPushInfo {
                http_status_code: status_code.into(),
                error_message: format!("{:?}", PushError::FetchNotOk(status_code)),
            }),
            Err(e) => Some(BatchPushInfo {
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
    use super::*;
    use crate::util::to_debug;
    use async_std::net::TcpListener;
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
}
