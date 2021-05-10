// This test file is loaded by worker.test.ts

import {Replicache, ReplicacheTest} from './replicache.js';
import type {ReadTransaction, WriteTransaction} from './transactions.js';
import {asyncIterableToArray} from './async-iterable-to-array.js';
import {expect} from '@esm-bundle/chai';
import type {JSONValue} from './json.js';

const reps: Set<Replicache> = new Set();

async function closeAllReps() {
  for (const rep of reps) {
    if (!rep.closed) {
      await rep.close();
    }
    reps.delete(rep);
  }
}

onmessage = async (e: MessageEvent) => {
  // postMessage(Replicache + '');

  const {name, useMemstore} = e.data;
  console.log(e.source, e.origin);
  try {
    await testGethasScanOnEmptyDB(name, useMemstore);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore TypeScripts type defs are incorrect.
    postMessage(undefined);
    await closeAllReps();
  } catch (ex) {
    await closeAllReps();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore TypeScripts type defs are incorrect.
    postMessage(ex);
  }
};

async function testGethasScanOnEmptyDB(name: string, useMemstore = false) {
  const rep = new ReplicacheTest({
    pushDelay: 60_000, // Large to prevent interferin;,
    name,
    useMemstore,
    mutators: {
      testMut: async (
        tx: WriteTransaction,
        args: {key: string; value: JSONValue},
      ) => {
        const key = args['key'];
        const value = args['value'];
        await tx.put(key, value);
        expect(await tx.has(key)).to.equal(true);
        const v = await tx.get(key);
        expect(v).to.deep.equal(value);

        expect(await tx.del(key)).to.equal(true);
        expect(await tx.has(key)).to.be.false;
      },
    },
  });
  reps.add(rep);

  const {testMut} = rep.mutate;

  for (const [key, value] of Object.entries({
    a: true,
    b: false,
    c: null,
    d: 'string',
    e: 12,
    f: {},
    g: [],
    h: {h1: true},
    i: [0, 1],
  })) {
    await testMut({key, value: value as JSONValue});
  }

  async function t(tx: ReadTransaction) {
    expect(await tx.get('key')).to.equal(undefined);
    expect(await tx.has('key')).to.be.false;

    const scanItems = await asyncIterableToArray(tx.scan());
    expect(scanItems).to.have.length(0);
  }

  await t(rep);
  await rep.query(t);
}
