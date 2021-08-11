const valSize = 1024;

import {Replicache} from '../out/replicache.mjs';
import {makeRandomStrings} from './data.js';

/**
 * @typedef {import('./perf').Benchmark} Benchmark
 * @typedef {import('./perf').Bencher} Bencher
 * @typedef {import('../out/replicache').WriteTransaction} WriteTransaction
 * @typedef {import('../out/replicache').ReadTransaction} ReadTransaction
 * @typedef {import('../out/replicache').JSONValue} JSONValue
 */

/**
 * @param {unknown} b
 */
function assert(b) {
  // console.assert is not working inside playwright?
  if (!b) {
    throw new Error('Assertion failed');
  }
}

/**
 * @param {{numKeys: number; clean: boolean; indexes?: number;}} opts
 * @returns Benchmark
 */
export function benchmarkPopulate(opts) {
  return {
    name: `populate ${valSize}x${opts.numKeys} (${
      opts.clean ? 'clean' : 'dirty'
    }, ${`indexes: ${opts.indexes || 0}`})`,
    group: 'replicache',
    byteSize: opts.numKeys * valSize,
    /**
     * @param {Bencher} bencher
     */
    async run(bencher) {
      const rep = await makeRepWithPopulate();
      if (!opts.clean) {
        await rep.mutate.populate({
          numKeys: opts.numKeys,
          randomStrings: makeRandomStrings(opts.numKeys, valSize),
        });
      }
      for (let i = 0; i < (opts.indexes || 0); i++) {
        await rep.createIndex({
          name: `idx${i}`,
          jsonPointer: '',
        });
      }
      const randomStrings = makeRandomStrings(opts.numKeys, valSize);
      bencher.reset();
      await rep.mutate.populate({numKeys: opts.numKeys, randomStrings});
      bencher.stop();
      await rep.close();
    },
  };
}

/**
 * @param {{numKeys: number;}} opts
 * @returns Benchmark
 */
export function benchmarkReadTransaction(opts) {
  return {
    name: `read tx ${valSize}x${opts.numKeys}`,
    group: 'replicache',
    byteSize: opts.numKeys * valSize,
    rep: /** @type Replicache */ (/** @type unknown */ (null)),
    async setup() {
      this.rep = await makeRepWithPopulate();
      await this.rep.mutate.populate({
        numKeys: opts.numKeys,
        randomStrings: makeRandomStrings(opts.numKeys, valSize),
      });
    },
    async teardown() {
      await this.rep.close();
    },
    async run(/** @type Bencher */ bench) {
      let getCount = 0;
      let hasCount = false;
      await this.rep.query(async (/** @type ReadTransaction */ tx) => {
        for (let i = 0; i < opts.numKeys; i++) {
          // use the values to be confident we're not optimizing away.
          // @ts-ignore
          getCount += (await tx.get(`key${i}`)).length;
          // @ts-ignore
          hasCount = (await tx.has(`key${i}`)) === true ? 1 : 0;
        }
      });
      bench.stop();
      console.log(getCount, hasCount);
    },
  };
}

/**
 * @param {{numKeys: number;}} opts
 * @returns Benchmark
 */
export function benchmarkScan(opts) {
  return {
    name: `scan ${valSize}x${opts.numKeys}`,
    group: 'replicache',
    byteSize: opts.numKeys * valSize,
    rep: /** @type Replicache */ (/** @type unknown */ (null)),
    async setup() {
      this.rep = await makeRepWithPopulate();

      await this.rep.mutate.populate({
        numKeys: opts.numKeys,
        randomStrings: makeRandomStrings(opts.numKeys, valSize),
      });
    },
    async teardown() {
      await this.rep.close();
    },
    async run() {
      await this.rep.query(async (/** @type ReadTransaction} */ tx) => {
        let count = 0;
        for await (const value of tx.scan()) {
          // use the value to be confident we're not optimizing away.
          // @ts-ignore
          count += value.length;
        }
        console.log(count);
      });
    },
  };
}

/**
 * @returns Benchmark
 */
export function benchmarkSingleByteWrite() {
  return {
    name: 'write single byte',
    group: 'replicache',
    byteSize: 1,
    rep: /** @type Replicache */ (/** @type unknown */ (null)),
    write: /** @type {(a: number) => Promise<void>} */ (
      /** @type unknown */ (null)
    ),
    async setup() {
      this.rep = await makeRep({
        mutators: {
          write: (/** @type WriteTransaction */ tx, /** @type number */ i) =>
            tx.put('k', i % 10),
        },
      });
      this.write = this.rep.mutate.write;
    },
    async teardown() {
      await this.rep.close();
    },
    /**
     * @param {Bencher} _
     * @param {number} i
     */
    async run(_, i) {
      await this.write(i);
    },
  };
}

/**
 * @param {{numKeys: number;}} opts
 * @returns Benchmark
 */
export function benchmarkCreateIndex(opts) {
  return {
    name: `create index ${valSize}x${opts.numKeys}`,
    group: 'replicache',
    /**
     * @param {Bencher} bencher
     */
    async run(bencher) {
      const rep = await makeRepWithPopulate();
      await rep.mutate.populate({
        numKeys: opts.numKeys,
        randomStrings: makeRandomStrings(opts.numKeys, valSize),
      });
      bencher.reset();
      await rep.createIndex({
        name: `idx`,
        jsonPointer: '',
      });
      bencher.stop();
      await rep.close();
    },
  };
}

/**
 * @returns Benchmark
 */
