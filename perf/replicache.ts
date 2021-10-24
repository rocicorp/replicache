const valSize = 1024;

import {
  MutatorDefs,
  ReadTransaction,
  Replicache,
  ReplicacheOptions,
  WriteTransaction,
} from '../src/mod';
import {makeRandomStrings, randomString} from './data';
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
  useMemstore: boolean;
}): Benchmark {
  return {
    name: `${opts.useMemstore ? '[MemStore] ' : ''}populate ${valSize}x${
      opts.numKeys
    } (${opts.clean ? 'clean' : 'dirty'}, ${`indexes: ${opts.indexes || 0}`})`,
    group: 'replicache',
    byteSize: opts.numKeys * valSize,
    async run(bencher: Bencher) {
      const rep = await makeRepWithPopulate(opts.useMemstore);
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

export function benchmarkReadTransaction(opts: {
  numKeys: number;
  useMemstore: boolean;
}): Benchmark {
  let rep: ReplicacheWithPopulate;
  return {
    name: `${opts.useMemstore ? '[MemStore] ' : ''}read tx ${valSize}x${
      opts.numKeys
    }`,
    group: 'replicache',
    byteSize: opts.numKeys * valSize,
    async setup() {
      rep = await makeRepWithPopulate(opts.useMemstore);
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

export function benchmarkScan(opts: {
  numKeys: number;
  useMemstore: boolean;
}): Benchmark {
  let rep: ReplicacheWithPopulate;
  return {
    name: `${opts.useMemstore ? '[MemStore] ' : ''}scan ${valSize}x${
      opts.numKeys
    }`,
    group: 'replicache',
    byteSize: opts.numKeys * valSize,

    async setup() {
      rep = await makeRepWithPopulate(opts.useMemstore);
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

export function benchmarkCreateIndex(opts: {
  numKeys: number;
  useMemstore: boolean;
}): Benchmark {
  return {
    name: `${opts.useMemstore ? '[MemStore] ' : ''}create index ${valSize}x${
      opts.numKeys
    }`,
    group: 'replicache',

    async run(bencher: Bencher) {
      const rep = await makeRepWithPopulate(opts.useMemstore);
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

export function sleep(ms: number): Promise<void> {
  return new Promise<void>(resolve => {
    setTimeout(() => resolve(), ms);
  });
}

// goal: 95% of writes/sub/read cycle complete in <1ms with 100 active subscriptions, 5 of which are dirty, which each read 10KB > each, while there is 100MB of data in Replicache.
export function benchmarkWriteSubRead(opts: {
  valueSize: number;
  numSubsTotal: number;
  keysPerSub: number;
  keysWatchedPerSub: number;
  numSubsDirty: number;
  useMemstore: boolean;
}): Benchmark {
  const {valueSize, numSubsTotal, keysPerSub, keysWatchedPerSub, numSubsDirty} =
    opts;

  const numKeys = keysPerSub * numSubsTotal;
  const cacheSizeMB = (numKeys * valueSize) / 1024 / 1024;
  const kbReadPerSub = (keysWatchedPerSub * valueSize) / 1024;

  const data = Array.from({length: numKeys}).map(() => randomString(valueSize));
  const key = (k: number) => `key${k}`;

  return {
    name: `${
      opts.useMemstore ? '[MemStore] ' : ''
    }writeSubRead ${cacheSizeMB}MB total, ${numSubsTotal} subs total, ${numSubsDirty} subs dirty, ${kbReadPerSub}kb read per sub`,
    group: 'replicache',
    async run(bencher: Bencher) {
      const rep = await makeRep({
        useMemstore: opts.useMemstore,
        mutators: {
          // Create `numKeys` key/value pairs, each holding `valueSize` data
          async init(tx: WriteTransaction) {
            for (let i = 0; i < numKeys; i++) {
              await tx.put(key(i), data[i]);
            }
          },
          // For each random data item provided, invalidate a different subscription by writing to the first key it is scanning.
          async invalidate(tx: WriteTransaction, randomData: string[]) {
            for (const [i, val] of randomData.entries()) {
              const keyToChange = key(i * keysPerSub);
              await tx.put(keyToChange, val);
            }
          },
        },
      });

      await rep.mutate.init();
      let onDataCallCount = 0;

      const subs = Array.from({length: numSubsTotal}, (_, i) =>
        rep.subscribe(
          async tx => {
            const start = i * keysPerSub;
            return await tx
              .scan({
                start: {key: key(start)},
                limit: keysWatchedPerSub,
              })
              .toArray();
          },
          {
            onData(v) {
              onDataCallCount++;
              const vals = v as string[];
              for (const [j, val] of vals.entries()) {
                data[i * keysPerSub + j] = val as unknown as string;
              }
            },
          },
        ),
      );

      // We need to wait until all the initial async onData have been called.
      while (onDataCallCount !== numSubsTotal) {
        await sleep(10);
      }

      // Build our random data ahead of time, outside the timed window.
      const changes = [];
      for (let i = 0; i < numSubsDirty; i++) {
        changes.push(randomString(valueSize));
      }

      // OK time the below!
      bencher.reset();

      // In a single transaction, invalidate numSubsDirty subscriptions.
      await rep.mutate.invalidate(changes);

      bencher.stop();

      subs.forEach(c => c());

      assert(onDataCallCount === numSubsTotal + numSubsDirty);
      for (const [i, val] of changes.entries()) {
        const keyChanged = i * keysPerSub;
        assert(data[keyChanged] === val);
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

async function makeRepWithPopulate(useMemstore: boolean) {
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
    useMemstore,
    mutators,
  });
}

export function benchmarks(): Benchmark[] {
  const bs = (useMemstore: boolean) => [
    benchmarkPopulate({numKeys: 1000, clean: true, useMemstore}),
    benchmarkPopulate({numKeys: 1000, clean: false, useMemstore}),
    benchmarkPopulate({numKeys: 1000, clean: true, indexes: 1, useMemstore}),
    benchmarkPopulate({numKeys: 1000, clean: true, indexes: 2, useMemstore}),
    benchmarkReadTransaction({numKeys: 1000, useMemstore}),
    benchmarkReadTransaction({numKeys: 5000, useMemstore}),
    benchmarkScan({numKeys: 1000, useMemstore}),
    benchmarkScan({numKeys: 5000, useMemstore}),
    benchmarkCreateIndex({numKeys: 1000, useMemstore}),
    benchmarkCreateIndex({numKeys: 5000, useMemstore}),
    // write/sub/read 1mb
    benchmarkWriteSubRead({
      valueSize: 1024,
      numSubsTotal: 64,
      keysPerSub: 16,
      keysWatchedPerSub: 16,
      numSubsDirty: 5,
      useMemstore,
    }),
    // write/sub/read 4mb
    benchmarkWriteSubRead({
      valueSize: 1024,
      numSubsTotal: 128,
      keysPerSub: 32,
      keysWatchedPerSub: 16,
      numSubsDirty: 5,
      useMemstore,
    }),
    // write/sub/read 16mb
    benchmarkWriteSubRead({
      valueSize: 1024,
      numSubsTotal: 128,
      keysPerSub: 128,
      keysWatchedPerSub: 16,
      numSubsDirty: 5,
      useMemstore,
    }),
    // 128 mb is unusable
  ];
  return [...bs(false), ...bs(true)];
}
