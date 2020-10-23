/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-check

/* eslint-env browser, es2020 */

import Replicache from '../out/mod.js';

const valSize = 1024;

function randomString(len) {
  var arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return new TextDecoder('ascii').decode(arr);
}

function makeRandomStrings(length) {
  return Array.from({length}, () => randomString(valSize));
}

/**
 * @param {string} name
 */
function deleteDatabase(name) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = resolve;
    req.onerror = reject;
  });
}

let counter = 0;
async function makeRep() {
  const name = `bench${counter++}`;
  await deleteDatabase(name);
  return new Replicache({
    diffServerURL: '',
    name,
    syncInterval: null,
  });
}

/**
 * @param {Replicache} rep
 */
async function populate(rep, {numKeys}, randomStrings) {
  const set = rep.register('populate', async tx => {
    for (let i = 0; i < numKeys; i++) {
      await tx.put(`key${i}`, randomStrings[i]);
    }
  });
  await set({});
}

async function benchmarkPopulate(bench, opts) {
  const rep = await makeRep();
  if (!opts.clean) {
    await populate(rep, opts, makeRandomStrings(opts.numKeys));
  }
  for (let i = 0; i < opts.indexes || 0; i++) {
    const createIndex = rep.register('createIndex', async tx => {
      await tx.createIndex({
        name: `idx${i}`,
        jsonPointer: '',
      });
    });
    await createIndex(null);
  }
  const randomStrings = makeRandomStrings(opts.numKeys);
  bench.reset();
  bench.setName(
    `populate ${valSize}x${opts.numKeys} (${
      opts.clean ? 'clean' : 'dirty'
    }, ${`indexes: ${opts.indexes || 0}`})`,
  );
  bench.setSize(opts.numKeys * valSize);
  await populate(rep, opts, randomStrings);
  bench.stop();
}

async function benchmarkScan(bench, opts) {
  const rep = await makeRep();
  bench.setName(`scan ${valSize}x${opts.numKeys}`);
  bench.setSize(opts.numKeys * valSize);
  await populate(rep, opts, makeRandomStrings(opts.numKeys));
  bench.reset();
  await rep.query(async tx => {
    let count = 0;
    for await (const value of tx.scan()) {
      // use the value to be confident we're not optimizing away.
      // @ts-ignore
      count += value.length;
    }
    console.log(count);
  });
  bench.stop();
}

async function benchmark(fn) {
  const runs = 5;
  const times = [];
  let sum = 0;
  let name = String(fn);
  let size = 0;
  for (let i = 0; i < runs; i++) {
    let t0 = Date.now();
    let t1 = 0;
    await fn({
      reset: () => {
        t0 = Date.now();
      },
      setName: n => (name = n),
      setSize: s => (size = s),
      stop: () => {
        t1 = Date.now();
      },
    });
    if (t1 == 0) {
      t1 = Date.now();
    }
    const dur = t1 - t0;
    times.push(dur);
    sum += dur;
  }

  console.log(sum);

  times.sort();

  const median = times[Math.floor(runs / 2)];
  const value = toMB((size / median) * 1000) + '/s';
  return {name, value, median};
}

const benchmarks = [
  bench => benchmarkPopulate(bench, {numKeys: 1000, clean: true}),
  bench => benchmarkPopulate(bench, {numKeys: 1000, clean: false}),
  // TODO(arv): Re-enable. These cause a quotaexceeded error in playwright that I can't figure out.
  // Does not seem to happen in desktop Chrome.
  // bench => benchmarkPopulate(bench, {numKeys: 1000, clean: true, indexes: 1}),
  // bench => benchmarkPopulate(bench, {numKeys: 1000, clean: true, indexes: 2}),
  bench => benchmarkScan(bench, {numKeys: 1000}),
  bench => benchmarkScan(bench, {numKeys: 5000}),
];

function toMB(bytes) {
  return (bytes / 2 ** 20).toFixed(2) + ' MB';
}

let current = 0;
async function nextTest() {
  if (current < benchmarks.length) {
    return await benchmark(benchmarks[current++]);
  }
  return null;
}

// @ts-ignore
window.nextTest = nextTest;
