import {
  initReplicacheTesting,
  replicacheForTesting,
  tickAFewTimes,
  dbsToDrop,
  clock,
} from './test-util';
import {makeIdbName, REPLICACHE_FORMAT_VERSION} from './replicache';
import {addGenesis, addLocal, addSnapshot, Chain} from './db/test-helpers';
import type * as db from './db/mod';
import * as dag from './dag/mod';
import * as persist from './persist/mod';
import * as kv from './kv/mod';
import type * as sync from './sync/mod';
import {assertHash, assertNotTempHash, makeNewTempHashFunction} from './hash';
import {assertNotUndefined} from './asserts';
import {expect} from '@esm-bundle/chai';
import {uuid} from './sync/uuid';
import {assertJSONObject, JSONObject, ReadonlyJSONObject} from './json';
import sinon from 'sinon';

// fetch-mock has invalid d.ts file so we removed that on npm install.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import fetchMock from 'fetch-mock/esm/client';

initReplicacheTesting();

const dagsToClose: dag.Store[] = [];
let idbDatabases: persist.IDBDatabasesStore;
setup(async () => {
  idbDatabases = new persist.IDBDatabasesStore();
  await idbDatabases.clear();
});

teardown(async () => {
  for (const dagToClose of dagsToClose) {
    await dagToClose.close();
  }
  dagsToClose.length = 0;
  await idbDatabases.close();
  sinon.restore();
});

async function createPerdag(args: {
  replicacheName: string;
  schemaVersion: string;
}): Promise<dag.Store> {
  const {replicacheName, schemaVersion} = args;
  const idbName = makeIdbName(replicacheName, schemaVersion);
  dbsToDrop.add(idbName);
  const idb = new kv.IDBStore(idbName);
  await idbDatabases.putDatabase({
    name: idbName,
    replicacheName,
    schemaVersion,
    replicacheFormatVersion: REPLICACHE_FORMAT_VERSION,
  });
  const perdag = new dag.StoreImpl(
    idb,
    dag.throwChunkHasher,
    assertNotTempHash,
  );
  dagsToClose.push(perdag);
  return perdag;
}

async function createAndPersistClientWithPendingLocal(
  clientID: sync.ClientID,
  perdag: dag.Store,
  numLocal: number,
): Promise<db.LocalMeta[]> {
  const testMemdag = new dag.TestStore(
    undefined,
    makeNewTempHashFunction(),
    assertHash,
  );
  const chain: Chain = [];
  await addGenesis(chain, testMemdag);
  await addSnapshot(chain, testMemdag, [['unique', uuid()]]);

  const localMetas: db.LocalMeta[] = [];
  for (let i = 0; i < numLocal; i++) {
    await addLocal(chain, testMemdag);
    localMetas.push(chain[chain.length - 1].meta as db.LocalMeta);
  }
  await persist.persist(clientID, testMemdag, perdag);
  return localMetas;
}

function createPushBody(
  client1ID: string,
  localMetas: db.LocalMeta[],
  schemaVersion: string,
): ReadonlyJSONObject {
  return {
    clientID: client1ID,
    mutations: localMetas.map(localMeta => ({
      id: localMeta.mutationID,
      name: localMeta.mutatorName,
      args: localMeta.mutatorArgsJSON,
      timestamp: localMeta.timestamp,
    })),
    pushVersion: 0,
    schemaVersion,
  };
}

