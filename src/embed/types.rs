#![allow(clippy::redundant_pattern_matching)] // For derive(DeJson).

use nanoserde::{DeJson, SerJson};

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

#[derive(SerJson)]
pub struct CommitTransactionResponse {}

#[derive(DeJson)]
pub struct CloseTransactionRequest {
    #[nserde(rename = "transactionId")]
    pub transaction_id: u32,
}

#[derive(SerJson)]
pub struct CloseTransactionResponse {}

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
