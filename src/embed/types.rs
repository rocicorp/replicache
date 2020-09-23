#![allow(clippy::redundant_pattern_matching)] // For derive(Deserialize).

use crate::db;
use crate::prolly;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct OpenTransactionRequest {
    pub name: Option<String>,            // not present in read transactions
    pub args: Option<serde_json::Value>, // not present in read transactions
    #[serde(rename = "rebaseOpts")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rebase_opts: Option<RebaseOpts>,
}

#[derive(Clone, Deserialize, Serialize)]
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

#[derive(Deserialize)]
pub struct CommitTransactionRequest {
    #[serde(rename = "transactionId")]
    pub transaction_id: u32,
}

#[derive(Deserialize, Serialize)]
pub struct CommitTransactionResponse {
    // Note: the field is named "ref" in go but "ref" is a reserved word in rust.
    #[serde(rename = "ref")]
    pub hash: String,
    // TODO I think retry_commit was required to accommodate noms' optimistic locking
    // and we can do away with it in repc once compatability is no longer an issue.
    #[serde(rename = "retryCommit")]
    pub retry_commit: bool,
}

#[derive(Deserialize)]
pub struct CloseTransactionRequest {
    #[serde(rename = "transactionId")]
    pub transaction_id: u32,
}

#[derive(Serialize)]
pub struct CloseTransactionResponse {}

#[derive(Debug, Deserialize, Serialize)]
pub struct GetRootRequest {
    #[serde(rename = "headName")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub head_name: Option<String>,
}

#[derive(Deserialize, Serialize)]
pub struct GetRootResponse {
    pub root: String,
}

#[derive(Deserialize)]
pub struct HasRequest {
    #[serde(rename = "transactionId")]
    pub transaction_id: u32,
    pub key: String,
}

#[derive(Deserialize, Serialize)]
pub struct HasResponse {
    pub has: bool,
}

#[derive(Deserialize)]
pub struct GetRequest {
    #[serde(rename = "transactionId")]
    pub transaction_id: u32,
    pub key: String,
}

#[derive(Deserialize, Serialize)]
pub struct GetResponse {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<String>,
    pub has: bool, // Second to avoid trailing comma if value == None.
}

#[derive(Deserialize)]
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

#[derive(Deserialize)]
pub struct ScanBound {
    #[serde(rename = "id")]
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

#[derive(Deserialize)]
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

#[derive(Deserialize)]
pub struct ScanRequest {
    #[serde(rename = "transactionId")]
    pub transaction_id: u32,
    pub opts: ScanOptions,
}

#[derive(Serialize)]
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

#[derive(Serialize)]
pub struct ScanResponse {
    pub items: Vec<ScanItem>,
}

#[derive(Deserialize)]
pub struct PutRequest {
    #[serde(rename = "transactionId")]
    pub transaction_id: u32,
    pub key: String,
    pub value: String,
}

#[derive(Deserialize, Serialize)]
pub struct PutResponse {}

#[derive(Deserialize)]
pub struct DelRequest {
    #[serde(rename = "transactionId")]
    pub transaction_id: u32,
    pub key: String,
}

#[derive(Deserialize, Serialize)]
pub struct DelResponse {
    #[serde(rename = "ok")]
    pub had: bool,
}