async function testRecoveringMutationsOfClient(args: {
  schemaVersionOfClientWPendingMutations: string;
  schemaVersionOfClientRecoveringMutations: string;
  numMutationsNotAcknowledgedByPull?: number;
}) {
  const {
    schemaVersionOfClientWPendingMutations,
    schemaVersionOfClientRecoveringMutations,
    numMutationsNotAcknowledgedByPull,
  } = {
    numMutationsNotAcknowledgedByPull: 0,
    ...args,
  };
  const client1ID = 'client1';
  const replicacheName = `recoverMutations${schemaVersionOfClientRecoveringMutations}recovering${schemaVersionOfClientWPendingMutations}`;
  const auth = '1';
  const pushURL = 'https://test.replicache.dev/push';
  const pullURL = 'https://test.replicache.dev/pull';
  const rep = await replicacheForTesting(replicacheName, {
    auth,
    schemaVersion: schemaVersionOfClientRecoveringMutations,
    pushURL,
    pullURL,
  });

  await tickAFewTimes();

  const testPerdag = await createPerdag({
    replicacheName,
    schemaVersion: schemaVersionOfClientWPendingMutations,
  });

  const client1PendingLocalMetas = await createAndPersistClientWithPendingLocal(
    client1ID,
    testPerdag,
    2,
  );
  const client1 = await testPerdag.withRead(read =>
    persist.getClient(client1ID, read),
  );
  assertNotUndefined(client1);

  fetchMock.reset();
  fetchMock.post(pushURL, 'ok');
  const pullLastMutationID =
    client1.mutationID - numMutationsNotAcknowledgedByPull;
  fetchMock.post(pullURL, {
    cookie: 'pull_cookie_1',
    lastMutationID: pullLastMutationID,
    patch: [],
  });

  await rep.recoverMutations();

  const pushCalls = fetchMock.calls(pushURL);
  expect(pushCalls.length).to.equal(1);
  expect(await pushCalls[0].request.json()).to.deep.equal({
    clientID: client1ID,
    mutations: [
      {
        id: client1PendingLocalMetas[0].mutationID,
        name: client1PendingLocalMetas[0].mutatorName,
        args: client1PendingLocalMetas[0].mutatorArgsJSON,
        timestamp: client1PendingLocalMetas[0].timestamp,
      },
      {
        id: client1PendingLocalMetas[1].mutationID,
        name: client1PendingLocalMetas[1].mutatorName,
        args: client1PendingLocalMetas[1].mutatorArgsJSON,
        timestamp: client1PendingLocalMetas[1].timestamp,
      },
    ],
    pushVersion: 0,
    schemaVersion: schemaVersionOfClientWPendingMutations,
  });

  const pullCalls = fetchMock.calls(pullURL);
  expect(pullCalls.length).to.equal(1);
  expect(await pullCalls[0].request.json()).to.deep.equal({
    clientID: client1ID,
    schemaVersion: schemaVersionOfClientWPendingMutations,
    cookie: 'cookie_1',
    lastMutationID: client1.lastServerAckdMutationID,
    pullVersion: 0,
  });

  const updatedClient1 = await testPerdag.withRead(read =>
    persist.getClient(client1ID, read),
  );
  assertNotUndefined(updatedClient1);
  expect(updatedClient1.mutationID).to.equal(client1.mutationID);
  expect(updatedClient1.lastServerAckdMutationID).to.equal(pullLastMutationID);
  expect(updatedClient1.headHash).to.equal(client1.headHash);
}

test('successfully recovering mutations of client with same schema version and replicache format version', async () => {
  await testRecoveringMutationsOfClient({
    schemaVersionOfClientWPendingMutations: 'testSchema1',
    schemaVersionOfClientRecoveringMutations: 'testSchema1',
  });
});

test('successfully recovering mutations of client with different schema version but same replicache format version', async () => {
  await testRecoveringMutationsOfClient({
    schemaVersionOfClientWPendingMutations: 'testSchema1',
    schemaVersionOfClientRecoveringMutations: 'testSchema2',
  });
});

test('successfully recovering some but not all mutations of another client (pull does not acknowledge all)', async () => {
  await testRecoveringMutationsOfClient({
    schemaVersionOfClientWPendingMutations: 'testSchema1',
    schemaVersionOfClientRecoveringMutations: 'testSchema1',
    numMutationsNotAcknowledgedByPull: 1,
  });
});

test('client does not attempt to recover mutations from IndexedDB with different replicache name', async () => {
  const clientWPendingMutationsID = 'client1';
  const schemaVersion = 'testSchema';
  const replicacheNameOfClientWPendingMutations = 'diffName-pendingClient';
  const replicacheNameOfClientRecoveringMutations = 'diffName-recoveringClient';

  const auth = '1';
  const pushURL = 'https://test.replicache.dev/push';
  const pullURL = 'https://test.replicache.dev/pull';
  const rep = await replicacheForTesting(
    replicacheNameOfClientRecoveringMutations,
    {
      auth,
      schemaVersion,
      pushURL,
      pullURL,
    },
  );

  await tickAFewTimes();

  const testPerdag = await createPerdag({
    replicacheName: replicacheNameOfClientWPendingMutations,
    schemaVersion,
  });

  await createAndPersistClientWithPendingLocal(
    clientWPendingMutationsID,
    testPerdag,
    2,
  );
  const clientWPendingMutations = await testPerdag.withRead(read =>
    persist.getClient(clientWPendingMutationsID, read),
  );
  assertNotUndefined(clientWPendingMutations);

  fetchMock.reset();
  fetchMock.post(pushURL, 'ok');
  fetchMock.post(pullURL, {
    cookie: 'pull_cookie_1',
    lastMutationID: clientWPendingMutations.mutationID,
    patch: [],
  });

  await rep.recoverMutations();

  //
  expect(fetchMock.calls(pushURL).length).to.equal(0);
  expect(fetchMock.calls(pullURL).length).to.equal(0);
});

