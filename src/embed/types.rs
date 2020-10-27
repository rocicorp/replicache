#![allow(clippy::redundant_pattern_matching)] // For derive(Deserialize).

use crate::db;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct OpenTransactionRequest {
    pub name: Option<String>, // not present in read transactions
    pub args: Option<String>, // not present in read transactions
    #[serde(rename = "rebaseOpts")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rebase_opts: Option<RebaseOpts>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct RebaseOpts {
    pub basis: String,
    #[serde(rename = "original")]
    pub original_hash: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct OpenTransactionResponse {
    #[serde(rename = "transactionId")]
    pub transaction_id: u32,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CommitTransactionRequest {
    #[serde(rename = "transactionId")]
    pub transaction_id: u32,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CommitTransactionResponse {
    // Note: the field is named "ref" in go but "ref" is a reserved word in rust.
    #[serde(rename = "ref")]
    pub hash: String,
    // TODO I think retry_commit was required to accommodate noms' optimistic locking
    // and we can do away with it in repc once compatability is no longer an issue.
    #[serde(rename = "retryCommit")]
    pub retry_commit: bool,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CloseTransactionRequest {
    #[serde(rename = "transactionId")]
    pub transaction_id: u32,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CloseTransactionResponse {}

#[derive(Debug, Deserialize, Serialize)]
pub struct TransactionRequest {
    #[serde(rename = "transactionId")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transaction_id: Option<u32>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct GetRootRequest {
    #[serde(rename = "headName")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub head_name: Option<String>,
}

#[derive(Debug, Deserialize, PartialEq, Serialize)]
pub struct GetRootResponse {
    pub root: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct HasRequest {
    #[serde(rename = "transactionId")]
    pub transaction_id: u32,
    pub key: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct HasResponse {
    pub has: bool,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct GetRequest {
    #[serde(rename = "transactionId")]
    pub transaction_id: u32,
    pub key: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct GetResponse {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<String>,
    pub has: bool, // Second to avoid trailing comma if value == None.
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ScanKey {
    pub value: String,
    pub exclusive: bool,
}

impl<'a> From<&'a ScanKey> for db::ScanKey<'a> {
    fn from(source: &'a ScanKey) -> db::ScanKey<'a> {
        db::ScanKey {
            value: source.value.as_bytes(),
            exclusive: source.exclusive,
        }
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ScanBound {
    #[serde(rename = "id")]
    pub key: Option<ScanKey>,
    pub index: Option<u64>,
}

impl<'a> From<&'a ScanBound> for db::ScanBound<'a> {
    fn from(source: &'a ScanBound) -> db::ScanBound<'a> {
        db::ScanBound {
            key: source.key.as_ref().map(|key| key.into()),
            index: source.index,
        }
    }
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ScanOptions {
    pub prefix: Option<String>,
    pub start: Option<ScanBound>,
    pub limit: Option<u64>,
    #[serde(rename = "indexName")]
    pub index_name: Option<String>,
}

impl<'a> From<&'a ScanOptions> for db::ScanOptions<'a> {
    fn from(source: &'a ScanOptions) -> db::ScanOptions<'a> {
        db::ScanOptions {
            prefix: source.prefix.as_ref().map(|s| s.as_bytes()),
            start: source.start.as_ref().map(|s| s.into()),
            limit: source.limit,
            index_name: source.index_name.as_deref(),
        }
    }
}

// How to use ScanRequest:
// - opts.prefix: key prefix to scan, "" matches all of them
// - opts.limit: only return at most this many matches
// - opts.start can be used on its own or for pagination:
//    - opts.start.index: return matches starting from this offset *of the prefix*
//    - opts.start.key.value: start returning matches from this value, inclusive unless:
//    - opts.start.key.exclusive: start returning matches *after* the value opts.start.key.value
#[derive(Debug, Deserialize, Serialize)]
pub struct ScanRequest {
    #[serde(rename = "transactionId")]
    pub transaction_id: u32,
    pub opts: ScanOptions,

    // receiver is the callback that receives scan results, one at
    // a time. It is an Option so that serde knows a default value
    // to use for it (None).
    //
    // TODO say more about what it should/not do, how it can stop
    //      the scan, etc.
    #[serde(skip)]
    pub receiver: Option<js_sys::Function>,
}

#[derive(Debug, Deserialize, PartialEq, Serialize)]
pub struct ScanResponse {}

#[derive(Debug)]
pub enum ScanError {
    MissingReceiver,
    InvalidReceiver,
    ScanError(db::ScanError),
}

#[derive(Debug, Deserialize, Serialize)]
pub struct PutRequest {
    #[serde(rename = "transactionId")]
    pub transaction_id: u32,
    pub key: String,
    pub value: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct PutResponse {}

#[derive(Debug, Deserialize, Serialize)]
pub struct DelRequest {
    #[serde(rename = "transactionId")]
    pub transaction_id: u32,
    pub key: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct DelResponse {
    #[serde(rename = "ok")]
    pub had: bool,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateIndexRequest {
    #[serde(rename = "transactionId")]
    pub transaction_id: u32,
    pub name: String,
    #[serde(rename = "keyPrefix")]
    pub key_prefix: String,
    #[serde(rename = "jsonPointer")]
    pub json_pointer: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateIndexResponse {}

#[derive(Debug)]
pub enum CreateIndexError {
    DBError(db::CreateIndexError),
}

#[derive(Debug, Deserialize, Serialize)]
pub struct DropIndexRequest {
    #[serde(rename = "transactionId")]
    pub transaction_id: u32,
    pub name: String,
}

#[derive(Debug, Deserialize, PartialEq, Serialize)]
pub struct DropIndexResponse {}

#[derive(Debug)]
pub enum DropIndexError {
    DBError(db::DropIndexError),
}
