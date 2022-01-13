const valSize = 1024;

import {deepEqual} from '../src/json';
import {assert} from '../src/asserts';
import {
  MutatorDefs,
  PatchOperation,
  ReadTransaction,
  Replicache,
  ReplicacheOptions,
  WriteTransaction,
} from '../src/mod';
import {jsonArrayTestData, TestDataObject, jsonObjectTestData} from './data';
import type {Bencher, Benchmark} from './perf';
import {range, sampleSize} from 'lodash-es';
import {makeIdbName} from '../src/replicache';

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
      const rep = await makeRepWithPopulate();
      if (!opts.clean) {
        await rep.mutate.populate({
          numKeys: opts.numKeys,
          randomValues: jsonArrayTestData(opts.numKeys, valSize),
        });
      }
      for (let i = 0; i < (opts.indexes || 0); i++) {
        await rep.createIndex({
          name: `idx${i}`,
          jsonPointer: '/ascii',
        });
      }
      const randomValues = jsonArrayTestData(opts.numKeys, valSize);
      bencher.reset();
      await rep.mutate.populate({numKeys: opts.numKeys, randomValues});
      bencher.stop();
      await rep.close();
    },
  };
}

class ReplicacheWithPersist<MD extends MutatorDefs> extends Replicache {
  constructor(options: ReplicacheOptions<MD>) {
    super(options);
  }
  async persist(): Promise<void> {
    return this._persist();
  }
}

async function setupPersistedData(
  replicacheName: string,
  numKeys: number,
): Promise<void> {
  const randomValues = jsonArrayTestData(numKeys, valSize);
  const patch: PatchOperation[] = [];
  for (let i = 0; i < numKeys; i++) {
    patch.push({
      op: 'put',
      key: `key${i}`,
      value: randomValues[i],
    });
  }

  await deleteDatabase(makeIdbName(replicacheName));
  const repForStore = new ReplicacheWithPersist({
    name: replicacheName,
    pullInterval: null,
    puller: async (_: Request) => {
      return {
        response: {
          lastMutationID: 0,
          patch,
        },
        httpRequestInfo: {
          httpStatusCode: 200,
          errorMessage: '',
        },
      };
    },
  });

  let initialPullComplete = false;
  while (!initialPullComplete) {
    await sleep(10);
    initialPullComplete = await repForStore.query(
      async (tx: ReadTransaction) => {
        return (await tx.get('key0')) !== undefined;
      },
    );
  }
  await repForStore.persist();
  await repForStore.close();
}

export function benchmarkStartupUsingBasicReadsFromPersistedData(opts: {
  numKeysPersisted: number;
  numKeysToRead: number;
  useMemstore: boolean;
}): Benchmark {
  const repName = 'benchmarkStartupUsingBasicReadsFromPersistedData';
  return {
    name: `${opts.useMemstore ? '[MemStore] ' : ''}startup read ${valSize}x${
      opts.numKeysToRead
    } from ${valSize}x${opts.numKeysPersisted} stored`,
    group: 'replicache',
    byteSize: opts.numKeysToRead * valSize,
    async setup() {
      await setupPersistedData(repName, opts.numKeysPersisted);
    },
    async run(bencher: Bencher) {
      const randomKeysToRead = sampleSize(
        range(opts.numKeysPersisted),
        opts.numKeysToRead,
      ).map(i => `key${i}`);
      bencher.reset();
      const rep = new Replicache({
        name: repName,
        pullInterval: null,
      });
      let getCount = 0;
      await rep.query(async (tx: ReadTransaction) => {
        for (const randomKey of randomKeysToRead) {
          // use the values to be confident we're not optimizing away.
          getCount += Object.keys(
            (await tx.get(randomKey)) as TestDataObject,
          ).length;
        }
      });
      bencher.stop();
      console.log(getCount);
      await rep.close();
    },
  };
}