test('successfully recovering mutations of multiple clients with mix of schema versions and same replicache format version', async () => {
  const schemaVersionOfClients1Thru3AndClientRecoveringMutations =
    'testSchema1';
  const schemaVersionOfClient4 = 'testSchema2';
  // client1 has same schema version as recovering client and 2 mutations to recover
  const client1ID = 'client1';
  // client2 has same schema version as recovering client and no mutations to recover
  const client2ID = 'client2';
  // client3 has same schema version as recovering client and 1 mutation to recover
  const client3ID = 'client3';
  // client4 has different schema version than recovering client and 2 mutations to recover
  const client4ID = 'client4';
  const replicacheName = 'recoverMutationsMix';
  const auth = '1';
  const pushURL = 'https://test.replicache.dev/push';
  const pullURL = 'https://test.replicache.dev/pull';
  const rep = await replicacheForTesting(replicacheName, {
    auth,
    schemaVersion: schemaVersionOfClients1Thru3AndClientRecoveringMutations,
    pushURL,
    pullURL,
  });

  await tickAFewTimes();

  const testPerdagForClients1Thru3 = await createPerdag({
    replicacheName,
    schemaVersion: schemaVersionOfClients1Thru3AndClientRecoveringMutations,
  });

  const client1PendingLocalMetas = await createAndPersistClientWithPendingLocal(
    client1ID,
    testPerdagForClients1Thru3,
    2,
  );
  const client2PendingLocalMetas = await createAndPersistClientWithPendingLocal(
    client2ID,
    testPerdagForClients1Thru3,
    0,
  );
  expect(client2PendingLocalMetas.length).to.equal(0);
  const client3PendingLocalMetas = await createAndPersistClientWithPendingLocal(
    client3ID,
    testPerdagForClients1Thru3,
    1,
  );

  const testPerdagForClient4 = await createPerdag({
    replicacheName,
    schemaVersion: schemaVersionOfClient4,
  });
  const client4PendingLocalMetas = await createAndPersistClientWithPendingLocal(
    client4ID,
    testPerdagForClient4,
    2,
  );

  const clients1Thru3 = await testPerdagForClients1Thru3.withRead(read =>
    persist.getClients(read),
  );
  const client1 = clients1Thru3.get(client1ID);
  assertNotUndefined(client1);
  const client2 = clients1Thru3.get(client2ID);
  assertNotUndefined(client2);
  const client3 = clients1Thru3.get(client3ID);
  assertNotUndefined(client3);

  const client4 = await testPerdagForClient4.withRead(read =>
    persist.getClient(client4ID, read),
  );
  assertNotUndefined(client4);

  const pullRequestJsonBodies: JSONObject[] = [];
  fetchMock.reset();
  fetchMock.post(pushURL, 'ok');
  fetchMock.post(
    pullURL,
    async (_url: string, _options: RequestInit, request: Request) => {
      const requestJson = await request.json();
      assertJSONObject(requestJson);
      pullRequestJsonBodies.push(requestJson);
      const {clientID} = requestJson;
      switch (clientID) {
        case client1ID:
          return {
            cookie: 'pull_cookie_1',
            lastMutationID: client1.mutationID,
            patch: [],
          };
        case client3ID:
          return {
            cookie: 'pull_cookie_3',
            lastMutationID: client3.mutationID,
            patch: [],
          };
        case client4ID:
          return {
            cookie: 'pull_cookie_4',
            lastMutationID: client4.mutationID,
            patch: [],
          };
        default:
          throw new Error(`Unexpected pull ${requestJson}`);
      }
    },
  );

  await rep.recoverMutations();

  const pushCalls = fetchMock.calls(pushURL);
  expect(pushCalls.length).to.equal(3);
  expect(await pushCalls[0].request.json()).to.deep.equal(
    createPushBody(
      client1ID,
      client1PendingLocalMetas,
      schemaVersionOfClients1Thru3AndClientRecoveringMutations,
    ),
  );
  expect(await pushCalls[1].request.json()).to.deep.equal(
    createPushBody(
      client3ID,
      client3PendingLocalMetas,
      schemaVersionOfClients1Thru3AndClientRecoveringMutations,
    ),
  );
  expect(await pushCalls[2].request.json()).to.deep.equal(
    createPushBody(client4ID, client4PendingLocalMetas, schemaVersionOfClient4),
  );

  expect(pullRequestJsonBodies.length).to.equal(3);
  expect(pullRequestJsonBodies[0]).to.deep.equal({
    clientID: client1ID,
    schemaVersion: schemaVersionOfClients1Thru3AndClientRecoveringMutations,
    cookie: 'cookie_1',
    lastMutationID: client1.lastServerAckdMutationID,
    pullVersion: 0,
  });
  expect(pullRequestJsonBodies[1]).to.deep.equal({
    clientID: client3ID,
    schemaVersion: schemaVersionOfClients1Thru3AndClientRecoveringMutations,
    cookie: 'cookie_1',
    lastMutationID: client3.lastServerAckdMutationID,
    pullVersion: 0,
  });
  expect(pullRequestJsonBodies[2]).to.deep.equal({
    clientID: client4ID,
    schemaVersion: schemaVersionOfClient4,
    cookie: 'cookie_1',
    lastMutationID: client4.lastServerAckdMutationID,
    pullVersion: 0,
  });

  const updateClients1Thru3 = await testPerdagForClients1Thru3.withRead(read =>
    persist.getClients(read),
  );
  const updatedClient1 = updateClients1Thru3.get(client1ID);
  assertNotUndefined(updatedClient1);
  const updatedClient2 = updateClients1Thru3.get(client2ID);
  assertNotUndefined(updatedClient2);
  const updatedClient3 = updateClients1Thru3.get(client3ID);
  assertNotUndefined(updatedClient3);

  const updatedClient4 = await testPerdagForClient4.withRead(read =>
    persist.getClient(client4ID, read),
  );
  assertNotUndefined(updatedClient4);

  expect(updatedClient1.mutationID).to.equal(client1.mutationID);
  // lastServerAckdMutationID is updated to high mutationID as mutations
  // were recovered
  expect(updatedClient1.lastServerAckdMutationID).to.equal(client1.mutationID);
  expect(updatedClient1.headHash).to.equal(client1.headHash);

  expect(updatedClient2.mutationID).to.equal(client2.mutationID);
  expect(updatedClient2.lastServerAckdMutationID).to.equal(
    client2.lastServerAckdMutationID,
  );
  expect(updatedClient2.headHash).to.equal(client2.headHash);

  expect(updatedClient3.mutationID).to.equal(client3.mutationID);
  // lastServerAckdMutationID is updated to high mutationID as mutations
  // were recovered
  expect(updatedClient3.lastServerAckdMutationID).to.equal(client3.mutationID);
  expect(updatedClient3.headHash).to.equal(client3.headHash);

  expect(updatedClient4.mutationID).to.equal(client4.mutationID);
  // lastServerAckdMutationID is updated to high mutationID as mutations
  // were recovered
  expect(updatedClient4.lastServerAckdMutationID).to.equal(client4.mutationID);
  expect(updatedClient4.headHash).to.equal(client4.headHash);
});

