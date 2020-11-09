package tests

import (
	"encoding/json"

	"roci.dev/replicache-client/db"

	jsnoms "roci.dev/diff-server/util/noms/json"
)

type getRootRequest struct {
}

type getRootResponse struct {
	Root jsnoms.Hash `json:"root"`
}

type hasRequest struct {
	transactionRequest
	Key string `json:"key"`
}

type hasResponse struct {
	Has bool `json:"has"`
}

type getRequest struct {
	transactionRequest
	Key string `json:"key"`
}

type getResponse struct {
	Has   bool            `json:"has"`
	Value json.RawMessage `json:"value,omitempty"`
}

type scanRequest struct {
	transactionRequest
	db.ScanOptions
}

type scanResponse []db.ScanItem

type scanItem struct {
	Key   string       `json:"key"`
	Value jsnoms.Value `json:"value"`
}

type putRequest struct {
	transactionRequest
	Key   string          `json:"key"`
	Value json.RawMessage `json:"value"`
}

type putResponse struct{}

type delRequest struct {
	transactionRequest
	Key string `json:"key"`
}

type delResponse struct {
	Ok bool `json:"ok"`
}

type beginSyncRequest struct {
	BatchPushURL   string `json:"batchPushURL"`
	DataLayerAuth  string `json:"dataLayerAuth"`
	DiffServerURL  string `json:"diffServerURL"`
	DiffServerAuth string `json:"diffServerAuth"`
}

type beginSyncResponse struct {
	SyncHead jsnoms.Hash `json:"syncHead"`
	SyncInfo db.SyncInfo `json:"syncInfo"`
}

type maybeEndSyncRequest struct {
	SyncID   string       `json:"syncID,omitempty"`
	SyncHead *jsnoms.Hash `json:"syncHead,omitempty"`
}

// Sync is complete when there are zero replay mutations and
// no error (returned separately by the api).
type maybeEndSyncResponse struct {
	ReplayMutations []db.ReplayMutation `json:"replayMutations,omitempty"`
}

type openTransactionRequest struct {
	Name       string          `json:"name,omitempty"`
	Args       json.RawMessage `json:"args,omitempty"`
	RebaseOpts rebaseOpts      `json:"rebaseOpts,omitempty"`
}

type rebaseOpts struct {
	Basis    *jsnoms.Hash `json:"basis"`
	Original *jsnoms.Hash `json:"original"`
}

type openTransactionResponse struct {
	TransactionID int `json:"transactionId"`
}

type transactionRequest struct {
	TransactionID int `json:"transactionId"`
}

type closeTransactionRequest transactionRequest

type closeTransactionResponse struct {
}

type commitTransactionRequest transactionRequest

type commitTransactionResponse struct {
	Ref *jsnoms.Hash `json:"ref,omitempty"`
}
