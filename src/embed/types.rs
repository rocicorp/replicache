#![allow(clippy::redundant_pattern_matching)] // For derive(DeJson).

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
pub struct PutRequest {
    #[nserde(rename = "transactionId")]
    pub transaction_id: u32,
    pub key: String,
    pub value: String,
}

#[derive(DeJson, SerJson)]
pub struct PutResponse {}

#[derive(DeJson, SerJson)]
pub struct BeginSyncRequest {
    // TODO BatchPushURL   string `json:"batchPushURL"`
    // data_layer_auth is used for push and for pull (as the client_view_auth).
    #[nserde(rename = "dataLayerAuth")]
    pub data_layer_auth: String,
    #[nserde(rename = "diffServerURL")]
    pub diff_server_url: String,
    #[nserde(rename = "diffServerAuth")]
    pub diff_server_auth: String,
}

#[derive(Debug, Default, DeJson, SerJson)]
pub struct BeginSyncResponse {
    #[nserde(rename = "syncHead")]
    pub sync_head: String,
    // TODO SyncInfo db.SyncInfo `json:"syncInfo"`
}
