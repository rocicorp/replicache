use crate::util::nanoserde::any;
use nanoserde::{DeJson, SerJson};
use std::default::Default;

#[derive(DeJson, SerJson)]
pub struct BeginSyncRequest {
    #[nserde(rename = "batchPushURL")]
    pub batch_push_url: String,
    // data_layer_auth is used for push and for pull (as the client_view_auth).
    #[nserde(rename = "dataLayerAuth")]
    pub data_layer_auth: String,
    #[nserde(rename = "diffServerURL")]
    pub diff_server_url: String,
    #[nserde(rename = "diffServerAuth")]
    pub diff_server_auth: String,
}

// If BeginSync did not pull new state then sync_head will be empty and the sync
// is complete: the caller should not call MaybeEndSync. If sync_head is present
// then it pulled new state and the caller should proceed to call MaybeEndSync.
#[derive(Debug, Default, DeJson, SerJson)]
pub struct BeginSyncResponse {
    #[nserde(rename = "syncHead")]
    pub sync_head: String,
    #[nserde(rename = "syncInfo")]
    pub sync_info: SyncInfo,
    // TODO Fill in the rest of SyncInfo
}

#[derive(Debug, Default, DeJson, SerJson)]
pub struct SyncInfo {
    #[nserde(rename = "syncID")]
    pub sync_id: String,
}

#[derive(DeJson, SerJson)]
pub struct MaybeEndSyncRequest {
    // TODO return sync_id in sync_info in BeginSyncResponse.
    #[nserde(rename = "syncID")]
    pub sync_id: String,
    #[nserde(rename = "syncHead")]
    pub sync_head: String,
}

// If replay_mutations is empty then there are no pending mutations to replay
// and sync is complete. If replay_mutations is not empty the returned mutations
// should be replayed and MaybeEndSync invoked again.
#[derive(Debug, DeJson, SerJson)]
pub struct MaybeEndSyncResponse {
    #[nserde(rename = "replayMutations")]
    pub replay_mutations: Vec<ReplayMutation>,
    #[nserde(rename = "syncHead")]
    pub sync_head: String,
}

// ReplayMutation is returned in the MaybeEndPushResponse, not be confused with
// sync::push::Mutation, which is used in batch push.
#[derive(Debug, DeJson, SerJson)]
pub struct ReplayMutation {
    pub id: u64,
    pub name: String,
    pub args: any::Any,
    #[nserde(skip_serializing_if = "Option::is_none")]
    pub original: String,
}
