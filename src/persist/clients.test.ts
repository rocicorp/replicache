import {expect} from '@esm-bundle/chai';
import {assertNotUndefined} from '../asserts';
import {BTreeRead} from '../btree/read';
import * as dag from '../dag/mod';
import {fromChunk, SnapshotMeta} from '../db/commit';
import {assertHash, hashOf, initHasher, newTempHash} from '../hash';
import {getClient, getClients, initClient} from './clients';
import {SinonFakeTimers, useFakeTimers} from 'sinon';
import {
  addGenesis,
  addIndexChange,
  addLocal,
  addSnapshot,
  Chain,
} from '../db/test-helpers';
import {setClients} from './clients-test-helpers';

let clock: SinonFakeTimers;
setup(async () => {
  await initHasher();
  clock = useFakeTimers(0);
});

teardown(() => {
  clock.restore();
});

test('getClients with no existing ClientMap in dag store', async () => {
  const dagStore = new dag.TestStore();
  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap = await getClients(read);
    expect(readClientMap.size).to.equal(0);
  });
});

test('setClients and getClients', async () => {
  const dagStore = new dag.TestStore();
  const clientMap = new Map(
    Object.entries({
      client1: {
        heartbeatTimestampMs: 1000,
        headHash: hashOf('head of commit client1 is currently at'),
      },
      client2: {
        heartbeatTimestampMs: 3000,
        headHash: hashOf('head of commit client2 is currently at'),
      },
    }),
  );
  await setClients(clientMap, dagStore);

  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap = await getClients(read);
    expect(readClientMap).to.deep.equal(clientMap);
  });
});

test('setClients and getClients sequence', async () => {
  const dagStore = new dag.TestStore();
  const clientMap1 = new Map(
    Object.entries({
      client1: {
        heartbeatTimestampMs: 1000,
        headHash: hashOf('head of commit client1 is currently at'),
      },
      client2: {
        heartbeatTimestampMs: 3000,
        headHash: hashOf('head of commit client2 is currently at'),
      },
    }),
  );

  const clientMap2 = new Map(
    Object.entries({
      client3: {
        heartbeatTimestampMs: 4000,
        headHash: hashOf('head of commit client3 is currently at'),
      },
    }),
  );
  await setClients(clientMap1, dagStore);

  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap1 = await getClients(read);
    expect(readClientMap1).to.deep.equal(clientMap1);
  });

  await setClients(clientMap2, dagStore);

  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap2 = await getClients(read);
    expect(readClientMap2).to.deep.equal(clientMap2);
  });
});

test('setClients properly manages refs to client heads when clients are removed and added', async () => {
  const dagStore = new dag.TestStore();
  const client1HeadHash = hashOf('head of commit client1 is currently at');
  const client2HeadHash = hashOf('head of commit client2 is currently at');

  const clientMap1 = new Map(
    Object.entries({
      client1: {
        heartbeatTimestampMs: 1000,
        headHash: client1HeadHash,
      },
      client2: {
        heartbeatTimestampMs: 3000,
        headHash: client2HeadHash,
      },
    }),
  );

  const client3HeadHash = hashOf('head of commit client3 is currently at');
  const clientMap2 = new Map(
    Object.entries({
      client3: {
        heartbeatTimestampMs: 4000,
        headHash: client3HeadHash,
      },
    }),
  );
  await setClients(clientMap1, dagStore);

  await dagStore.withRead(async (read: dag.Read) => {
    const clientsHash = await read.getHead('clients');
    assertHash(clientsHash);
    const clientsChunk = await read.getChunk(clientsHash);
    expect(clientsChunk?.meta).to.deep.equal([
      client1HeadHash,
      client2HeadHash,
    ]);
  });
  await setClients(clientMap2, dagStore);

  await dagStore.withRead(async (read: dag.Read) => {
    const clientsHash = await read.getHead('clients');
    assertHash(clientsHash);
    const clientsChunk = await read.getChunk(clientsHash);
    expect(clientsChunk?.meta).to.deep.equal([client3HeadHash]);
  });
});