test('if a push error occurs, continues to try to recover other clients', async () => {
  const schemaVersion = 'testSchema1';
  // client1 has same schema version as recovering client and 2 mutations to recover
  const client1ID = 'client1';
  // client2 has same schema version as recovering client and 1 mutation to recover
  const client2ID = 'client2';
  // client3 has same schema version as recovering client and 1 mutation to recover
  const client3ID = 'client3';
  const replicacheName = 'recoverMutationsRobustToPushError';
  const auth = '1';
  const pushURL = 'https://test.replicache.dev/push';
  const pullURL = 'https://test.replicache.dev/pull';
  const rep = await replicacheForTesting(replicacheName, {
    auth,
    schemaVersion,
    pushURL,
    pullURL,
  });

  await tickAFewTimes();

  const testPerdag = await createPerdag({
    replicacheName,
    schemaVersion,
  });

  const client1PendingLocalMetas = await createAndPersistClientWithPendingLocal(
    client1ID,
    testPerdag,
    2,
  );
  const client2PendingLocalMetas = await createAndPersistClientWithPendingLocal(
    client2ID,
    testPerdag,
    1,
  );
  const client3PendingLocalMetas = await createAndPersistClientWithPendingLocal(
    client3ID,
    testPerdag,
    1,
  );

  const clients = await testPerdag.withRead(read => persist.getClients(read));
  const client1 = clients.get(client1ID);
  assertNotUndefined(client1);
  const client2 = clients.get(client2ID);
  assertNotUndefined(client2);
  const client3 = clients.get(client3ID);
  assertNotUndefined(client3);

  const pushRequestJsonBodies: JSONObject[] = [];
  const pullRequestJsonBodies: JSONObject[] = [];
  fetchMock.reset();
  fetchMock.post(
    pushURL,
    async (_url: string, _options: RequestInit, request: Request) => {
      const requestJson = await request.json();
      assertJSONObject(requestJson);
      pushRequestJsonBodies.push(requestJson);
      const {clientID} = requestJson;
      if (clientID === client2ID) {
        throw new Error('test error in push');
      } else {
        return 'ok';
      }
    },
  );
  fetchMock.post(
    pullURL,
    async (_url: string, _options: RequestInit, request: Request) => {
      const requestJson = await request.json();
      assertJSONObject(requestJson);
      pullRequestJsonBodies.push(requestJson);
      const {clientID} = requestJson;
      switch (clientID) {
        case client1ID:
          return {
            cookie: 'pull_cookie_1',
            lastMutationID: client1.mutationID,
            patch: [],
          };
        case client3ID:
          return {
            cookie: 'pull_cookie_3',
            lastMutationID: client3.mutationID,
            patch: [],
          };
        default:
          throw new Error(`Unexpected pull ${requestJson}`);
      }
    },
  );

  await rep.recoverMutations();

  expect(pushRequestJsonBodies.length).to.equal(3);
  expect(await pushRequestJsonBodies[0]).to.deep.equal(
    createPushBody(client1ID, client1PendingLocalMetas, schemaVersion),
  );
  expect(await pushRequestJsonBodies[1]).to.deep.equal(
    createPushBody(client2ID, client2PendingLocalMetas, schemaVersion),
  );
  expect(await pushRequestJsonBodies[2]).to.deep.equal(
    createPushBody(client3ID, client3PendingLocalMetas, schemaVersion),
  );

  expect(pullRequestJsonBodies.length).to.equal(2);
  expect(pullRequestJsonBodies[0]).to.deep.equal({
    clientID: client1ID,
    schemaVersion,
    cookie: 'cookie_1',
    lastMutationID: client1.lastServerAckdMutationID,
    pullVersion: 0,
  });
  expect(pullRequestJsonBodies[1]).to.deep.equal({
    clientID: client3ID,
    schemaVersion,
    cookie: 'cookie_1',
    lastMutationID: client3.lastServerAckdMutationID,
    pullVersion: 0,
  });

  const updateClients = await testPerdag.withRead(read =>
    persist.getClients(read),
  );
  const updatedClient1 = updateClients.get(client1ID);
  assertNotUndefined(updatedClient1);
  const updatedClient2 = updateClients.get(client2ID);
  assertNotUndefined(updatedClient2);
  const updatedClient3 = updateClients.get(client3ID);
  assertNotUndefined(updatedClient3);

  expect(updatedClient1.mutationID).to.equal(client1.mutationID);
  // lastServerAckdMutationID is updated to high mutationID as mutations
  // were recovered
  expect(updatedClient1.lastServerAckdMutationID).to.equal(client1.mutationID);
  expect(updatedClient1.headHash).to.equal(client1.headHash);

  expect(updatedClient2.mutationID).to.equal(client2.mutationID);
  // lastServerAckdMutationID is not updated due to error
  expect(updatedClient2.lastServerAckdMutationID).to.equal(
    client2.lastServerAckdMutationID,
  );
  expect(updatedClient2.headHash).to.equal(client2.headHash);

  expect(updatedClient3.mutationID).to.equal(client3.mutationID);
  // lastServerAckdMutationID is updated to high mutationID as mutations
  // were recovered, despite error in client 2
  expect(updatedClient3.lastServerAckdMutationID).to.equal(client3.mutationID);
  expect(updatedClient3.headHash).to.equal(client3.headHash);
});

