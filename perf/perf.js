/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-check

/* eslint-env browser, es2020 */

import Replicache from '../out/replicache.js';

console.assert = console.debug = console.error = console.info = console.log = console.warn = () =>
  void 0;

const valSize = 1024;

function randomString(len) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) {
    // Don't allow \0 in the string because these values are used as secondary
    // keys when building indexes and we do not allow \0 there so it slows down
    // the benchmark.
    if (arr[i] === 0) {
      arr[i] = 1;
    }
  }
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
    req.onerror = req.onblocked = req.onupgradeneeded = reject;
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

function makeLastRep() {
  const name = `bench${counter - 1}`;
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
  await set();
}

async function benchmarkPopulate(bench, opts) {
  const rep = await makeRep();
  if (!opts.clean) {
    await populate(rep, opts, makeRandomStrings(opts.numKeys));
  }
  for (let i = 0; i < opts.indexes || 0; i++) {
    await rep.createIndex({
      name: `idx${i}`,
      jsonPointer: '',
    });
  }
  const randomStrings = makeRandomStrings(opts.numKeys);
  bench.reset();
  bench.name = `populate ${valSize}x${opts.numKeys} (${
    opts.clean ? 'clean' : 'dirty'
  }, ${`indexes: ${opts.indexes || 0}`})`;
  bench.size = opts.numKeys * valSize;
  await populate(rep, opts, randomStrings);
  bench.stop();
  await rep.close();
}

async function benchmarkReadTransaction(bench, opts) {
  await bench.setup(async () => {
    bench.name = `read tx ${valSize}x${opts.numKeys}`;
    bench.size = opts.numKeys * valSize;
    const rep = await makeRep();
    await populate(rep, opts, makeRandomStrings(opts.numKeys));
    await rep.close();
  });
  const rep = makeLastRep();

  await populate(rep, opts, makeRandomStrings(opts.numKeys));
  bench.reset();
  await rep.query(async tx => {
    let getCount = 0;
    let hasCount = false;
    for (let i = 0; i < opts.numKeys; i++) {
      // use the values to be confident we're not optimizing away.
      // @ts-ignore
      getCount += (await tx.get(`key${i}`)).length;
      // @ts-ignore
      hasCount = (await tx.has(`key${i}`)) === true ? 1 : 0;
    }

    console.log(getCount, hasCount);
  });
  bench.stop();
  await rep.close();
}

async function benchmarkScan(bench, opts) {
  await bench.setup(async () => {
    bench.name = `scan ${valSize}x${opts.numKeys}`;
    bench.size = opts.numKeys * valSize;
    const rep = await makeRep();
    await populate(rep, opts, makeRandomStrings(opts.numKeys));
    await rep.close();
  });
  const rep = makeLastRep();

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
  await rep.close();
}

async function benchmarkSingleByteWrite(bench, i) {
  const rep = await makeRep();
  const write = rep.register('write', tx => tx.put('k', i % 10));
  bench.name = 'write single byte';
  bench.size = 1;
  bench.formatter = formatTxPerSecond;
  bench.reset();

  await write();

  bench.stop();
  await rep.close();
}

async function benchmark(fn) {
  // Execute fn at least this many runs.
  const minRuns = 5;
  // Execute fn at least for this long.
  const minTime = 2000;
  const times = [];
  let sum = 0;
  let name = String(fn);
  let size = 0;
  let format = formatToMBPerSecond;
  let setupCalled = false;
  for (let i = 0; i < minRuns || sum < minTime; i++) {
    let t0 = Date.now();
    let t1 = 0;
    await fn(
      {
        reset() {
          t0 = Date.now();
        },
        stop() {
          t1 = Date.now();
        },
        set name(n) {
          name = n;
        },
        set size(s) {
          size = s;
        },
        set formatter(f) {
          format = f;
        },
        async setup(f) {
          if (!setupCalled) {
            await f();
            setupCalled = true;
          }
        },
      },
      i,
    );
    if (t1 == 0) {
      t1 = Date.now();
    }
    const dur = t1 - t0;
    times.push(dur);
    sum += dur;
  }

  console.log(sum);

  times.sort();
  const runs = times.length;

  const median = times[Math.floor(runs / 2)];
  const value = format(size, median);

  return {name, value, median, runs};
}

function formatToMBPerSecond(size, timeMS) {
  const bytes = (size / timeMS) * 1000;
  return (bytes / 2 ** 20).toFixed(2) + ' MB/s';
}

function formatTxPerSecond(size, timeMS) {
  return ((size / timeMS) * 1000).toFixed(2) + ' tx/s';
}

const benchmarks = [
  bench => benchmarkPopulate(bench, {numKeys: 1000, clean: true}),
  bench => benchmarkPopulate(bench, {numKeys: 1000, clean: false}),
  bench => benchmarkPopulate(bench, {numKeys: 1000, clean: true, indexes: 1}),
  bench => benchmarkPopulate(bench, {numKeys: 1000, clean: true, indexes: 2}),
  bench => benchmarkReadTransaction(bench, {numKeys: 1000}),
  bench => benchmarkReadTransaction(bench, {numKeys: 5000}),
  bench => benchmarkScan(bench, {numKeys: 1000}),
  bench => benchmarkScan(bench, {numKeys: 5000}),
  benchmarkSingleByteWrite,
];

let current = 0;
async function nextTest() {
  if (current < benchmarks.length) {
    return await benchmark(benchmarks[current++]);
  }
  return null;
}

// @ts-ignore
window.nextTest = nextTest;
