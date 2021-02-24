use serde::{Deserialize, Serialize};
use std::default::Default;

#[derive(Debug, Deserialize, Serialize)]
pub struct BatchPushInfo {
    #[serde(rename = "httpStatusCode")]
    pub http_status_code: u16,
    #[serde(rename = "errorMessage")]
    pub error_message: String,
    // TODO BatchPushResponse BatchPushResponse `json:"batchPushResponse"`
}

#[derive(Clone, Debug, Default, Deserialize, PartialEq, Serialize)]
pub struct ClientViewInfo {
    #[serde(rename = "httpStatusCode")]
    pub http_status_code: u16,
    #[serde(rename = "errorMessage")]
    pub error_message: String,
}

#[derive(Deserialize, Serialize)]
pub struct MaybeEndTryPullRequest {
    #[serde(rename = "syncID")]
    pub sync_id: String,
    #[serde(rename = "syncHead")]
    pub sync_head: String,
}

// If replay_mutations is empty then there are no pending mutations to replay
// and pull is complete. If replay_mutations is not empty the returned mutations
// should be replayed and maybeEndPull invoked again.
#[derive(Debug, Serialize)]
pub struct MaybeEndTryPullResponse {
    #[serde(rename = "replayMutations")]
    pub replay_mutations: Vec<ReplayMutation>,
    #[serde(rename = "syncHead")]
    pub sync_head: String,
}

// ReplayMutation is returned in the MaybeEndPushResponse, not be confused with
// sync::push::Mutation, which is used in batch push.
#[derive(Debug, Serialize)]
pub struct ReplayMutation {
    pub id: u64,
    pub name: String,
    pub args: String,
    pub original: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TryBeginPullRequest {
    #[serde(rename = "clientViewURL")]
    pub client_view_url: String,
    #[serde(rename = "dataLayerAuth")]
    pub data_layer_auth: String,
    #[serde(rename = "diffServerURL")]
    pub diff_server_url: String,
    #[serde(rename = "diffServerAuth")]
    pub diff_server_auth: String,
}

#[derive(Debug, Serialize)]
pub struct TryBeginPullResponse {
    #[serde(rename = "clientViewInfo")]
    pub client_view_info: ClientViewInfo,
    #[serde(rename = "syncHead")]
    pub sync_head: String,
    #[serde(rename = "syncID")]
    pub sync_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TryPushRequest {
    #[serde(rename = "batchPushURL")]
    pub batch_push_url: String,
    #[serde(rename = "dataLayerAuth")]
    pub data_layer_auth: String,
}

#[derive(Debug, Serialize)]
pub struct TryPushResponse {
    #[serde(rename = "batchPushInfo")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub batch_push_info: Option<BatchPushInfo>,
}
