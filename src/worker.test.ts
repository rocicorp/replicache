import {expect} from '@esm-bundle/chai';
import {sleep} from './sleep';
import {closeAllReps, dbsToDrop, deletaAllDatabases} from './test-util';

teardown(async () => {
  await closeAllReps();
  deletaAllDatabases();
});

// This started failing on github only with https://github.com/rocicorp/replicache/pull/479.
// It works fine locally. Error message is:
// src/worker.test.ts:
//
// ❌ worker test (failed on Chromium)
// Error: Timed out
//   at src/worker.test.ts:42:42
//   at async o.<anonymous> (src/worker.test.ts:17:17)
//
// Example failure: https://github.com/rocicorp/replicache/runs/3519251318
test.skip('worker test', async () => {
  const url = new URL('./worker-test.ts', import.meta.url);
  const w = new Worker(url, {type: 'module'});
  const name = 'worker-test';
  dbsToDrop.add(name);

  {
    const data = await send(w, {name, useMemstore: false});
    expect(data).to.be.undefined;
  }
  {
    const data = await send(w, {name, useMemstore: true});
    expect(data).to.be.undefined;
  }
});

async function send(
  w: Worker,
  data: {name: string; useMemstore: boolean},
): Promise<unknown> {
  const p = new Promise((resolve, reject) => {
    w.onmessage = e => resolve(e.data);
    w.onerror = reject;
    w.onmessageerror = reject;
  });
  w.postMessage(data);
  return withTimeout(p);
}

async function withTimeout<T>(p: Promise<T>): Promise<T> {
  return Promise.race([
    p,
    sleep(3000).then(() => Promise.reject(new Error('Timed out'))),
  ]);
}