test('if an error occurs recovering one client, continues to try to recover other clients', async () => {
  const schemaVersion = 'testSchema1';
  // client1 has same schema version as recovering client and 2 mutations to recover
  const client1ID = 'client1';
  // client2 has same schema version as recovering client and 1 mutation to recover
  const client2ID = 'client2';
  // client3 has same schema version as recovering client and 1 mutation to recover
  const client3ID = 'client3';
  const replicacheName = 'recoverMutationsRobustToClientError';
  const auth = '1';
  const pushURL = 'https://test.replicache.dev/push';
  const pullURL = 'https://test.replicache.dev/pull';
  const rep = await replicacheForTesting(replicacheName, {
    auth,
    schemaVersion,
    pushURL,
    pullURL,
  });

  await tickAFewTimes();

  const testPerdag = await createPerdag({
    replicacheName,
    schemaVersion,
  });

  const client1PendingLocalMetas = await createAndPersistClientWithPendingLocal(
    client1ID,
    testPerdag,
    2,
  );
  await createAndPersistClientWithPendingLocal(client2ID, testPerdag, 1);
  const client3PendingLocalMetas = await createAndPersistClientWithPendingLocal(
    client3ID,
    testPerdag,
    1,
  );

  const clients = await testPerdag.withRead(read => persist.getClients(read));
  const client1 = clients.get(client1ID);
  assertNotUndefined(client1);
  const client2 = clients.get(client2ID);
  assertNotUndefined(client2);
  const client3 = clients.get(client3ID);
  assertNotUndefined(client3);

  const pullRequestJsonBodies: JSONObject[] = [];
  fetchMock.reset();
  fetchMock.post(pushURL, 'ok');
  fetchMock.post(
    pullURL,
    async (_url: string, _options: RequestInit, request: Request) => {
      const requestJson = await request.json();
      assertJSONObject(requestJson);
      pullRequestJsonBodies.push(requestJson);
      const {clientID} = requestJson;
      switch (clientID) {
        case client1ID:
          return {
            cookie: 'pull_cookie_1',
            lastMutationID: client1.mutationID,
            patch: [],
          };
        case client3ID:
          return {
            cookie: 'pull_cookie_3',
            lastMutationID: client3.mutationID,
            patch: [],
          };
        default:
          throw new Error(`Unexpected pull ${requestJson}`);
      }
    },
  );

  const lazyDagWithWriteStub = sinon.stub(dag.LazyStore.prototype, 'withWrite');
  const testErrorMsg = 'Test dag.LazyStore.withWrite error';
  lazyDagWithWriteStub.onSecondCall().throws(testErrorMsg);
  lazyDagWithWriteStub.callThrough();

  const consoleErrorStub = sinon.stub(console, 'error');

  await rep.recoverMutations();

  expect(consoleErrorStub.callCount).to.equal(1);
  expect(consoleErrorStub.firstCall.args.join(' ')).to.contain(testErrorMsg);

  const pushCalls = fetchMock.calls(pushURL);
  expect(pushCalls.length).to.equal(2);
  expect(await pushCalls[0].request.json()).to.deep.equal(
    createPushBody(client1ID, client1PendingLocalMetas, schemaVersion),
  );
  expect(await pushCalls[1].request.json()).to.deep.equal(
    createPushBody(client3ID, client3PendingLocalMetas, schemaVersion),
  );

  expect(pullRequestJsonBodies.length).to.equal(2);
  expect(pullRequestJsonBodies[0]).to.deep.equal({
    clientID: client1ID,
    schemaVersion,
    cookie: 'cookie_1',
    lastMutationID: client1.lastServerAckdMutationID,
    pullVersion: 0,
  });
  expect(pullRequestJsonBodies[1]).to.deep.equal({
    clientID: client3ID,
    schemaVersion,
    cookie: 'cookie_1',
    lastMutationID: client3.lastServerAckdMutationID,
    pullVersion: 0,
  });

  const updateClients = await testPerdag.withRead(read =>
    persist.getClients(read),
  );
  const updatedClient1 = updateClients.get(client1ID);
  assertNotUndefined(updatedClient1);
  const updatedClient2 = updateClients.get(client2ID);
  assertNotUndefined(updatedClient2);
  const updatedClient3 = updateClients.get(client3ID);
  assertNotUndefined(updatedClient3);

  expect(updatedClient1.mutationID).to.equal(client1.mutationID);
  // lastServerAckdMutationID is updated to high mutationID as mutations
  // were recovered
  expect(updatedClient1.lastServerAckdMutationID).to.equal(client1.mutationID);
  expect(updatedClient1.headHash).to.equal(client1.headHash);

  expect(updatedClient2.mutationID).to.equal(client2.mutationID);
  // lastServerAckdMutationID is not updated due to error
  expect(updatedClient2.lastServerAckdMutationID).to.equal(
    client2.lastServerAckdMutationID,
  );
  expect(updatedClient2.headHash).to.equal(client2.headHash);

  expect(updatedClient3.mutationID).to.equal(client3.mutationID);
  // lastServerAckdMutationID is updated to high mutationID as mutations
  // were recovered, despite error in client 2
  expect(updatedClient3.lastServerAckdMutationID).to.equal(client3.mutationID);
  expect(updatedClient3.headHash).to.equal(client3.headHash);
});

