import {expect} from '@esm-bundle/chai';
import {MemStore} from '../kv/mod';
import * as dag from '../dag/mod';
import {assertHash, hashOf, initHasher, newTempHash} from '../hash';
import {getClient, getClients, setClient, setClients} from './clients';

setup(async () => {
  await initHasher();
});

test('getClients with no existing ClientMap in dag store', async () => {
  const dagStore = new dag.Store(new MemStore());
  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap = await getClients(read);
    expect(readClientMap.size).to.equal(0);
  });
});

test('setClients and getClients', async () => {
  const dagStore = new dag.Store(new MemStore());
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
  const dagStore = new dag.Store(new MemStore());
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
  const dagStore = new dag.Store(new MemStore());
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
  const dagStore = new dag.Store(new MemStore());
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
  const dagStore = new dag.Store(new MemStore());
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
  const dagStore = new dag.Store(new MemStore());
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
  const dagStore = new dag.Store(new MemStore());
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
  const dagStore = new dag.Store(new MemStore());
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
  const dagStore = new dag.Store(new MemStore());
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
  const dagStore = new dag.Store(new MemStore());
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
  const dagStore = new dag.Store(new MemStore());
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
  const dagStore = new dag.Store(new MemStore());
  await dagStore.withWrite(async (write: dag.Write) => {
    const headHash = hashOf('head of commit client1 is currently at');
    const chunk = dag.Chunk.new(
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
