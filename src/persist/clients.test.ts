import {expect} from '@esm-bundle/chai';
import {assertNotUndefined} from '../asserts';
import {BTreeRead} from '../btree/read';
import * as dag from '../dag/mod';
import {fromChunk, SnapshotMeta} from '../db/commit';
import {assertHash, fakeHash, hashOf, initHasher, newTempHash} from '../hash';
import {
  getClient,
  getClients,
  initClient,
  setClient,
  setClients,
  setClientsWithHash,
  updateClients,
} from './clients';
import {SinonFakeTimers, useFakeTimers} from 'sinon';
import {
  addGenesis,
  addIndexChange,
  addLocal,
  addSnapshot,
  Chain,
} from '../db/test-helpers';

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
  await dagStore.withWrite(async (write: dag.Write) => {
    await setClients(clientMap, write);
    await write.commit();
  });

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
  await dagStore.withWrite(async (write: dag.Write) => {
    await setClients(clientMap1, write);
    await write.commit();
  });

  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap1 = await getClients(read);
    expect(readClientMap1).to.deep.equal(clientMap1);
  });

  await dagStore.withWrite(async (write: dag.Write) => {
    await setClients(clientMap2, write);
    await write.commit();
  });

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
  await dagStore.withWrite(async (write: dag.Write) => {
    await setClients(clientMap1, write);
    await write.commit();
  });

  await dagStore.withRead(async (read: dag.Read) => {
    const clientsHash = await read.getHead('clients');
    assertHash(clientsHash);
    const clientsChunk = await read.getChunk(clientsHash);
    expect(clientsChunk?.meta).to.deep.equal([
      client1HeadHash,
      client2HeadHash,
    ]);
  });

  await dagStore.withWrite(async (write: dag.Write) => {
    await setClients(clientMap2, write);
    await write.commit();
  });

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

  await dagStore.withWrite(async (write: dag.Write) => {
    await setClients(clientMap1, write);
    await write.commit();
  });

  await dagStore.withRead(async (read: dag.Read) => {
    const clientsHash = await read.getHead('clients');
    assertHash(clientsHash);
    const clientsChunk = await read.getChunk(clientsHash);
    expect(clientsChunk?.meta).to.deep.equal([
      client1V1HeadHash,
      client2HeadHash,
    ]);
  });

  await dagStore.withWrite(async (write: dag.Write) => {
    await setClients(
      new Map(
        Object.entries({
          client1: client1V2,
          client2,
        }),
      ),
      write,
    );
    await write.commit();
  });

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

test('setClient properly manages refs to client heads', async () => {
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

  await dagStore.withWrite(async (write: dag.Write) => {
    await setClients(clientMap1, write);
    await write.commit();
  });

  await dagStore.withRead(async (read: dag.Read) => {
    const clientsHash = await read.getHead('clients');
    assertHash(clientsHash);
    const clientsChunk = await read.getChunk(clientsHash);
    expect(clientsChunk?.meta).to.deep.equal([
      client1V1HeadHash,
      client2HeadHash,
    ]);
  });

  await dagStore.withWrite(async (write: dag.Write) => {
    await setClient('client1', client1V2, write);
    await write.commit();
  });

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
  await dagStore.withWrite(async (write: dag.Write) => {
    await setClients(clientMap, write);
    await write.commit();
  });

  await dagStore.withRead(async (read: dag.Read) => {
    const readClient1 = await getClient('client1', read);
    expect(readClient1).to.deep.equal(client1);
  });
});

test('setClient with existing client id', async () => {
  const dagStore = new dag.TestStore();
  const client1V1 = {
    heartbeatTimestampMs: 1000,
    headHash: hashOf('head of commit client1 is currently at'),
  };
  const client1V2 = {
    heartbeatTimestampMs: 2000,
    headHash: hashOf('head of new commit client1 is currently at'),
  };
  const client2 = {
    heartbeatTimestampMs: 3000,
    headHash: hashOf('head of commit client2 is currently at'),
  };
  const clientMap = new Map(
    Object.entries({
      client1: client1V1,
      client2,
    }),
  );
  await dagStore.withWrite(async (write: dag.Write) => {
    await setClients(clientMap, write);
    await write.commit();
  });

  await dagStore.withWrite(async (write: dag.Write) => {
    await setClient('client1', client1V2, write);
    await write.commit();
  });

  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap = await getClients(read);
    expect(readClientMap).to.deep.equal(
      new Map(
        Object.entries({
          client1: client1V2,
          client2,
        }),
      ),
    );
  });
});