test("setClients properly manages refs to client heads when a client's head changes", async () => {
  const dagStore = new dag.TestStore();
  const client1V1HeadHash = hashOf('head of commit client1 is currently at');
  const client1V2HeadHash = hashOf(
    'head of new commit client1 is currently at',
  );
  const client2HeadHash = hashOf('head of commit client2 is currently at');

  const client1V1 = {
    heartbeatTimestampMs: 1000,
    headHash: client1V1HeadHash,
  };
  const client1V2 = {
    heartbeatTimestampMs: 2000,
    headHash: client1V2HeadHash,
  };
  const client2 = {
    heartbeatTimestampMs: 3000,
    headHash: client2HeadHash,
  };

  const clientMap1 = new Map(
    Object.entries({
      client1: client1V1,
      client2,
    }),
  );

  await setClients(clientMap1, dagStore);

  await dagStore.withRead(async (read: dag.Read) => {
    const clientsHash = await read.getHead('clients');
    assertHash(clientsHash);
    const clientsChunk = await read.getChunk(clientsHash);
    expect(clientsChunk?.meta).to.deep.equal([
      client1V1HeadHash,
      client2HeadHash,
    ]);
  });

  await setClients(
    new Map(
      Object.entries({
        client1: client1V2,
        client2,
      }),
    ),
    dagStore,
  );

  await dagStore.withRead(async (read: dag.Read) => {
    const clientsHash = await read.getHead('clients');
    assertHash(clientsHash);
    const clientsChunk = await read.getChunk(clientsHash);
    expect(clientsChunk?.meta).to.deep.equal([
      client1V2HeadHash,
      client2HeadHash,
    ]);
  });
});

test('getClient', async () => {
  const dagStore = new dag.TestStore();
  const client1 = {
    heartbeatTimestampMs: 1000,
    headHash: hashOf('head of commit client1 is currently at'),
  };
  const clientMap = new Map(
    Object.entries({
      client1,
      client2: {
        heartbeatTimestampMs: 3000,
        headHash: hashOf('head of commit client2 is currently at'),
      },
    }),
  );
  await setClients(clientMap, dagStore);

  await dagStore.withRead(async (read: dag.Read) => {
    const readClient1 = await getClient('client1', read);
    expect(readClient1).to.deep.equal(client1);
  });
});

test('setClients throws error if any client headHash is a temp hash', async () => {
  const dagStore = new dag.TestStore();
  const client1 = {
    heartbeatTimestampMs: 1000,
    headHash: hashOf('head of commit client1 is currently at'),
  };
  const client2 = {
    heartbeatTimestampMs: 3000,
    headHash: hashOf('head of commit client2 is currently at'),
  };
  const clientMap = new Map(
    Object.entries({
      client1,
      client2,
    }),
  );

  await setClients(clientMap, dagStore);

  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap = await getClients(read);
    expect(readClientMap).to.deep.equal(clientMap);
  });

  const clientMapWTempHash = new Map(
    Object.entries({
      client1,
      client2: {
        heartbeatTimestampMs: 3000,
        headHash: newTempHash(),
      },
    }),
  );

  let e;
  try {
    await setClients(clientMapWTempHash, dagStore);
  } catch (ex) {
    e = ex;
  }
  expect(e).to.be.instanceOf(Error);

  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap = await getClients(read);
    expect(readClientMap).to.deep.equal(clientMap);
  });
});

test('getClients throws errors if clients head exist but the chunk it refrences does not', async () => {
  const dagStore = new dag.TestStore();
  await dagStore.withWrite(async (write: dag.Write) => {
    await write.setHead('clients', hashOf('random stuff'));
    await write.commit();
  });
  await dagStore.withRead(async (read: dag.Read) => {
    let e;
    try {
      await getClients(read);
    } catch (ex) {
      e = ex;
    }
    expect(e).to.be.instanceOf(Error);
  });
});