test('if an error occurs recovering one db, continues to try to recover clients from other dbs', async () => {
  const schemaVersionOfClient1 = 'testSchema1';
  const schemaVersionOfClient2 = 'testSchema2';
  const schemaVersionOfRecoveringClient = 'testSchemaOfRecovering';
  const client1ID = 'client1';
  const client2ID = 'client2';
  const replicacheName = 'recoverMutationsRobustToDBError';
  const auth = '1';
  const pushURL = 'https://test.replicache.dev/push';
  const pullURL = 'https://test.replicache.dev/pull';
  const rep = await replicacheForTesting(replicacheName, {
    auth,
    schemaVersion: schemaVersionOfRecoveringClient,
    pushURL,
    pullURL,
  });

  await tickAFewTimes();

  const testPerdagForClient1 = await createPerdag({
    replicacheName,
    schemaVersion: schemaVersionOfClient1,
  });
  await createAndPersistClientWithPendingLocal(
    client1ID,
    testPerdagForClient1,
    1,
  );

  const testPerdagForClient2 = await createPerdag({
    replicacheName,
    schemaVersion: schemaVersionOfClient2,
  });
  const client2PendingLocalMetas = await createAndPersistClientWithPendingLocal(
    client2ID,
    testPerdagForClient2,
    1,
  );

  const client1 = await testPerdagForClient1.withRead(read =>
    persist.getClient(client1ID, read),
  );
  assertNotUndefined(client1);

  const client2 = await testPerdagForClient2.withRead(read =>
    persist.getClient(client2ID, read),
  );
  assertNotUndefined(client2);

  const pullRequestJsonBodies: JSONObject[] = [];
  fetchMock.reset();
  fetchMock.post(pushURL, 'ok');
  fetchMock.post(
    pullURL,
    async (_url: string, _options: RequestInit, request: Request) => {
      const requestJson = await request.json();
      assertJSONObject(requestJson);
      pullRequestJsonBodies.push(requestJson);
      const {clientID} = requestJson;
      switch (clientID) {
        case client2ID:
          return {
            cookie: 'pull_cookie_2',
            lastMutationID: client2.mutationID,
            patch: [],
          };
        default:
          throw new Error(`Unexpected pull ${requestJson}`);
      }
    },
  );

  const dagStoreWithReadStub = sinon.stub(dag.StoreImpl.prototype, 'withRead');
  const testErrorMsg = 'Test dag.StoreImpl.withRead error';
  dagStoreWithReadStub.onSecondCall().throws(testErrorMsg);
  dagStoreWithReadStub.callThrough();

  const consoleErrorStub = sinon.stub(console, 'error');

  await rep.recoverMutations();

  expect(consoleErrorStub.callCount).to.equal(1);
  expect(consoleErrorStub.firstCall.args.join(' ')).to.contain(testErrorMsg);

  const pushCalls = fetchMock.calls(pushURL);
  expect(pushCalls.length).to.equal(1);
  expect(await pushCalls[0].request.json()).to.deep.equal(
    createPushBody(client2ID, client2PendingLocalMetas, schemaVersionOfClient2),
  );

  expect(pullRequestJsonBodies.length).to.equal(1);
  expect(pullRequestJsonBodies[0]).to.deep.equal({
    clientID: client2ID,
    schemaVersion: schemaVersionOfClient2,
    cookie: 'cookie_1',
    lastMutationID: client2.lastServerAckdMutationID,
    pullVersion: 0,
  });

  const updatedClient1 = await testPerdagForClient1.withRead(read =>
    persist.getClient(client1ID, read),
  );
  assertNotUndefined(updatedClient1);

  const updatedClient2 = await testPerdagForClient2.withRead(read =>
    persist.getClient(client2ID, read),
  );
  assertNotUndefined(updatedClient2);

  expect(updatedClient1.mutationID).to.equal(client1.mutationID);
  // lastServerAckdMutationID not updated due to error when recovering this
  // client's db
  expect(updatedClient1.lastServerAckdMutationID).to.equal(
    client1.lastServerAckdMutationID,
  );
  expect(updatedClient1.headHash).to.equal(client1.headHash);

  expect(updatedClient2.mutationID).to.equal(client2.mutationID);
  // lastServerAckdMutationID is updated to high mutationID as mutations
  // were recovered despite error in other db
  expect(updatedClient2.lastServerAckdMutationID).to.equal(client2.mutationID);
  expect(updatedClient2.headHash).to.equal(client2.headHash);
});

