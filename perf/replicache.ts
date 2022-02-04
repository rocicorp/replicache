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
import {resolver} from '../src/resolver';
import {IDB_DATABASES_DB_NAME} from '../src/persist/idb-databases-store';

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
  await deleteDatabase(IDB_DATABASES_DB_NAME);
  // populate store using pull (as opposed to mutators)
  // so that a snapshot commit is created, which new clients
  // can use to bootstrap.
  const rep = new ReplicacheWithPersist({
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

  const initialPullResolver = resolver<void>();
  rep.subscribe(tx => tx.get('key0'), {
    onData: r => r && initialPullResolver.resolve(),
  });
  await initialPullResolver.promise;

  await rep.persist();
  await rep.close();
}

export function benchmarkStartupUsingBasicReadsFromPersistedData(opts: {
  numKeysPersisted: number;
  numKeysToRead: number;
}): Benchmark {
  const repName = 'benchmarkStartupUsingBasicReadsFromPersistedData';
  return {
    name: `startup read ${valSize}x${opts.numKeysToRead} from ${valSize}x${opts.numKeysPersisted} stored`,
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
      await deleteDatabase(IDB_DATABASES_DB_NAME);
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
}): Benchmark {
  const repName = 'benchmarkStartupUsingScanFromPersistedData';
  return {
    name: `startup scan ${valSize}x${opts.numKeysToRead} from ${valSize}x${opts.numKeysPersisted} stored`,
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

export function benchmarkCreateIndex(opts: {numKeys: number}): Benchmark {
  return {
    name: `create index ${valSize}x${opts.numKeys}`,
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
}): Benchmark {
  const {valueSize, numSubsTotal, keysPerSub, keysWatchedPerSub, numSubsDirty} =
    opts;

  const numKeys = keysPerSub * numSubsTotal;
  const cacheSizeMB = (numKeys * valueSize) / 1024 / 1024;
  const kbReadPerSub = (keysWatchedPerSub * valueSize) / 1024;
  const makeKey = (index: number) => `key${index}`;

  return {
    name: `writeSubRead ${cacheSizeMB}MB total, ${numSubsTotal} subs total, ${numSubsDirty} subs dirty, ${kbReadPerSub}kb read per sub`,
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
  const maxBlockedRetry = 10;
  const retryDelayMs = 100;
  let retryBlockCount = 0;
  function delDB(resolve: (_: unknown) => void, reject: (_: unknown) => void) {
    console.log(name);
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = resolve;
    req.onerror = req.onupgradeneeded = reject;
    req.onblocked = async event => {
      retryBlockCount++;
      if (retryBlockCount > maxBlockedRetry) {
        reject(event);
      } else {
        await sleep(retryDelayMs);
        await delDB(resolve, reject);
      }
    };
  }
  return new Promise((resolve, reject) => {
    delDB(resolve, reject);
  });
}

let counter = 0;
async function makeRep<MD extends MutatorDefs>(
  options: Omit<ReplicacheOptions<MD>, 'name'> = {},
) {
  const name = `bench${counter++}`;
  await deleteDatabase(makeIdbName(name));
  await deleteDatabase(IDB_DATABASES_DB_NAME);
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
    mutators,
  });
}

export function benchmarks(): Benchmark[] {
  return [
    // write/sub/read 1mb
    benchmarkWriteSubRead({
      valueSize: 1024,
      numSubsTotal: 64,
      keysPerSub: 16,
      keysWatchedPerSub: 16,
      numSubsDirty: 5,
    }),
    // write/sub/read 4mb
    benchmarkWriteSubRead({
      valueSize: 1024,
      numSubsTotal: 128,
      keysPerSub: 32,
      keysWatchedPerSub: 16,
      numSubsDirty: 5,
    }),
    // write/sub/read 16mb
    benchmarkWriteSubRead({
      valueSize: 1024,
      numSubsTotal: 128,
      keysPerSub: 128,
      keysWatchedPerSub: 16,
      numSubsDirty: 5,
    }),
    // 128 mb is unusable
    benchmarkPopulate({numKeys: 1000, clean: true}),
    benchmarkPopulate({numKeys: 1000, clean: true, indexes: 1}),
    benchmarkPopulate({numKeys: 1000, clean: true, indexes: 2}),
    benchmarkScan({numKeys: 1000}),
    benchmarkCreateIndex({numKeys: 5000}),
    benchmarkStartupUsingBasicReadsFromPersistedData({
      numKeysPersisted: 100000,
      numKeysToRead: 100,
    }),
    benchmarkStartupUsingScanFromPersistedData({
      numKeysPersisted: 100000,
      numKeysToRead: 100,
    }),
  ];
}
