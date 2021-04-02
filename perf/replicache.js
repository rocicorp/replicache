const valSize = 1024;

import {Replicache} from '../out/replicache.mjs';
import {makeRandomStrings} from './data.js';

/**
 * @typedef {import('./perf').Benchmark} Benchmark
 * @typedef {import('./perf').Bencher} Bencher
 * @typedef {import('../out/replicache').WriteTransaction} WriteTransaction
 */

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
      const rep = await makeRep();
      if (!opts.clean) {
        await populate(rep, opts, makeRandomStrings(opts.numKeys, valSize));
      }
      for (let i = 0; i < (opts.indexes || 0); i++) {
        await rep.createIndex({
          name: `idx${i}`,
          jsonPointer: '',
        });
      }
      const randomStrings = makeRandomStrings(opts.numKeys, valSize);
      bencher.reset();
      await populate(rep, opts, randomStrings);
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
      this.rep = await makeRep();
      await populate(this.rep, opts, makeRandomStrings(opts.numKeys, valSize));
    },
    async teardown() {
      await this.rep.close();
    },
    async run(bench) {
      let getCount = 0;
      let hasCount = false;
      await this.rep.query(async tx => {
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
      this.rep = await makeRep();
      await populate(this.rep, opts, makeRandomStrings(opts.numKeys, valSize));
    },
    async teardown() {
      await this.rep.close();
    },
    async run() {
      await this.rep.query(async tx => {
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
      this.rep = await makeRep();
      this.write = this.rep.register('write', (
        /** @type {WriteTransaction} */ tx,
        /** @type {number} */ i,
      ) => tx.put('k', i % 10));
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
      const rep = await makeRep();
      await populate(rep, opts, makeRandomStrings(opts.numKeys, valSize));
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
  return {
    name: 'roundtrip write/subscribe/get',
    group: 'replicache',
    rep: /** @type Replicache */ (/** @type unknown */ (null)),
    async setup() {
      this.rep = await makeRep();
    },
    async teardown() {
      await this.rep.close();
    },
    /**
     * @param {Bencher} bench
     * @param {number} i
     */
    async run(bench, i) {
      const key = `k${i}`;
      const value = i;
      let {promise, resolve} = resolver();
      const unsubscribe = this.rep.subscribe(tx => tx.get(key), {
        onData(res) {
          // `resolve` binding needs to be looked up on every iteration
          resolve(res);
        },
      });
      // onData is called once when calling subscribe
      await promise;

      const write = this.rep.register('write', tx => tx.put(key, value));
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
async function makeRep() {
  const name = `bench${counter++}`;
  await deleteDatabase(name);
  return new Replicache({
    name,
    pullInterval: null,
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