export function benchmarkWriteReadRoundTrip() {
  /** @type string */
  let key;
  /** @type number */
  let value;
  return {
    name: 'roundtrip write/subscribe/get',
    group: 'replicache',
    rep: /** @type Replicache */ (/** @type unknown */ (null)),
    async setup() {
      this.rep = await makeRep({
        mutators: {
          write: (/** @type WriteTransaction */ tx) => tx.put(key, value),
        },
      });
    },
    async teardown() {
      await this.rep.close();
    },
    /**
     * @param {Bencher} bench
     * @param {number} i
     */
    async run(bench, i) {
      key = `k${i}`;
      value = i;
      let {promise, resolve} = resolver();
      const unsubscribe = this.rep.subscribe(
        (/** @type ReadTransaction */ tx) => tx.get(key),
        {
          onData(/** @type JSONValue | undefined */ res) {
            // `resolve` binding needs to be looked up on every iteration
            resolve(res);
          },
        },
      );
      // onData is called once when calling subscribe
      await promise;

      // reset these.
      ({promise, resolve} = resolver());

      await this.rep.mutate.write();

      const res = await promise;
      if (res !== value) {
        throw new Error();
      }

      bench.stop();
      unsubscribe();
    },
  };
}

/**
 * @param {number} ms
 */
export function sleep(ms) {
  return new Promise(resolve => {
    // @ts-ignore
    setTimeout(() => resolve(), ms);
  });
}

/**
 * @param {{count: number;}} opts
 * @returns Benchmark
 */
export function benchmarkSubscribe(opts) {
  const {count} = opts;
  const maxCount = 1000;
  const minCount = 10;
  const key = (/** @type {number} */ k) => `key${k}`;
  if (count > maxCount) {
    throw new Error('Please increase maxCount');
  }
  return {
    name: `subscription ${count}`,
    group: 'replicache',
    /**
     * @param {Bencher} bencher
     */
    async run(bencher) {
      const rep = await makeRep({
        mutators: {
          /**
           * @param {WriteTransaction} tx
           * @param {number} count
           */
          async init(tx) {
            await Promise.all(
              Array.from({length: maxCount}, (_, i) => tx.put(key(i), i)),
            );
          },
          /**
           * @param {WriteTransaction} tx
           * @param {{key: string, val: JSONValue}} options
           */
          async put(tx, options) {
            await tx.put(options.key, options.val);
          },
        },
      });

      await rep.mutate.init(count);
      const data = Array.from({length: count}).fill(0);
      let onDataCallCount = 0;
      const subs = Array.from({length: count}, (_, i) =>
        rep.subscribe((/** @type {ReadTransaction} */ tx) => tx.get(key(i)), {
          onData(/** @type {JSONValue} */ v) {
            onDataCallCount++;
            data[i] = v;
          },
        }),
      );

      // We need to wait until all the initial async onData have been called.
      while (onDataCallCount !== count) {
        await sleep(10);
      }

      // The number of mutations to do. These should each trigger one
      // subscription. The goal of this test is to ensure that we are only
      // paying the runtime cost of subscriptions that are affected by the
      // changes.
      const mut = 10;
      if (mut < minCount) {
        throw new Error('Please decrease minCount');
      }
      const rand = Math.random();

      bencher.reset();

      for (let i = 0; i < mut; i++) {
        await rep.mutate.put({key: key(i), val: i ** 2 + rand});
      }

      bencher.stop();

      subs.forEach(c => c());

      assert(onDataCallCount === count + mut);
      for (let i = 0; i < count; i++) {
        assert(data[i] === (i < mut ? i ** 2 + rand : i));
      }

      await rep.close();
    },
  };
}

/**
 * @param {{count: number;}} opts
 * @returns Benchmark
 */
export function benchmarkSubscribeSetup(opts) {
  const {count} = opts;
  const maxCount = 1000;
  const key = (/** @type {number} */ k) => `key${k}`;
  if (count > maxCount) {
    throw new Error('Please increase maxCount');
  }
  return {
    name: `subscription setup ${count}`,
    group: 'replicache',
    /**
     * @param {Bencher} bencher
     */
    async run(bencher) {
      const rep = await makeRep({
        mutators: {
          /**
           * @param {WriteTransaction} tx
           * @param {number} count
           */
          async init(tx) {
            await Promise.all(
              Array.from({length: maxCount}, (_, i) => tx.put(key(i), i)),
            );
          },
        },
      });

      await rep.mutate.init(count);
      const data = Array.from({length: count}).fill(0);
      let onDataCallCount = 0;
      bencher.reset();
      for (let i = 0; i < count; i++) {
        rep.subscribe((/** @type {ReadTransaction} */ tx) => tx.get(key(i)), {
          onData(/** @type {JSONValue} */ v) {
            onDataCallCount++;
            data[i] = v;

            if (onDataCallCount === count) {
              bencher.stop();
            }
          },
        });
      }

      // We need to wait until all the initial async onData have been called.
      while (onDataCallCount !== count) {
        await sleep(1);
      }

      for (let i = 0; i < count; i++) {
        assert(data[i] === i);
      }

      await rep.close();
    },
  };
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
async function makeRep(options = {}) {
  const name = `bench${counter++}`;
  await deleteDatabase(name);
  return new Replicache({
    name,
    pullInterval: null,
    ...options,
  });
}

async function makeRepWithPopulate() {
  return makeRep({
    mutators: {
      populate: async (
        /** @type WriteTransaction} */ tx,
        /** @type {{numKeys: number, randomStrings: string[]}} */ {
          numKeys,
          randomStrings,
        },
      ) => {
        for (let i = 0; i < numKeys; i++) {
          await tx.put(`key${i}`, randomStrings[i]);
        }
      },
    },
  });
}

/**
 * @template R
 * @returns {{promise: Promise<R>, resolve: (res: R) => void}}
 */
function resolver() {
  let resolve = /** @type {(res: R) => void} */ (/** @type unknown */ (null));
  const promise = new Promise(res => {
    resolve = res;
  });
  return {promise, resolve};
}
