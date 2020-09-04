#![allow(clippy::redundant_pattern_matching)] // For derive(DeJson).

use crate::db;
use crate::prolly;
use crate::sync;
use crate::util::nanoserde::any;
use nanoserde::{DeJson, SerJson};
use std::default::Default;

#[derive(DeJson, SerJson)]
pub struct OpenTransactionRequest {
    pub name: Option<String>,   // not present in read transactions
    pub args: Option<any::Any>, // not present in read transactions
    #[nserde(rename = "rebaseOpts")]
    #[nserde(skip_serializing_if = "Option::is_none")]
    pub rebase_opts: Option<RebaseOpts>,
}

#[derive(Clone, DeJson, SerJson)]
pub struct RebaseOpts {
    pub basis: String,
    #[nserde(rename = "original")]
    pub original_hash: String,
}

#[derive(DeJson, SerJson)]
pub struct OpenTransactionResponse {
    #[nserde(rename = "transactionId")]
    pub transaction_id: u32,
}

#[derive(DeJson)]
pub struct CommitTransactionRequest {
    #[nserde(rename = "transactionId")]
    pub transaction_id: u32,
}

#[derive(DeJson, SerJson)]
pub struct CommitTransactionResponse {
    // Note: the field is named "ref" in go but "ref" is a reserved word in rust.
    #[nserde(rename = "ref")]
    pub hash: String,
    // TODO I think retry_commit was required to accommodate noms' optimistic locking
    // and we can do away with it in repc once compatability is no longer an issue.
    #[nserde(rename = "retryCommit")]
    pub retry_commit: bool,
}

#[derive(DeJson)]
pub struct CloseTransactionRequest {
    #[nserde(rename = "transactionId")]
    pub transaction_id: u32,
}

#[derive(SerJson)]
pub struct CloseTransactionResponse {}

#[derive(Debug, DeJson, SerJson)]
pub struct GetRootRequest {
    #[nserde(rename = "headName")]
    #[nserde(skip_serializing_if = "Option::is_none")]
    pub head_name: Option<String>,
}

#[derive(DeJson, SerJson)]
pub struct GetRootResponse {
    pub root: String,
}

#[derive(DeJson)]
pub struct HasRequest {
    #[nserde(rename = "transactionId")]
    pub transaction_id: u32,
    pub key: String,
}

#[derive(DeJson, SerJson)]
pub struct HasResponse {
    pub has: bool,
}

#[derive(DeJson)]
pub struct GetRequest {
    #[nserde(rename = "transactionId")]
    pub transaction_id: u32,
    pub key: String,
}

#[derive(DeJson, SerJson)]
pub struct GetResponse {
    pub value: Option<String>,
    pub has: bool, // Second to avoid trailing comma if value == None.
}

#[derive(DeJson)]
pub struct ScanKey {
    value: String,
    exclusive: bool,
}

impl<'a> From<&'a ScanKey> for db::ScanKey<'a> {
    fn from(source: &'a ScanKey) -> db::ScanKey<'a> {
        db::ScanKey {
            value: source.value.as_bytes(),
            exclusive: source.exclusive,
        }
    }
}

#[derive(DeJson)]
pub struct ScanBound {
    #[nserde(rename = "id")]
    key: Option<ScanKey>,
    index: Option<u64>,
}

impl<'a> From<&'a ScanBound> for db::ScanBound<'a> {
    fn from(source: &'a ScanBound) -> db::ScanBound<'a> {
        db::ScanBound {
            key: source.key.as_ref().map(|key| key.into()),
            index: source.index,
        }
    }
}

#[derive(DeJson)]
pub struct ScanOptions {
    prefix: Option<String>,
    start: Option<ScanBound>,
    limit: Option<u64>,
}

impl<'a> From<&'a ScanOptions> for db::ScanOptions<'a> {
    fn from(source: &'a ScanOptions) -> db::ScanOptions<'a> {
        db::ScanOptions {
            prefix: source.prefix.as_ref().map(|s| s.as_bytes()),
            start: source.start.as_ref().map(|s| s.into()),
            limit: source.limit,
        }
    }
}

#[derive(DeJson)]
pub struct ScanRequest {
    #[nserde(rename = "transactionId")]
    pub transaction_id: u32,
    pub opts: ScanOptions,
}

#[derive(SerJson)]
pub struct ScanItem {
    key: String,
    value: String,
}

#[derive(Debug)]
pub enum FromProllyEntryError {
    BadUTF8(std::string::FromUtf8Error),
}

impl<'a> std::convert::TryFrom<prolly::Entry<'a>> for ScanItem {
    fn try_from(entry: prolly::Entry) -> Result<Self, Self::Error> {
        use FromProllyEntryError::*;
        Ok(Self {
            key: String::from_utf8(entry.key.to_vec()).map_err(BadUTF8)?,
            value: String::from_utf8(entry.val.to_vec()).map_err(BadUTF8)?,
        })
    }
    type Error = FromProllyEntryError;
}

#[derive(SerJson)]
pub struct ScanResponse {
    pub items: Vec<ScanItem>,
}

#[derive(DeJson)]
pub struct PutRequest {
    #[nserde(rename = "transactionId")]
    pub transaction_id: u32,
    pub key: String,
    pub value: String,
}

#[derive(DeJson, SerJson)]
pub struct PutResponse {}

#[derive(DeJson)]
pub struct DelRequest {
    #[nserde(rename = "transactionId")]
    pub transaction_id: u32,
    pub key: String,
}

#[derive(DeJson, SerJson)]
pub struct DelResponse {
    #[nserde(rename = "ok")]
    pub had: bool,
}

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
    pub sync_info: sync::SyncInfo,
    // TODO Fill in the rest of SyncInfo
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
    pub replay_mutations: Vec<sync::ReplayMutation>,
    #[nserde(rename = "syncHead")]
    pub sync_head: String,
}
