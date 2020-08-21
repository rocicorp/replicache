#![allow(clippy::redundant_pattern_matching)] // For derive(DeJson).

use super::types::*;
use crate::dag;
use crate::db;
use crate::db::{Commit, MetaTyped};
use crate::fetch;
use crate::fetch::errors::FetchError;
use nanoserde::{DeJson, DeJsonErr, SerJson};
use std::fmt::Debug;

pub async fn begin_sync(
    store: &dag::Store,
    fetch_client: &fetch::client::Client,
    begin_sync_req: &BeginSyncRequest,
) -> Result<BeginSyncResponse, BeginSyncError> {
    use BeginSyncError::*;

    let read = store.read().await.map_err(DbError)?;
    let base_snapshot = Commit::base_snapshot(
        &read
            .read()
            .get_head("main")
            .await
            .map_err(DbError)?
            .unwrap(),
        &read.read(),
    )
    .await
    .map_err(CommitLoadError)?;
    let checksum = base_snapshot.meta().checksum().to_string();
    let base_state_id: String;
    match base_snapshot.meta().typed() {
        MetaTyped::Local(_) => std::unreachable!(),
        MetaTyped::Snapshot(sm) => {
            base_state_id = sm.server_state_id().to_string();
        }
    }
    let pull_req = PullRequest {
        client_view_auth: begin_sync_req.data_layer_auth.clone(),
        client_id: "TODO".to_string(),
        base_state_id,
        checksum,
    };

    let sync_id = "TODO";
    let _ = pull(
        fetch_client,
        &pull_req,
        &begin_sync_req.diff_server_url,
        &begin_sync_req.diff_server_auth,
        sync_id,
    )
    .await
    .map_err(PullFailed)?;
    // TODO do something with the response
    Ok(BeginSyncResponse {})
}

#[derive(Debug)]
pub enum BeginSyncError {
    CommitLoadError(db::FromHashError),
    DbError(dag::Error),
    PullFailed(PullError),
}

#[derive(Default, SerJson)]
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

#[derive(Debug, Default, DeJson, PartialEq)]
pub struct PullResponse {
    #[nserde(rename = "stateID")]
    #[allow(dead_code)]
    state_id: String,
    #[nserde(rename = "lastMutationID")]
    #[allow(dead_code)]
    last_mutation_id: String,
    // 	TODO Patch          []kv.Operation `json:"patch"`
    #[nserde(rename = "checksum")]
    #[allow(dead_code)]
    checksum: String,
    // TODO ClientViewInfo ClientViewInfo `json:"clientViewInfo"`
}

pub async fn pull(
    fetch_client: &fetch::client::Client,
    pull_req: &PullRequest,
    diff_server_url: &str,
    diff_server_auth: &str,
    sync_id: &str,
) -> Result<PullResponse, PullError> {
    use PullError::*;
    let http_req = new_pull_http_request(pull_req, diff_server_url, diff_server_auth, sync_id)?;
    let http_resp: http::Response<String> =
        fetch_client.request(http_req).await.map_err(FetchFailed)?;
    if http_resp.status() != http::StatusCode::OK {
        return Err(PullError::FetchNotOk(http_resp.status()));
    }
    let pull_resp: PullResponse =
        DeJson::deserialize_json(http_resp.body()).map_err(InvalidResponse)?;
    Ok(pull_resp)
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
    use httptest::{matchers::*, Expectation, Server};
    use str_macro::str;

    #[tokio::test]
    async fn test_pull() {
        let pull_req = PullRequest {
            client_view_auth: str!("client-view-auth"),
            client_id: str!("TODO"),
            base_state_id: str!("base-state-id"),
            checksum: str!("checksum"),
        };
        let exp_body = SerJson::serialize_json(&pull_req);
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
                resp_body: r#"{"stateID": "1", "lastMutationID": "2", "checksum": "12345678"}"#,
                exp_err: None,
                exp_resp: Some(PullResponse {
                    state_id: str!("1"),
                    last_mutation_id: str!("2"),
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
            let server = Server::run();
            let resp = http::Response::builder()
                .status(c.resp_status)
                .body(c.resp_body)
                .unwrap();
            server.expect(
                Expectation::matching(all_of![
                    request::method_path("POST", path),
                    request::headers(contains(("authorization", diff_server_auth))),
                    request::headers(contains(("content-type", "application/json"))),
                    request::headers(contains(("x-replicache-syncid", sync_id))),
                    request::body(exp_body.clone()),
                ])
                .respond_with(resp),
            );
            let client = fetch::client::Client::new();
            let result = pull(
                &client,
                &pull_req,
                &server.url(path).to_string(),
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
        }
    }
}
