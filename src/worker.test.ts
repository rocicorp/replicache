import {expect} from '@esm-bundle/chai';
import {sleep} from './sleep.js';

const dbsToDrop = new Set<string>();

teardown(async () => {
  for (const name of dbsToDrop) {
    indexedDB.deleteDatabase(name);
  }
  dbsToDrop.clear();
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
  return timeout(p);
}

async function timeout<T>(p: Promise<T>): Promise<T> {
  return Promise.race([
    p,
    sleep(3000).then(() => Promise.reject(new Error('Timed out'))),
  ]);
}
