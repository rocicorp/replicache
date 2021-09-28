const valSize = 1024;

import {
  JSONValue,
  MutatorDefs,
  ReadonlyJSONValue,
  ReadTransaction,
  Replicache,
  ReplicacheOptions,
  WriteTransaction,
} from '../src/mod';
import {resolver} from '../src/resolver';
import {makeRandomStrings} from './data';
import type {Bencher, Benchmark} from './perf';

type Truthy<T> = T extends null | undefined | false | '' | 0 ? never : T;

export function assert<T>(b: T): asserts b is Truthy<T> {
  if (!b) {
    throw new Error('Assertion failed');
  }
}

export function benchmarkPopulate(opts: {
  numKeys: number;
  clean: boolean;
  indexes?: number;
}): Benchmark {
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

export function benchmarkReadTransaction(opts: {numKeys: number}): Benchmark {
  let rep: ReplicacheWithPopulate;
  return {
    name: `read tx ${valSize}x${opts.numKeys}`,
    group: 'replicache',
    byteSize: opts.numKeys * valSize,
    async setup() {
      rep = await makeRepWithPopulate();
      await rep.mutate.populate({
        numKeys: opts.numKeys,
        randomStrings: makeRandomStrings(opts.numKeys, valSize),
      });
    },
    async teardown() {
      await rep.close();
    },
    async run(bench: Bencher) {
      let getCount = 0;
      let hasCount = 0;
      await rep.query(async (tx: ReadTransaction) => {
        for (let i = 0; i < opts.numKeys; i++) {
          // use the values to be confident we're not optimizing away.
          getCount += ((await tx.get(`key${i}`)) as ArrayLike<unknown>).length;
          hasCount += (await tx.has(`key${i}`)) === true ? 1 : 0;
        }
      });
      bench.stop();
      console.log(getCount, hasCount);
    },
  };
}

export function benchmarkScan(opts: {numKeys: number}): Benchmark {
  let rep: ReplicacheWithPopulate;
  return {
    name: `scan ${valSize}x${opts.numKeys}`,
    group: 'replicache',
    byteSize: opts.numKeys * valSize,

    async setup() {
      rep = await makeRepWithPopulate();
      await rep.mutate.populate({
        numKeys: opts.numKeys,
        randomStrings: makeRandomStrings(opts.numKeys, valSize),
      });
    },
    async teardown() {
      await rep.close();
    },
    async run() {
      await rep.query(async (tx: ReadTransaction) => {
        let count = 0;
        for await (const value of tx.scan()) {
          // use the value to be confident we're not optimizing away.
          count += (value as ArrayLike<unknown>).length;
        }
        console.log(count);
      });
    },
  };
}

export function benchmarkCreateIndex(opts: {numKeys: number}): Benchmark {
  return {
    name: `create index ${valSize}x${opts.numKeys}`,
    group: 'replicache',

    async run(bencher: Bencher) {
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

export function benchmarkWriteReadRoundTrip(): Benchmark {
  let key: string;
  let value: number;
  const mutators = {
    write: (tx: WriteTransaction) => tx.put(key, value),
  };
  let rep: Replicache<typeof mutators>;
  return {
    name: 'roundtrip write/subscribe/get',
    group: 'replicache',
    async setup() {
      rep = await makeRep({
        mutators,
      });
    },
    async teardown() {
      await rep.close();
    },

    async run(bench: Bencher, i: number) {
      key = `k${i}`;
      value = i;
      let {promise, resolve} = resolver<ReadonlyJSONValue | undefined>();
      const unsubscribe = rep.subscribe((tx: ReadTransaction) => tx.get(key), {
        onData(res: ReadonlyJSONValue | undefined) {
          // `resolve` binding needs to be looked up on every iteration
          resolve(res);
        },
      });
      // onData is called once when calling subscribe
      await promise;

      // reset these.
      ({promise, resolve} = resolver());

      await rep.mutate.write();

      const res = await promise;
      if (res !== value) {
        throw new Error();
      }

      bench.stop();
      unsubscribe();
    },
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise<void>(resolve => {
    setTimeout(() => resolve(), ms);
  });
}

export function benchmarkSubscribe(opts: {count: number}): Benchmark {
  const {count} = opts;
  const maxCount = 1000;
  const minCount = 10;
  const key = (k: number) => `key${k}`;
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
          async init(tx: WriteTransaction) {
            await Promise.all(
              Array.from({length: maxCount}, (_, i) => tx.put(key(i), i)),
            );
          },
          async put(
            tx: WriteTransaction,
            options: {key: string; val: JSONValue},
          ) {
            await tx.put(options.key, options.val);
          },
        },
      });

      await rep.mutate.init();
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

export function benchmarkSubscribeSetup(opts: {count: number}): Benchmark {
  const {count} = opts;
  const maxCount = 1000;
  const key = (k: number) => `key${k}`;
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

      await rep.mutate.init();
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

function deleteDatabase(name: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = resolve;
    req.onerror = req.onblocked = req.onupgradeneeded = reject;
  });
}

let counter = 0;
async function makeRep<MD extends MutatorDefs>(
  options: ReplicacheOptions<MD> = {},
) {
  const name = `bench${counter++}`;
  await deleteDatabase(name);
  return new Replicache<MD>({
    name,
    pullInterval: null,
    ...options,
  });
}

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type ReplicacheWithPopulate = UnwrapPromise<
  ReturnType<typeof makeRepWithPopulate>
>;

async function makeRepWithPopulate() {
  const mutators = {
    populate: async (
      tx: WriteTransaction,
      {numKeys, randomStrings}: {numKeys: number; randomStrings: string[]},
    ) => {
      for (let i = 0; i < numKeys; i++) {
        await tx.put(`key${i}`, randomStrings[i]);
      }
    },
  };
  return makeRep({
    mutators,
  });
}