test('mutation recovery exits early if Replicache is closed', async () => {
  const schemaVersion = 'testSchema1';
  const client1ID = 'client1';
  const client2ID = 'client2';
  const replicacheName = 'recoverMutationsRobustToClientError';
  const auth = '1';
  const pushURL = 'https://test.replicache.dev/push';
  const pullURL = 'https://test.replicache.dev/pull';
  const rep = await replicacheForTesting(replicacheName, {
    auth,
    schemaVersion,
    pushURL,
    pullURL,
  });

  await tickAFewTimes();

  const testPerdag = await createPerdag({
    replicacheName,
    schemaVersion,
  });

  const client1PendingLocalMetas = await createAndPersistClientWithPendingLocal(
    client1ID,
    testPerdag,
    1,
  );
  await createAndPersistClientWithPendingLocal(client2ID, testPerdag, 1);

  const clients = await testPerdag.withRead(read => persist.getClients(read));
  const client1 = clients.get(client1ID);
  assertNotUndefined(client1);
  const client2 = clients.get(client2ID);
  assertNotUndefined(client2);

  const pullRequestJsonBodies: JSONObject[] = [];
  fetchMock.reset();
  fetchMock.post(pushURL, 'ok');
  fetchMock.post(
    pullURL,
    async (_url: string, _options: RequestInit, request: Request) => {
      const requestJson = await request.json();
      assertJSONObject(requestJson);
      pullRequestJsonBodies.push(requestJson);
      const {clientID} = requestJson;
      switch (clientID) {
        case client1ID:
          return {
            cookie: 'pull_cookie_1',
            lastMutationID: client1.mutationID,
            patch: [],
          };
        default:
          throw new Error(`Unexpected pull ${requestJson}`);
      }
    },
  );

  // At the end of recovering client1 close the recovering Replicache instance
  const lazyDagWithWriteStub = sinon.stub(dag.LazyStore.prototype, 'close');
  lazyDagWithWriteStub.onFirstCall().callsFake(async () => {
    await rep.close();
  });
  lazyDagWithWriteStub.callThrough();

  await rep.recoverMutations();

  const pushCalls = fetchMock.calls(pushURL);
  expect(pushCalls.length).to.equal(1);
  expect(await pushCalls[0].request.json()).to.deep.equal(
    createPushBody(client1ID, client1PendingLocalMetas, schemaVersion),
  );

  expect(pullRequestJsonBodies.length).to.equal(1);
  expect(pullRequestJsonBodies[0]).to.deep.equal({
    clientID: client1ID,
    schemaVersion,
    cookie: 'cookie_1',
    lastMutationID: client1.lastServerAckdMutationID,
    pullVersion: 0,
  });

  const updateClients = await testPerdag.withRead(read =>
    persist.getClients(read),
  );
  const updatedClient1 = updateClients.get(client1ID);
  assertNotUndefined(updatedClient1);
  const updatedClient2 = updateClients.get(client2ID);
  assertNotUndefined(updatedClient2);

  expect(updatedClient1.mutationID).to.equal(client1.mutationID);
  // lastServerAckdMutationID is updated to high mutationID as mutations
  // were recovered
  expect(updatedClient1.lastServerAckdMutationID).to.equal(client1.mutationID);
  expect(updatedClient1.headHash).to.equal(client1.headHash);

  expect(updatedClient2.mutationID).to.equal(client2.mutationID);
  // lastServerAckdMutationID is not updated due to close
  expect(updatedClient2.lastServerAckdMutationID).to.equal(
    client2.lastServerAckdMutationID,
  );
  expect(updatedClient2.headHash).to.equal(client2.headHash);
});

