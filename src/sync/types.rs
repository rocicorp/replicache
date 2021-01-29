use serde::{Deserialize, Serialize};
use std::default::Default;

#[derive(Deserialize, Serialize)]
pub struct BeginSyncRequest {
    #[serde(rename = "batchPushURL")]
    pub batch_push_url: String,
    #[serde(rename = "clientViewURL")]
    pub client_view_url: String,
    // data_layer_auth is used for push and for pull (as the client_view_auth).
    #[serde(rename = "dataLayerAuth")]
    pub data_layer_auth: String,
    #[serde(rename = "diffServerURL")]
    pub diff_server_url: String,
    #[serde(rename = "diffServerAuth")]
    pub diff_server_auth: String,
}

// If BeginSync did not pull new state then sync_head will be empty and the sync
// is complete: the caller should not call MaybeEndSync. If sync_head is present
// then it pulled new state and the caller should proceed to call MaybeEndSync.
#[derive(Debug, Default, Deserialize, Serialize)]
pub struct BeginSyncResponse {
    #[serde(rename = "syncHead")]
    pub sync_head: String,
    #[serde(rename = "syncInfo")]
    pub sync_info: SyncInfo,
}

#[derive(Debug, Default, Deserialize, Serialize)]
pub struct SyncInfo {
    #[serde(rename = "syncID")]
    pub sync_id: String,

    // BatchPushInfo will be set if we attempted to push, ie if there were >0 pending commits.
    // Its http_status_code will be 0 if the request was not sent, eg we couldn't create
    // the request for some reason. It will be the status code returned by the server if
    // the server returned 200 and the result parsed properly or if the server returned
    // something other than 200.
    //
    // TODO the status code will be 0 if the server returned 200 but the result
    // could not be parsed -- this is a bug we could fix by always returning the
    // status code in the PushError. (The error_message will contain the error
    // in this case however.)
    #[serde(rename = "batchPushInfo")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub batch_push_info: Option<BatchPushInfo>,
    // ClientViewInfo will be set if the request to the diffserver completed with status 200
    // and the diffserver attempted to request the client view from the data layer.
    #[serde(rename = "clientViewInfo")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub client_view_info: Option<ClientViewInfo>,
}

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
pub struct MaybeEndSyncRequest {
    #[serde(rename = "syncID")]
    pub sync_id: String,
    #[serde(rename = "syncHead")]
    pub sync_head: String,
}

// If replay_mutations is empty then there are no pending mutations to replay
// and sync is complete. If replay_mutations is not empty the returned mutations
// should be replayed and MaybeEndSync invoked again.
#[derive(Debug, Serialize)]
pub struct MaybeEndSyncResponse {
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
