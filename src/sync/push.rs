use crate::db;
use crate::fetch;
use crate::fetch::errors::FetchError;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

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
