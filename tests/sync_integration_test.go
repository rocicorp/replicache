package tests

import (
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"
	diffserve "roci.dev/diff-server/serve"
	servetypes "roci.dev/diff-server/serve/types"
	jsnoms "roci.dev/diff-server/util/noms/json"
	"roci.dev/replicache-client/db"
)

// Logger allows client to optionally provide a place to send repc's log messages.
type Logger interface {
	io.Writer
}

func Init(storageDir, tempDir string, logger Logger) {}

func deinit() {}

// dataLayer is a simple in-proceess data layer. It implements a single
// mutation 'myPut' which sets a key to a value.
// dataLayer is NOT safe for concurrent access.
type dataLayer struct {
	stores           map[string]*store // keyed by clientID
	authTokens       map[string]string // keyed by clientID
	batchServer      *httptest.Server
	clientViewServer *httptest.Server
}

// store is the data for a single client.
type store struct {
	lastMutationID uint64
	data           map[string]json.RawMessage
}

// newDataLayer returns a new dataLayer. Caller must call stop() to clean up.
func newDataLayer() *dataLayer {
	d := &dataLayer{stores: map[string]*store{}, authTokens: map[string]string{}}
	d.batchServer = httptest.NewServer(http.HandlerFunc(d.push))
	d.clientViewServer = httptest.NewServer(http.HandlerFunc(d.clientView))
	return d
}

func (d *dataLayer) stop() {
	d.batchServer.Close()
	d.clientViewServer.Close()
}

func (d *dataLayer) getStore(clientID string) *store {
	s := d.stores[clientID]
	if s != nil {
		return s
	}
	s = &store{0, make(map[string]json.RawMessage)}
	d.stores[clientID] = s
	return s
}

func (d *dataLayer) setAuthToken(clientID, authToken string) {
	d.authTokens[clientID] = authToken
}

func (d dataLayer) auth(clientID, authToken string) bool {
	return d.authTokens[clientID] == authToken
}

