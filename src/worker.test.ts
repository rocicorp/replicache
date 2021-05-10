import {expect} from '@esm-bundle/chai';
import {sleep} from './sleep.js';
import {closeAllReps, dbsToDrop, deletaAllDatabases} from './test-util.js';

teardown(async () => {
  await closeAllReps();
  deletaAllDatabases();
});

test('worker test', async () => {
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