test('mutation recovery is invoked at startup', async () => {
  const rep = await replicacheForTesting('mutation-recovery-startup');
  expect(rep.recoverMutationsSpy.callCount).to.equal(1);
});

test('mutation recovery is invoked on change from offline to online', async () => {
  const replicacheName = 'mutation-recovery-online';
  const pullURL = 'https://test.replicache.dev/pull';
  const rep = await replicacheForTesting(replicacheName, {
    pullURL,
  });
  expect(rep.recoverMutationsSpy.callCount).to.equal(1);
  expect(rep.online).to.equal(true);

  fetchMock.post(pullURL, async () => {
    return {throws: new Error('Simulate fetch error in push')};
  });

  rep.pull();

  await tickAFewTimes();
  expect(rep.online).to.equal(false);
  expect(rep.recoverMutationsSpy.callCount).to.equal(1);

  fetchMock.reset();
  fetchMock.post(pullURL, {
    cookie: 'test_cookie',
    lastMutationID: 2,
    patch: [],
  });

  rep.pull();
  expect(rep.recoverMutationsSpy.callCount).to.equal(1);
  while (!rep.online) {
    await tickAFewTimes();
  }
  expect(rep.recoverMutationsSpy.callCount).to.equal(2);
});

test('mutation recovery is invoked on 5 minute interval', async () => {
  const rep = await replicacheForTesting('mutation-recovery-startup');
  expect(rep.recoverMutationsSpy.callCount).to.equal(1);
  await clock.tickAsync(5 * 60 * 1000);
  expect(rep.recoverMutationsSpy.callCount).to.equal(2);
  await clock.tickAsync(5 * 60 * 1000);
  expect(rep.recoverMutationsSpy.callCount).to.equal(3);
});
