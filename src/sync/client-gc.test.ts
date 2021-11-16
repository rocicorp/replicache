import {expect} from '@esm-bundle/chai';
import {SinonFakeTimers, useFakeTimers} from 'sinon';
import {MemStore} from '../kv/mod';
import * as dag from '../dag/mod';
import {getClients, setClient, setClients} from './clients';
import {hashOf, initHasher} from '../hash';
import {initClientGC} from './client-gc';

let clock: SinonFakeTimers;
const START_TIME = 0;
const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;
const FIVE_MINS_IN_MS = 5 * 60 * 1000;
setup(async () => {
  await initHasher();
  clock = useFakeTimers(0);
});

teardown(() => {
  clock.restore();
});

test('initClientGC starts 5 min interval that collects clients that have been inactive for > 7 days', async () => {
  const dagStore = new dag.Store(new MemStore());
  const client1 = {
    heartbeatTimestampMs: START_TIME,
    headHash: hashOf('head of commit client1 is currently at'),
  };
  const client2 = {
    heartbeatTimestampMs: START_TIME,
    headHash: hashOf('head of commit client2 is currently at'),
  };
  const client3 = {
    heartbeatTimestampMs: START_TIME + 60 * 1000,
    headHash: hashOf('head of commit client3 is currently at'),
  };
  const client4 = {
    heartbeatTimestampMs: START_TIME + 60 * 1000,
    headHash: hashOf('head of commit client4 is currently at'),
  };
  const clientMap = new Map(
    Object.entries({
      client1,
      client2,
      client3,
      client4,
    }),
  );

  await dagStore.withWrite(async (write: dag.Write) => {
    await setClients(clientMap, write);
    return write.commit();
  });

  initClientGC('client1', dagStore);

  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap = await getClients(read);
    expect(readClientMap).to.deep.equal(clientMap);
  });

  clock.tick(SEVEN_DAYS_IN_MS + 1);

  // client1 is not collected because it is the current client (despite being old enough to collect)
  // client2 is collected because it is > 7 days inactive
  // client3 is not collected because it is < 7 days inactive (by 1 minute)
  // client4 is not collected because it is < 7 days inactive (by 1 minute)
  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap = await getClients(read);
    expect(readClientMap).to.deep.equal(
      new Map(
        Object.entries({
          client1,
          client3,
          client4,
        }),
      ),
    );
  });

  // Update client4's heartbeat to now
  const client4WUpdatedHeartbeat = {
    ...client4,
    heartbeatTimestampMs: clock.now,
  };
  await dagStore.withWrite(async (write: dag.Write) => {
    await setClient('client4', client4WUpdatedHeartbeat, write);
    return write.commit();
  });

  clock.tick(FIVE_MINS_IN_MS);

  // client1 is not collected because it is the current client (despite being old enough to collect)
  // client3 is collected because it is > 7 days inactive (by 4 mins)
  // client4 is not collected because its update heartbeat is < 7 days inactive (7 days - 5 mins)
  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap = await getClients(read);
    expect(readClientMap).to.deep.equal(
      new Map(
        Object.entries({
          client1,
          client4: client4WUpdatedHeartbeat,
        }),
      ),
    );
  });

  clock.tick(SEVEN_DAYS_IN_MS);

  // client1 is not collected because it is the current client (despite being old enough to collect)
  // client4 is collected because it is > 7 days inactive
  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap = await getClients(read);
    expect(readClientMap).to.deep.equal(
      new Map(
        Object.entries({
          client1,
        }),
      ),
    );
  });
});

test('calling function returned by initClientGC, stops Client GCs', async () => {
  const dagStore = new dag.Store(new MemStore());
  const client1 = {
    heartbeatTimestampMs: START_TIME,
    headHash: hashOf('head of commit client1 is currently at'),
  };
  const client2 = {
    heartbeatTimestampMs: START_TIME,
    headHash: hashOf('head of commit client2 is currently at'),
  };
  const client3 = {
    heartbeatTimestampMs: START_TIME + 60 * 1000,
    headHash: hashOf('head of commit client3 is currently at'),
  };
  const clientMap = new Map(
    Object.entries({
      client1,
      client2,
      client3,
    }),
  );

  await dagStore.withWrite(async (write: dag.Write) => {
    await setClients(clientMap, write);
    return write.commit();
  });

  const stopClientGC = initClientGC('client1', dagStore);

  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap = await getClients(read);
    expect(readClientMap).to.deep.equal(clientMap);
  });

  clock.tick(SEVEN_DAYS_IN_MS + 1);

  // client1 is not collected because it is the current client (despite being old enough to collect)
  // client2 is collected because it is > 7 days inactive
  // client3 is not collected because it is < 7 days inactive (by 1 minute)
  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap = await getClients(read);
    expect(readClientMap).to.deep.equal(
      new Map(
        Object.entries({
          client1,
          client3,
        }),
      ),
    );
  });

  stopClientGC();
  clock.tick(FIVE_MINS_IN_MS);

  // client3 is not collected because GC has been stopped
  await dagStore.withRead(async (read: dag.Read) => {
    const readClientMap = await getClients(read);
    expect(readClientMap).to.deep.equal(
      new Map(
        Object.entries({
          client1,
          client3,
        }),
      ),
    );
  });
});
