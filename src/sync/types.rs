use serde::{Deserialize, Serialize};
use std::default::Default;

#[derive(Deserialize, Serialize)]
pub struct BeginSyncRequest {
    #[serde(rename = "batchPushURL")]
    pub batch_push_url: String,
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
    // TODO Fill in the rest of SyncInfo
}

#[derive(Debug, Default, Deserialize, Serialize)]
pub struct SyncInfo {
    #[serde(rename = "syncID")]
    pub sync_id: String,
}

#[derive(Deserialize, Serialize)]
pub struct MaybeEndSyncRequest {
    // TODO return sync_id in sync_info in BeginSyncResponse.
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
