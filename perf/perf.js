/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-check

/* eslint-env browser, es2020 */

import Replicache from '../out/replicache.js';

console.assert = console.debug = console.error = console.info = console.log = console.warn = () =>
  void 0;

const valSize = 1024;

/**
 * @template R
 * @returns {{promise: Promise<R>, resolve: (res: R) => void}}
 */
function resolver() {
  let resolve;
  const promise = new Promise(res => {
    resolve = res;
  });
  return {promise, resolve};
}

/**
 * @param {number} len
 */
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

/**
 * @param {number} length
 */
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
    clientViewURL: '',
    diffServerURL: '',
    name,
    syncInterval: null,
  });
}

/**
 * @param {Replicache} rep
 * @param {{numKeys: number}}
 * @param {string[]} randomStrings
 */
async function populate(rep, {numKeys}, randomStrings) {
  const set = rep.register('populate', async tx => {
    for (let i = 0; i < numKeys; i++) {
      await tx.put(`key${i}`, randomStrings[i]);
    }
  });
  await set();
}

/**
 * @param {Bench} bench
 * @param {{numKeys: number; clean: boolean; indexes?: number;}} opts
 */
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

/** @typedef {{
 *   setup: (body: () => Promise<void> | void) => Promise<void>;
 *   teardown: () => Promise<void> | void;
 *   name: string;
 *   size: number;
 *   reset: () => void;
 *   stop: () => void;
 *   formatter: (size: number, timeMS: number) => string;
 * }}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let Bench;

/** @type {Replicache} */
let rep;

async function benchmarkReadTransaction(bench, opts) {
  await bench.setup(async () => {
    bench.name = `read tx ${valSize}x${opts.numKeys}`;
    bench.size = opts.numKeys * valSize;
    rep = await makeRep();
    await populate(rep, opts, makeRandomStrings(opts.numKeys));
  });
  bench.teardown = async () => {
    await rep.close();
  };

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
}

/**
 * @param {Bench} bench
 * @param {{numKeys: number;}} opts
 */
async function benchmarkScan(bench, opts) {
  await bench.setup(async () => {
    bench.name = `scan ${valSize}x${opts.numKeys}`;
    bench.size = opts.numKeys * valSize;
    rep = await makeRep();
    await populate(rep, opts, makeRandomStrings(opts.numKeys));
  });
  bench.teardown = async () => {
    await rep.close();
  };

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

/**
 * @param {Bench} bench
 * @param {number} i
 */
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

/**
 * @param {Bench} bench
 * @param {{numKeys: number;}} opts
 */
async function createIndex(bench, opts) {
  const rep = await makeRep();
  await populate(rep, opts, makeRandomStrings(opts.numKeys));
  bench.name = `create index ${valSize}x${opts.numKeys}`;
  bench.size = 1;
  bench.formatter = formatOpPerSecond;
  bench.reset();
  await rep.createIndex({
    name: `idx`,
    jsonPointer: '',
  });

  bench.stop();
  await rep.close();
}

/**
 * @param {Bench} bench
 * @param {number} i
 */
async function benchmarkWriteReadRoundTrip(bench, i) {
  await bench.setup(async () => {
    rep = await makeRep();
  });
  bench.teardown = async () => {
    await rep.close();
  };
  const key = `k${i}`;
  const value = i;
  let {promise, resolve} = resolver();
  const unsubscribe = rep.subscribe(tx => tx.get(key), {
    onData(res) {
      // `resolve` binding needs to be looked up on every iteration
      resolve(res);
    },
  });
  // onData is called once when calling subscribe
  await promise;

  const write = rep.register('write', tx => tx.put(key, value));
  bench.name = 'roundtrip write/subscribe/get';
  bench.size = 1;
  bench.formatter = formatOpPerSecond;
  bench.reset();

  // reset these.
  ({promise, resolve} = resolver());

  await write();

  const res = await promise;
  if (res !== value) {
    throw new Error();
  }

  bench.stop();
  unsubscribe();
}

/**
 * @param {(bench: Bench, i: number) => void | Promise<void>} fn
 */
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
  /** @type {(() => Promise<void> | void) | undefined} */
  let teardown;
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
        /**
         * @param {string} n
         */
        set name(n) {
          name = n;
        },
        /**
         * @param {number} s
         */
        set size(s) {
          size = s;
        },
        /**
         * @return {number} s
         */
        get size() {
          return size;
        },
        /**
         * @param {(size: number, timeMS: number) => string} f
         */
        set formatter(f) {
          format = f;
        },
        /**
         * @param {() => void | Promise<void>} f
         */
        async setup(f) {
          if (!setupCalled) {
            await f();
            setupCalled = true;
          }
        },

        /**
         * @param {() => (Promise<void> | void) } f
         */
        set teardown(f) {
          teardown = f;
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

  if (teardown) {
    await teardown();
  }

  console.log(sum);

  times.sort();
  const runs = times.length;

  const median = times[Math.floor(runs / 2)];
  const value = format(size, median);

  return {name, value, median, runs};
}

/**
 * @param {number} size
 * @param {number} timeMS
 */
function formatToMBPerSecond(size, timeMS) {
  const bytes = (size / timeMS) * 1000;
  return (bytes / 2 ** 20).toFixed(2) + ' MB/s';
}

/**
 * @param {string} x
 * @return {(size: number, timeMS: number) => string}
 */
function makeFormatXPerSecond(x) {
  return (size, timeMS) => `${((size / timeMS) * 1000).toFixed(2)} ${x}/s`;
}

const formatTxPerSecond = makeFormatXPerSecond('tx');
const formatOpPerSecond = makeFormatXPerSecond('op');

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
  benchmarkWriteReadRoundTrip,
  bench => createIndex(bench, {numKeys: 1000}),
  bench => createIndex(bench, {numKeys: 5000}),
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
