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
async function populate(rep, {numKeys}) {
  const set = rep.register('populate', async tx => {
    for (let i = 0; i < numKeys; i++) {
      await tx.put(`key${i}`, randomString(valSize));
    }
  });
  await set({});
}

async function benchmarkPopulate(bench, opts) {
  const rep = await makeRep();
  if (!opts.clean) {
    await populate(rep, opts);
  }
  bench.reset();
  bench.setName(
    `populate ${valSize}x${opts.numKeys} (${opts.clean ? 'clean' : 'dirty'})`,
  );
  bench.setSize(opts.numKeys * valSize);
  await populate(rep, opts);
}

async function benchmarkScan(bench, opts) {
  const rep = await makeRep();
  bench.setName(`scan ${valSize}x${opts.numKeys}`);
  bench.setSize(opts.numKeys * valSize);
  await populate(rep, opts);
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
}

async function benchmark(fn) {
  const runs = 5;
  const times = [];
  let sum = 0;
  let name = String(fn);
  let size = 0;
  for (let i = 0; i < runs; i++) {
    let t0 = Date.now();
    await fn({
      reset: () => {
        t0 = Date.now();
      },
      setName: n => (name = n),
      setSize: s => (size = s),
    });
    const dur = Date.now() - t0;
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