test('getClients throws errors if chunk pointed to by clients head does not contain a valid ClientMap', async () => {
  const dagStore = new dag.TestStore();
  await dagStore.withWrite(async (write: dag.Write) => {
    const headHash = hashOf('head of commit client1 is currently at');
    const chunk = write.createChunk(
      {
        heartbeatTimestampMs: 'this should be a number',
        headHash,
      },
      [headHash],
    );

    await Promise.all([
      write.putChunk(chunk),
      write.setHead('clients', chunk.hash),
    ]);
    await write.commit();
  });
  await dagStore.withRead(async (read: dag.Read) => {
    let e;
    try {
      await getClients(read);
    } catch (ex) {
      e = ex;
    }
    expect(e).to.be.instanceOf(Error);
  });
});

test('initClient creates new empty snapshot when no existing snapshot to bootstrap from', async () => {
  const dagStore = new dag.TestStore();
  clock.tick(4000);
  const [clientId, client] = await initClient(dagStore);

  await dagStore.withRead(async (read: dag.Read) => {
    // New client was added to the client map.
    expect(await getClient(clientId, read)).to.deep.equal(client);
    expect(client.heartbeatTimestampMs).to.equal(clock.now);

    // New client's head hash points to an empty snapshot with an empty btree.
    const headChunk = await read.getChunk(client.headHash);
    assertNotUndefined(headChunk);
    const commit = await fromChunk(headChunk);
    expect(commit.isSnapshot()).to.be.true;
    const snapshotMeta = commit.meta as SnapshotMeta;
    expect(snapshotMeta.basisHash).to.be.null;
    expect(snapshotMeta.cookieJSON).to.be.null;
    expect(commit.mutationID).to.equal(0);
    expect(commit.indexes).to.be.empty;
    expect(await new BTreeRead(read, commit.valueHash).isEmpty()).to.be.true;
  });
});

test('initClient bootstraps from base snapshot of client with highest heartbeat', async () => {
  const dagStore = new dag.TestStore();

  const chain: Chain = [];
  await addGenesis(chain, dagStore);
  await addSnapshot(chain, dagStore, [['foo', 'bar']]);
  await addLocal(chain, dagStore);
  const client1HeadCommit = chain[chain.length - 1];
  await addIndexChange(chain, dagStore);
  await addSnapshot(chain, dagStore, [['fuz', 'bang']]);
  const client2BaseSnapshotCommit = chain[chain.length - 1];
  await addLocal(chain, dagStore);
  await addLocal(chain, dagStore);
  const client2HeadCommit = chain[chain.length - 1];

  const clientMap = new Map(
    Object.entries({
      client1: {
        heartbeatTimestampMs: 1000,
        headHash: client1HeadCommit.chunk.hash,
      },
      client2: {
        heartbeatTimestampMs: 3000,
        headHash: client2HeadCommit.chunk.hash,
      },
    }),
  );
  await setClients(clientMap, dagStore);

  clock.tick(4000);
  const [clientId, client] = await initClient(dagStore);

  await dagStore.withRead(async (read: dag.Read) => {
    // New client was added to the client map.
    expect(await getClient(clientId, read)).to.deep.equal(client);
    expect(client.heartbeatTimestampMs).to.equal(clock.now);

    // New client's head hash points to a commit that matches client2BaseSnapshoCommit
    // but with a local mutation id of 0.
    const headChunk = await read.getChunk(client.headHash);
    assertNotUndefined(headChunk);
    const commit = await fromChunk(headChunk);
    expect(commit.isSnapshot()).to.be.true;
    const snapshotMeta = commit.meta as SnapshotMeta;
    expect(client2BaseSnapshotCommit.isSnapshot()).to.be.true;
    const client2BaseSnapshotMeta =
      client2BaseSnapshotCommit.meta as SnapshotMeta;

    expect(snapshotMeta.basisHash).to.equal(client2BaseSnapshotMeta.basisHash);
    expect(snapshotMeta.cookieJSON).to.equal(
      client2BaseSnapshotMeta.cookieJSON,
    );
    expect(commit.mutationID).to.equal(0);
    expect(commit.indexes).to.not.be.empty;
    expect(commit.indexes).to.deep.equal(client2BaseSnapshotCommit.indexes);
    expect(commit.valueHash).to.equal(client2BaseSnapshotCommit.valueHash);
  });
});
