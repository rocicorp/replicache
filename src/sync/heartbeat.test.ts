import {expect} from '@esm-bundle/chai';
import {SinonFakeTimers, useFakeTimers} from 'sinon';
import * as dag from '../dag/mod';
import {startHeartbeats, writeHeartbeat} from './heartbeat';
import {getClients, setClients} from './clients';
import {hashOf, initHasher} from '../hash';

let clock: SinonFakeTimers;
const START_TIME = 100000;
const ONE_MIN_IN_MS = 60 * 1000;
setup(async () => {
  await initHasher();
  clock = useFakeTimers(START_TIME);
});

teardown(() => {
  clock.restore();
});

test('startHeartbeats starts interval that writes heartbeat each minute', async () => {
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
    return write.commit();
  });

  startHeartbeats('client1', dagStore);

  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap = await getClients(read);
    expect(readClientMap).to.deep.equal(clientMap);
  });

  clock.tick(ONE_MIN_IN_MS);

  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap = await getClients(read);
    expect(readClientMap).to.deep.equal(
      new Map(
        Object.entries({
          client1: {
            ...client1,
            heartbeatTimestampMs: START_TIME + ONE_MIN_IN_MS,
          },
          client2,
        }),
      ),
    );
  });

  clock.tick(ONE_MIN_IN_MS);

  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap = await getClients(read);
    expect(readClientMap).to.deep.equal(
      new Map(
        Object.entries({
          client1: {
            ...client1,
            heartbeatTimestampMs: START_TIME + ONE_MIN_IN_MS + ONE_MIN_IN_MS,
          },
          client2,
        }),
      ),
    );
  });
});

test('calling function returned by startHeartbeats, stops heartbeats', async () => {
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
    return write.commit();
  });

  const stopHeartbeats = startHeartbeats('client1', dagStore);

  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap = await getClients(read);
    expect(readClientMap).to.deep.equal(clientMap);
  });

  clock.tick(ONE_MIN_IN_MS);

  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap = await getClients(read);
    expect(readClientMap).to.deep.equal(
      new Map(
        Object.entries({
          client1: {
            ...client1,
            heartbeatTimestampMs: START_TIME + ONE_MIN_IN_MS,
          },
          client2,
        }),
      ),
    );
  });

  stopHeartbeats();
  clock.tick(ONE_MIN_IN_MS);

  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap = await getClients(read);
    expect(readClientMap).to.deep.equal(
      new Map(
        Object.entries({
          client1: {
            ...client1,
            // Heartbeat *NOT* updated to START_TIME + ONE_MIN_IN_MS + ONE_MIN_IN_MS
            heartbeatTimestampMs: START_TIME + ONE_MIN_IN_MS,
          },
          client2,
        }),
      ),
    );
  });
});

test('writeHeartbeat writes heartbeat', async () => {
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
    return write.commit();
  });

  const TICK_IN_MS = 20000;
  clock.tick(TICK_IN_MS);

  await dagStore.withWrite(async write => {
    await writeHeartbeat('client1', write);
    await write.commit();
    await dagStore.withRead(async (read: dag.Read) => {
      const readClientMap = await getClients(read);
      expect(readClientMap).to.deep.equal(
        new Map(
          Object.entries({
            client1: {
              ...client1,
              heartbeatTimestampMs: START_TIME + TICK_IN_MS,
            },
            client2,
          }),
        ),
      );
    });
  });
});

test('writeHeartbeat throws Error if no Client is found for clientID', async () => {
  const dagStore = new dag.TestStore();
  await dagStore.withWrite(async write => {
    let e;
    try {
      await writeHeartbeat('client1', write);
    } catch (ex) {
      e = ex;
    }
    expect(e).to.be.instanceOf(Error);
  });
});
