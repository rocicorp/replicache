import {
  initReplicacheTesting,
  replicacheForTesting,
  tickAFewTimes,
} from './test-util';
import {expect} from '@esm-bundle/chai';

// fetch-mock has invalid d.ts file so we removed that on npm install.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import fetchMock from 'fetch-mock/esm/client';
import * as kv from './kv/mod';
import * as dag from './dag/mod';
import * as persist from './persist/mod';
import {assertNotTempHash} from './hash';
import {assertNotUndefined} from './asserts';

initReplicacheTesting();

let perdag: dag.Store | undefined;
teardown(async () => {
  await perdag?.close();
});

test('basic persist & load', async () => {
  const pullURL = 'https://diff.com/pull';
  const rep = await replicacheForTesting('persist-test', {
    pullURL,
  });
  const clientID = await rep.clientID;

  perdag = new dag.StoreImpl(
    new kv.IDBStore(rep.idbName),
    dag.throwChunkHasher,
    assertNotTempHash,
  );

  const clientBeforePull = await perdag.withRead(read =>
    persist.getClient(clientID, read),
  );
  assertNotUndefined(clientBeforePull);

  fetchMock.postOnce(pullURL, {
    cookie: '',
    lastMutationID: 2,
    patch: [
      {
        op: 'put',
        key: 'a',
        value: 1,
      },
      {
        op: 'put',
        key: 'b',
        value: 2,
      },
    ],
  });

  rep.pull();

  // maxWaitAttempts * waitMs should be at least PERSIST_TIMEOUT
  // plus some buffer for the persist process to complete
  const maxWaitAttempts = 20;
  const waitMs = 100;
  let waitAttempt = 0;
  const run = true;
  while (run) {
    if (waitAttempt++ > maxWaitAttempts) {
      throw new Error(
        `Persist did not complete in ${maxWaitAttempts * waitMs} ms`,
      );
    }
    await tickAFewTimes(waitMs);
    const client: persist.Client | undefined = await perdag.withRead(read =>
      persist.getClient(clientID, read),
    );
    assertNotUndefined(client);
    if (clientBeforePull.headHash !== client.headHash) {
      // persist has completed
      break;
    }
  }

  await rep.query(async tx => {
    expect(await tx.get('a')).to.equal(1);
    expect(await tx.get('b')).to.equal(2);
  });

  // If we create another instance it will lazy load the data from IDB
  const rep2 = await replicacheForTesting('persist-test', {
    pullURL,
  });
  await rep2.query(async tx => {
    expect(await tx.get('a')).to.equal(1);
    expect(await tx.get('b')).to.equal(2);
  });

  expect(await rep.clientID).to.not.equal(await rep2.clientID);
});