// push implements the batch push endpoint. It treats any error encountered while
// processing a mutation as permanent.
func (d *dataLayer) push(w http.ResponseWriter, r *http.Request) {
	var req db.BatchPushRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil || req.ClientID == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	if !d.auth(req.ClientID, r.Header.Get("Authorization")) {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	s := d.getStore(req.ClientID)

	var resp db.BatchPushResponse
	for _, m := range req.Mutations {
		if m.ID <= s.lastMutationID {
			resp.MutationInfos = append(resp.MutationInfos, db.MutationInfo{ID: m.ID, Error: fmt.Sprintf("skipping this mutation: ID is less than %d", s.lastMutationID)})
			continue
		}
		s.lastMutationID = m.ID

		switch m.Name {
		case "myPut":
			var args myPutArgs
			err := json.Unmarshal(m.Args, &args)
			if err != nil {
				resp.MutationInfos = append(resp.MutationInfos, db.MutationInfo{ID: m.ID, Error: fmt.Sprintf("skipping this mutation: couldn't unmarshal putArgs: %s", err.Error())})
				continue
			}
			if len(args.Value) == 0 {
				resp.MutationInfos = append(resp.MutationInfos, db.MutationInfo{ID: m.ID, Error: fmt.Sprintf("skipping this mutation: value must be non-empty")})
			} else {
				s.data[args.Key] = args.Value
			}
		default:
			resp.MutationInfos = append(resp.MutationInfos, db.MutationInfo{ID: m.ID, Error: fmt.Sprintf("skipping this mutation: mutation '%s' not supported", m.Name)})
		}
	}

	b, err := json.Marshal(resp)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.Write(b)
	return
}

// change is used by tests to change a client's data behind its back.
func (d *dataLayer) change(clientID string, key string, value json.RawMessage) {
	s := d.getStore(clientID)
	s.data[key] = value
}

type myPutArgs struct {
	Key   string          `json:"key"`
	Value json.RawMessage `json:"value"`
}

func (d *dataLayer) clientView(w http.ResponseWriter, r *http.Request) {
	var req servetypes.ClientViewRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil || req.ClientID == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	if !d.auth(req.ClientID, r.Header.Get("Authorization")) {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	s := d.getStore(req.ClientID)

	var resp servetypes.ClientViewResponse
	resp.LastMutationID = s.lastMutationID
	resp.ClientView = make(map[string]json.RawMessage)
	for k, v := range s.data {
		resp.ClientView[k] = v
	}

	b, err := json.Marshal(resp)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.Write(b)
	return
}

// testEnv is an integration test environment. Careful: repm.connections[] is
// a global resource so we need to be sure to call deinit() and not attempt to
// run tests in parallel.
type testEnv struct {
	dbName         string
	api            api
	dataLayer      *dataLayer
	batchPushURL   string
	clientViewURL  string
	account        diffserve.Account
	diffServer     *httptest.Server
	diffServerURL  string
	diffServerAuth string
	teardowns      []func()
}

func (t testEnv) teardown() {
	for _, f := range t.teardowns {
		f()
	}
	deinit()
}

func newTestEnv(assert *assert.Assertions) testEnv {
	env := testEnv{dbName: "mem"}

	// Client
	clientDir, err := ioutil.TempDir("", "")
	Init(clientDir, "", nil)
	ret, err := Dispatch(env.dbName, "open", nil)
	assert.Nil(ret)
	assert.NoError(err)
	env.api = api{dbName: env.dbName, assert: assert}

	// Data layer
	env.dataLayer = newDataLayer()
	env.teardowns = append(env.teardowns, env.dataLayer.stop)
	env.batchPushURL = env.dataLayer.batchServer.URL
	env.clientViewURL = env.dataLayer.clientViewServer.URL

	// Diff server
	diffDir, _ := ioutil.TempDir("", "")
	accounts := []diffserve.Account{{ID: "accountid", Name: "Integration Test", Pubkey: nil, ClientViewURL: env.clientViewURL}}
	env.account = accounts[0]
	diffService := diffserve.NewService(diffDir, accounts, "", diffserve.ClientViewGetter{}, false)
	mux := mux.NewRouter()
	diffserve.RegisterHandlers(diffService, mux)
	diffServer := httptest.NewServer(mux)
	env.diffServer = diffServer
	env.diffServerURL = fmt.Sprintf("%s/pull", env.diffServer.URL)
	env.diffServerAuth = "accountid"
	env.teardowns = append(env.teardowns, diffServer.Close)

	return env
}

// myPut is the local (customer app) implementation of the myPut mutation.
// rebaseOpts is optional.
func myPut(a api, key string, value json.RawMessage, rebaseOpts *rebaseOpts) commitTransactionResponse {
	putArgs := myPutArgs{Key: key, Value: value}
	otr := a.openTransaction("myPut", a.marshal(putArgs), rebaseOpts)
	putReq := putRequest{transactionRequest: transactionRequest{TransactionID: otr.TransactionID}, Key: key, Value: value}
	_, err := Dispatch(a.dbName, "put", a.marshal(putReq))
	a.assert.NoError(err)
	ctr := a.commitTransaction(otr.TransactionID)
	return ctr
}

// api calls the repm API.
type api struct {
	dbName string
	assert *assert.Assertions
}

func (a api) getRoot() getRootResponse {
	req := getRequest{}
	b, err := Dispatch(a.dbName, "getRoot", a.marshal(req))
	a.assert.NoError(err)
	a.assert.NotNil(b)
	var res getRootResponse
	a.unmarshal(b, &res)
	return res
}

func (a api) get(key string) getResponse {
	otr := a.openTransaction("", nil, nil)
	req := getRequest{transactionRequest: transactionRequest{TransactionID: otr.TransactionID}, Key: key}
	b, err := Dispatch(a.dbName, "get", a.marshal(req))
	a.assert.NoError(err)
	a.assert.NotNil(b)
	a.closeTransaction(otr.TransactionID)
	var res getResponse
	a.unmarshal(b, &res)
	return res
}

func (a api) openTransaction(name string, args json.RawMessage, rebaseOpts *rebaseOpts) openTransactionResponse {
	req := openTransactionRequest{Name: name, Args: args}
	if rebaseOpts != nil {
		req.RebaseOpts = *rebaseOpts
	}
	b, err := Dispatch(a.dbName, "openTransaction", a.marshal(req))
	a.assert.NoError(err)
	var res openTransactionResponse
	a.unmarshal(b, &res)
	return res
}

func (a api) commitTransaction(txID int) commitTransactionResponse {
	req := commitTransactionRequest{TransactionID: txID}
	b, err := Dispatch(a.dbName, "commitTransaction", a.marshal(req))
	a.assert.NoError(err)
	var res commitTransactionResponse
	a.unmarshal(b, &res)
	return res
}

func (a api) closeTransaction(txID int) {
	req := closeTransactionRequest{TransactionID: txID}
	_, err := Dispatch(a.dbName, "closeTransaction", a.marshal(req))
	a.assert.NoError(err)
	return
}

func (a api) beginSync(batchPushURL, dataLayerAuth, diffServerURL, diffServerAuth string) (beginSyncResponse, error) {
	req := beginSyncRequest{batchPushURL, dataLayerAuth, diffServerURL, diffServerAuth}
	b, err := Dispatch(a.dbName, "beginSync", a.marshal(req))
	if err != nil {
		return beginSyncResponse{}, err
	}
	var res beginSyncResponse
	a.unmarshal(b, &res)
	return res, nil
}

func (a api) maybeEndSync(syncHead *jsnoms.Hash) maybeEndSyncResponse {
	req := maybeEndSyncRequest{SyncHead: syncHead}
	b, err := Dispatch(a.dbName, "maybeEndSync", a.marshal(req))
	a.assert.NoError(err)
	a.assert.NotNil(b)
	var res maybeEndSyncResponse
	a.unmarshal(b, &res)
	return res
}

// maybeReplayMutations is the "bindings" implementation of replay, called after maybeEndSync.
// It returns the new sync head and how many mutations were replayed.
func maybeReplayMutations(a api, syncHead *jsnoms.Hash, m maybeEndSyncResponse) (*jsnoms.Hash, int) {
	numReplayed := 0
	for _, m := range m.ReplayMutations {
		a.assert.Equal("myPut", m.Name)
		var args myPutArgs
		a.unmarshal(m.Args, &args)
		rebaseOpts := &rebaseOpts{Basis: syncHead, Original: m.Original}
		res := myPut(a, args.Key, args.Value, rebaseOpts)
		syncHead = res.Ref
		numReplayed++
	}
	return syncHead, numReplayed
}

func (a api) marshal(v interface{}) []byte {
	m, err := json.Marshal(v)
	a.assert.NoError(err)
	return m
}

func (a api) unmarshal(m []byte, v interface{}) {
	a.assert.NoError(json.Unmarshal(m, v))
	return
}

func (a api) clientID() string {
	// TODO(nate): Figure out how to simulate this correctly.
	// return connections[a.dbName].db.ClientID()
	return ""
}

func TestNopRoundTrip(t *testing.T) {
	assert := assert.New(t)
	env := newTestEnv(assert)
	defer env.teardown()
	api := env.api
	dataLayerAuth := "opensaysme"
	env.dataLayer.setAuthToken(api.clientID(), dataLayerAuth)

	getRootResponse := api.getRoot()
	head := getRootResponse.Root.Hash

	// We expect a new snapshot on the first sync because there is no snapshot on master
	// and thus no server state id.
	beingSyncResponse, err := api.beginSync(env.batchPushURL, dataLayerAuth, env.diffServerURL, env.diffServerAuth)
	assert.NoError(err)
	maybeEndSyncResponse := api.maybeEndSync(&beingSyncResponse.SyncHead)
	assert.Equal(0, len(maybeEndSyncResponse.ReplayMutations))
	getRootResponse = api.getRoot()
	secondHead := getRootResponse.Root.Hash
	assert.NotEqual(head, secondHead)

	// We do not expect a new snapshot on subsequent syncs.
	_, err = api.beginSync(env.batchPushURL, dataLayerAuth, env.diffServerURL, env.diffServerAuth)
	assert.NoError(err)
	getRootResponse = api.getRoot()
	thirdHead := getRootResponse.Root.Hash
	assert.Equal(secondHead, thirdHead)
}

func TestRoundTrip(t *testing.T) {
	assert := assert.New(t)
	env := newTestEnv(assert)
	defer env.teardown()
	api := env.api
	dataLayerAuth := "opensaysme"
	env.dataLayer.setAuthToken(api.clientID(), dataLayerAuth)

	myPut(api, "key", []byte("true"), nil)
	getRootResponse := api.getRoot()
	head := getRootResponse.Root.Hash
	beingSyncResponse, err := api.beginSync(env.batchPushURL, dataLayerAuth, env.diffServerURL, env.diffServerAuth)
	assert.NoError(err)
	maybeEndSyncResponse := api.maybeEndSync(&beingSyncResponse.SyncHead)
	assert.Equal(0, len(maybeEndSyncResponse.ReplayMutations))
	getResponse := api.get("key")
	assert.True(getResponse.Has)
	assert.Equal(json.RawMessage([]byte("true")), getResponse.Value)
	getRootResponse = api.getRoot()
	newHead := getRootResponse.Root.Hash
	assert.NotEqual(head, newHead)
}

func TestPull(t *testing.T) {
	assert := assert.New(t)
	env := newTestEnv(assert)
	defer env.teardown()
	api := env.api
	dataLayerAuth := "opensaysme"
	env.dataLayer.setAuthToken(api.clientID(), dataLayerAuth)

	getResponse := api.get("key")
	assert.False(getResponse.Has)
	env.dataLayer.change(api.clientID(), "key", []byte("true"))
	beginSyncResponse, err := api.beginSync(env.batchPushURL, dataLayerAuth, env.diffServerURL, env.diffServerAuth)
	assert.NoError(err)
	maybeEndSyncResponse := api.maybeEndSync(&beginSyncResponse.SyncHead)
	assert.Equal(0, len(maybeEndSyncResponse.ReplayMutations))
	getResponse = api.get("key")
	assert.True(getResponse.Has)
	assert.Equal(json.RawMessage([]byte("true")), getResponse.Value)
}

func TestReplay(t *testing.T) {
	assert := assert.New(t)
	env := newTestEnv(assert)
	defer env.teardown()
	api := env.api
	dataLayerAuth := "opensaysme"
	env.dataLayer.setAuthToken(api.clientID(), dataLayerAuth)

	myPut(api, "key1", []byte(`"expected"`), nil)
	myPut(api, "key2", []byte(`"will be replaced"`), nil)
	beginSyncResponse, err := api.beginSync(env.batchPushURL, dataLayerAuth, env.diffServerURL, env.diffServerAuth)
	assert.NoError(err)
	// The three transactions from this point forward will end up as pending after sync completes.
	myPut(api, "key2", []byte(`"expected"`), nil)
	myPut(api, "key3", []byte(`"will be replaced"`), nil)
	maybeEndSyncResponse := api.maybeEndSync(&beginSyncResponse.SyncHead)
	assert.Equal(2, len(maybeEndSyncResponse.ReplayMutations))
	syncHead, numReplayed := maybeReplayMutations(api, &beginSyncResponse.SyncHead, maybeEndSyncResponse)
	assert.Equal(2, numReplayed)
	myPut(api, "key3", []byte(`"expected"`), nil)
	maybeEndSyncResponse = api.maybeEndSync(syncHead)
	assert.Equal(1, len(maybeEndSyncResponse.ReplayMutations))
	syncHead, numReplayed = maybeReplayMutations(api, syncHead, maybeEndSyncResponse)
	assert.Equal(1, numReplayed)
	maybeEndSyncResponse = api.maybeEndSync(syncHead)
	assert.Equal(0, len(maybeEndSyncResponse.ReplayMutations))
	for _, k := range []string{"key1", "key2", "key3"} {
		getResponse := api.get(k)
		assert.True(getResponse.Has)
		assert.Equal(json.RawMessage([]byte(`"expected"`)), getResponse.Value)
	}

	// At this point there are three mutations pending, which now get pushed upstream.
	beginSyncResponse, err = api.beginSync(env.batchPushURL, dataLayerAuth, env.diffServerURL, env.diffServerAuth)
	assert.NoError(err)
	maybeEndSyncResponse = api.maybeEndSync(&beginSyncResponse.SyncHead)
	assert.Equal(0, len(maybeEndSyncResponse.ReplayMutations))
	for _, k := range []string{"key1", "key2", "key3"} {
		getResponse := api.get(k)
		assert.True(getResponse.Has)
		assert.Equal(json.RawMessage([]byte(`"expected"`)), getResponse.Value)
	}

	// Now there is nothing left to do.
	beginSyncResponse, err = api.beginSync(env.batchPushURL, dataLayerAuth, env.diffServerURL, env.diffServerAuth)
	assert.NoError(err)
}