export function benchmarkStartupUsingScanFromPersistedData(opts: {
  numKeysPersisted: number;
  numKeysToRead: number;
  useMemstore: boolean;
}): Benchmark {
  const repName = 'benchmarkStartupUsingScanFromPersistedData';
  return {
    name: `${opts.useMemstore ? '[MemStore] ' : ''}startup scan ${valSize}x${
      opts.numKeysToRead
    } from ${valSize}x${opts.numKeysPersisted} stored`,
    group: 'replicache',
    byteSize: opts.numKeysToRead * valSize,
    async setup() {
      await setupPersistedData(repName, opts.numKeysPersisted);
    },
    async run(bencher: Bencher) {
      const randomIndex = Math.floor(
        Math.random() * (opts.numKeysPersisted - opts.numKeysToRead),
      );
      const keys = Array.from(
        {length: opts.numKeysPersisted - opts.numKeysToRead},
        (_, index) => `key${index}`,
      );
      const sortedKeys = keys.sort();
      const randomStartKey = sortedKeys[randomIndex];
      bencher.reset();
      const rep = new Replicache({
        name: repName,
        pullInterval: null,
      });
      await rep.query(async (tx: ReadTransaction) => {
        let count = 0;
        for await (const value of tx.scan({
          start: {key: randomStartKey},
          limit: 100,
        })) {
          // use the value to be confident we're not optimizing away.
          count += Object.keys(value as TestDataObject).length;
        }
        console.log(count);
      });
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
      rep = await makeRepWithPopulate();
      await rep.mutate.populate({
        numKeys: opts.numKeys,
        randomValues: jsonArrayTestData(opts.numKeys, valSize),
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
          getCount += Object.keys(
            (await tx.get(`keys${i}`)) as TestDataObject,
          ).length;
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
      rep = await makeRepWithPopulate();
      await rep.mutate.populate({
        numKeys: opts.numKeys,
        randomValues: jsonArrayTestData(opts.numKeys, valSize),
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
      const rep = await makeRepWithPopulate();
      await rep.mutate.populate({
        numKeys: opts.numKeys,
        randomValues: jsonArrayTestData(opts.numKeys, valSize),
      });
      bencher.reset();
      await rep.createIndex({
        name: `idx`,
        jsonPointer: '/ascii',
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
  const makeKey = (index: number) => `key${index}`;

  return {
    name: `${
      opts.useMemstore ? '[MemStore] ' : ''
    }writeSubRead ${cacheSizeMB}MB total, ${numSubsTotal} subs total, ${numSubsDirty} subs dirty, ${kbReadPerSub}kb read per sub`,
    group: 'replicache',
    async run(bencher: Bencher) {
      const keys = Array.from({length: numKeys}, (_, index) => makeKey(index));
      const sortedKeys = keys.sort();
      const data: Map<string, TestDataObject> = new Map(
        keys.map(key => [key, jsonObjectTestData(valueSize)]),
      );

      const rep = await makeRep({
        mutators: {
          // Create `numKeys` key/value pairs, each holding `valueSize` data
          async init(tx: WriteTransaction) {
            for (const [key, value] of data) {
              await tx.put(key, value);
            }
          },
          async invalidate(
            tx: WriteTransaction,
            changes: Map<string, TestDataObject>,
          ) {
            for (const [key, value] of changes) {
              await tx.put(key, value);
            }
          },
        },
      });

      await rep.mutate.init();
      let onDataCallCount = 0;

      const subs = Array.from({length: numSubsTotal}, (_, i) => {
        const startKeyIndex = i * keysPerSub;
        return rep.subscribe(
          async tx => {
            const startKey = sortedKeys[startKeyIndex];
            return await tx
              .scan({
                start: {key: startKey},
                limit: keysWatchedPerSub,
              })
              .toArray();
          },
          {
            onData(v) {
              onDataCallCount++;
              const vals = v as TestDataObject[];
              for (const [j, val] of vals.entries()) {
                data.set(sortedKeys[startKeyIndex + j], val);
              }
            },
          },
        );
      });

      // We need to wait until all the initial async onData have been called.
      while (onDataCallCount !== numSubsTotal) {
        await sleep(10);
      }

      // Build our random changes ahead of time, outside the timed window.
      // invalidate numSubsDirty different subscriptions by writing to the first key each is scanning.
      const changes = new Map(
        sampleSize(range(numSubsTotal), numSubsDirty).map(v => [
          sortedKeys[v * keysPerSub],
          jsonObjectTestData(valueSize),
        ]),
      );

      // OK time the below!
      bencher.reset();

      // In a single transaction, invalidate numSubsDirty subscriptions.
      await rep.mutate.invalidate(changes);

      bencher.stop();

      subs.forEach(c => c());

      assert(onDataCallCount === numSubsTotal + numSubsDirty);
      for (const [changeKey, changeValue] of changes) {
        assert(deepEqual(changeValue, data.get(changeKey)));
      }
      await rep.close();
    },
  };
}

function deleteDatabase(name: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(makeIdbName(name));
    req.onsuccess = resolve;
    req.onerror = req.onblocked = req.onupgradeneeded = reject;
  });
}

let counter = 0;
async function makeRep<MD extends MutatorDefs>(
  options: Omit<ReplicacheOptions<MD>, 'name'> = {},
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

async function makeRepWithPopulate<MD extends MutatorDefs>(
  options: Omit<ReplicacheOptions<MD>, 'name'> = {},
) {
  const mutators = {
    ...(options.mutators ? options.mutators : {}),
    populate: async (
      tx: WriteTransaction,
      {
        numKeys,
        randomValues: randomValues,
      }: {numKeys: number; randomValues: TestDataObject[]},
    ) => {
      for (let i = 0; i < numKeys; i++) {
        await tx.put(`key${i}`, randomValues[i]);
      }
    },
  };
  return makeRep({
    ...options,
    mutators,
  });
}

export function benchmarks(): Benchmark[] {
  const bs = (useMemstore: boolean) => [
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
    benchmarkPopulate({numKeys: 1000, clean: true, useMemstore}),
    benchmarkPopulate({numKeys: 1000, clean: true, indexes: 1, useMemstore}),
    benchmarkPopulate({numKeys: 1000, clean: true, indexes: 2, useMemstore}),
    benchmarkScan({numKeys: 1000, useMemstore}),
    benchmarkCreateIndex({numKeys: 5000, useMemstore}),
    benchmarkStartupUsingBasicReadsFromPersistedData({
      numKeysPersisted: 100000,
      numKeysToRead: 100,
      useMemstore,
    }),
    benchmarkStartupUsingScanFromPersistedData({
      numKeysPersisted: 100000,
      numKeysToRead: 100,
      useMemstore,
    }),
  ];
  // We do not support useMemstore any more but we keep running the benchmark
  // with the flag to preserve the benchmark name so it is easier to keep track
  // of the results.
  //
  // Run with both true and false. After a few runs we can remove the flag.
  return [...bs(true), ...bs(false)];
}