test('setClient with new client id', async () => {
  const dagStore = new dag.TestStore();
  const client1 = {
    heartbeatTimestampMs: 1000,
    headHash: hashOf('head of commit client1 is currently at'),
  };
  const client2 = {
    heartbeatTimestampMs: 3000,
    headHash: hashOf('head of commit client2 is currently at'),
  };
  const client3 = {
    heartbeatTimestampMs: 5000,
    headHash: hashOf('head of commit client3 is currently at'),
  };
  const clientMap = new Map(
    Object.entries({
      client1,
      client2,
    }),
  );
  await dagStore.withWrite(async (write: dag.Write) => {
    await setClients(clientMap, write);
    await write.commit();
  });
  await dagStore.withWrite(async (write: dag.Write) => {
    await setClient('client3', client3, write);
    await write.commit();
  });

  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap = await getClients(read);
    expect(readClientMap).to.deep.equal(
      new Map(
        Object.entries({
          client1,
          client2,
          client3,
        }),
      ),
    );
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

  await dagStore.withWrite(async (write: dag.Write) => {
    await setClients(clientMap, write);
    await write.commit();
  });

  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap = await getClients(read);
    expect(readClientMap).to.deep.equal(clientMap);
  });

  await dagStore.withWrite(async (write: dag.Write) => {
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
      await setClients(clientMapWTempHash, write);
    } catch (ex) {
      e = ex;
    }
    expect(e).to.be.instanceOf(Error);
    await write.commit();
  });

  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap = await getClients(read);
    expect(readClientMap).to.deep.equal(clientMap);
  });
});

test('setClient throws error if client headHash is a temp hash', async () => {
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
  await dagStore.withWrite(async (write: dag.Write) => {
    await setClients(clientMap, write);
    await write.commit();
  });

  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap = await getClients(read);
    expect(readClientMap).to.deep.equal(clientMap);
  });

  await dagStore.withWrite(async (write: dag.Write) => {
    let e;
    try {
      await setClient(
        'client2',
        {
          heartbeatTimestampMs: 3000,
          headHash: newTempHash(),
        },
        write,
      );
    } catch (ex) {
      e = ex;
    }
    expect(e).to.be.instanceOf(Error);
    await write.commit();
  });

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
  const [clientId, client] = await dagStore.withWrite(
    async (write: dag.Write) => {
      const clientInfo = await initClient(write);
      await write.commit();
      return clientInfo;
    },
  );

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

  await dagStore.withWrite(async (write: dag.Write) => {
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
    await setClients(clientMap, write);
    await write.commit();
  });

  clock.tick(4000);
  const [clientId, client] = await dagStore.withWrite(
    async (write: dag.Write) => {
      const clientInfo = await initClient(write);
      await write.commit();
      return clientInfo;
    },
  );

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

async function updateClientsSetup() {
  const perdag = new dag.TestStore(
    undefined,
    () => {
      throw new Error('should not be called');
    },
    assertHash,
  );

  const clientID = 'cid1';

  const clients = await perdag.withWrite(async dagWrite => {
    const clients = await getClients(dagWrite);
    clients.set(clientID, {
      headHash: fakeHash('cid1head1'),
      heartbeatTimestampMs: Date.now(),
    });
    await setClientsWithHash(clients, fakeHash('clientshead1'), dagWrite);
    await dagWrite.commit();
    return clients;
  });
  return {perdag, clientID, clients};
}

test('update clients with no race', async () => {
  const {perdag, clientID, clients} = await updateClientsSetup();

  await updateClients(
    perdag,
    clientID,
    fakeHash('cid1head2'),
    `${clientID}-temp`,
    clients,
  );

  const updatedClients = await perdag.withRead(dagRead => getClients(dagRead));
  expect(Object.fromEntries(updatedClients)).to.deep.equal({
    cid1: {
      headHash: 'fake0000000000000000000cid1head2',
      heartbeatTimestampMs: 0,
    },
  });
});

test('update clients with clients changed', async () => {
  const {perdag, clientID, clients} = await updateClientsSetup();

  clients.set(clientID, {
    headHash: fakeHash('cid1head2'),
    heartbeatTimestampMs: 42,
  });
  await perdag.withWrite(async dagWrite => {
    await setClientsWithHash(clients, fakeHash('clientshead2'), dagWrite);
    await dagWrite.commit();
  });

  await updateClients(
    perdag,
    clientID,
    fakeHash('cid1head3'),
    `${clientID}-temp`,
    clients,
  );

  const updatedClients = await perdag.withRead(dagRead => getClients(dagRead));
  expect(Object.fromEntries(updatedClients)).to.deep.equal({
    cid1: {
      headHash: 'fake0000000000000000000cid1head3',
      heartbeatTimestampMs: 0,
    },
  });
});

test('update clients with race', async () => {
  const {perdag, clientID, clients} = await updateClientsSetup();

  const clientID2 = 'cid2';
  clients.set(clientID2, {
    headHash: fakeHash('cid2head1'),
    heartbeatTimestampMs: Date.now(),
  });

  await perdag.withWrite(async dagWrite => {
    await setClientsWithHash(clients, fakeHash('clientshead2'), dagWrite);
    await dagWrite.commit();
  });

  await Promise.all([
    updateClients(
      perdag,
      clientID,
      fakeHash('cid1head2'),
      `${clientID}-temp`,
      clients,
    ),
    updateClients(
      perdag,
      clientID2,
      fakeHash('cid2head2'),
      `${clientID2}-temp`,
      clients,
    ),
  ]);

  const updatedClients = await perdag.withRead(dagRead => getClients(dagRead));
  expect(Object.fromEntries(updatedClients)).to.deep.equal({
    cid1: {
      headHash: 'fake0000000000000000000cid1head2',
      heartbeatTimestampMs: 0,
    },
    cid2: {
      headHash: 'fake0000000000000000000cid2head2',
      heartbeatTimestampMs: 0,
    },
  });
});
