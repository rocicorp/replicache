import {resolver} from '@rocicorp/resolver';
import {deepEqual} from '../src/json';
import {assert} from '../src/asserts';
import {
  MutatorDefs,
  PatchOperation,
  ReadTransaction,
  Replicache,
  ReplicacheOptions,
  WriteTransaction,
} from '../out/replicache';
import {jsonArrayTestData, TestDataObject, jsonObjectTestData} from './data';
import type {Bencher, Benchmark} from './perf';
import * as kv from '../src/kv/mod';
import {
  setupIDBDatabasesStoreForTest,
  teardownIDBDatabasesStoreForTest,
} from '../src/persist/mod';
import {uuid} from '../src/uuid';
import {TEST_LICENSE_KEY} from '@rocicorp/licensing/src/client';
import type {ReplicacheInternalAPI} from '../src/replicache-options.js';

const valSize = 1024;

export function benchmarkPopulate(opts: {
  numKeys: number;
  clean: boolean;
  indexes?: number;
}): Benchmark {
  let repToClose: Replicache | undefined;
  return {
    name: `populate ${valSize}x${opts.numKeys} (${
      opts.clean ? 'clean' : 'dirty'
    }, ${`indexes: ${opts.indexes || 0}`})`,
    group: 'replicache',
    byteSize: opts.numKeys * valSize,
    async setupEach() {
      setupIDBDatabasesStoreForTest();
    },
    async teardownEach() {
      await teardownIDBDatabasesStoreForTest();
      await closeAndCleanupRep(repToClose);
    },
    async run(bencher: Bencher) {
      const rep = (repToClose = makeRepWithPopulate());
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
    },
  };
}

class ReplicacheWithPersist<MD extends MutatorDefs> extends Replicache {
  private readonly _internalAPI: ReplicacheInternalAPI;
  constructor(options: ReplicacheOptions<MD>) {
    let internalAPI!: ReplicacheInternalAPI;
    super({
      ...options,
      exposeInternalAPI: (api: ReplicacheInternalAPI) => {
        internalAPI = api;
      },
    } as ReplicacheOptions<MD>);
    this._internalAPI = internalAPI;
  }

  async persist(): Promise<void> {
    return this._internalAPI.persist();
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

  setupIDBDatabasesStoreForTest();
  let repToClose;
  try {
    // populate store using pull (as opposed to mutators)
    // so that a snapshot commit is created, which new clients
    // can use to bootstrap.
    const rep = (repToClose = new ReplicacheWithPersist({
      licenseKey: TEST_LICENSE_KEY,
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
    }));
    const initialPullResolver = resolver<void>();
    rep.subscribe(tx => tx.get('key0'), {
      onData: r => r && initialPullResolver.resolve(),
    });
    await initialPullResolver.promise;

    await rep.persist();
  } finally {
    await teardownIDBDatabasesStoreForTest();
    await repToClose?.close();
  }
}

export function benchmarkStartupUsingBasicReadsFromPersistedData(opts: {
  numKeysPersisted: number;
  numKeysToRead: number;
}): Benchmark {
  const repName = makeRepName();
  let repToClose: Replicache | undefined;
  return {
    name: `startup read ${valSize}x${opts.numKeysToRead} from ${valSize}x${opts.numKeysPersisted} stored`,
    group: 'replicache',
    byteSize: opts.numKeysToRead * valSize,
    async setup() {
      await setupPersistedData(repName, opts.numKeysPersisted);
    },
    async setupEach() {
      setupIDBDatabasesStoreForTest();
    },
    async teardownEach() {
      await teardownIDBDatabasesStoreForTest();
      await repToClose?.close();
    },
    async teardown() {
      await closeAndCleanupRep(repToClose);
    },
    async run(bencher: Bencher) {
      const randomKeysToRead = sampleSize(
        range(opts.numKeysPersisted),
        opts.numKeysToRead,
      ).map(i => `key${i}`);
      bencher.reset();
      const rep = (repToClose = new Replicache({
        licenseKey: TEST_LICENSE_KEY,
        name: repName,
        pullInterval: null,
      }));
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
    },
  };
}

export function benchmarkStartupUsingScanFromPersistedData(opts: {
  numKeysPersisted: number;
  numKeysToRead: number;
}): Benchmark {
  const repName = makeRepName();
  let repToClose: Replicache | undefined;
  return {
    name: `startup scan ${valSize}x${opts.numKeysToRead} from ${valSize}x${opts.numKeysPersisted} stored`,
    group: 'replicache',
    byteSize: opts.numKeysToRead * valSize,
    async setup() {
      await setupPersistedData(repName, opts.numKeysPersisted);
    },
    async setupEach() {
      setupIDBDatabasesStoreForTest();
    },
    async teardownEach() {
      await teardownIDBDatabasesStoreForTest();
      await repToClose?.close();
    },
    async teardown() {
      await closeAndCleanupRep(repToClose);
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
      const rep = (repToClose = new Replicache({
        licenseKey: TEST_LICENSE_KEY,
        name: repName,
        pullInterval: null,
      }));
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
      setupIDBDatabasesStoreForTest();
      rep = makeRepWithPopulate();
      await rep.mutate.populate({
        numKeys: opts.numKeys,
        randomValues: jsonArrayTestData(opts.numKeys, valSize),
      });
    },
    async teardown() {
      await teardownIDBDatabasesStoreForTest();
      await closeAndCleanupRep(rep);
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
      setupIDBDatabasesStoreForTest();
      rep = makeRepWithPopulate();
      await rep.mutate.populate({
        numKeys: opts.numKeys,
        randomValues: jsonArrayTestData(opts.numKeys, valSize),
      });
    },
    async teardown() {
      await teardownIDBDatabasesStoreForTest();
      await closeAndCleanupRep(rep);
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
  let repToClose: Replicache | undefined;
  return {
    name: `create index ${valSize}x${opts.numKeys}`,
    group: 'replicache',
    async setupEach() {
      setupIDBDatabasesStoreForTest();
    },
    async teardownEach() {
      await teardownIDBDatabasesStoreForTest();
      await closeAndCleanupRep(repToClose);
    },
    async run(bencher: Bencher) {
      const rep = (repToClose = makeRepWithPopulate());
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

  let repToClose: Replicache | undefined;
  return {
    name: `writeSubRead ${cacheSizeMB}MB total, ${numSubsTotal} subs total, ${numSubsDirty} subs dirty, ${kbReadPerSub}kb read per sub`,
    group: 'replicache',
    async setupEach() {
      setupIDBDatabasesStoreForTest();
    },
    async teardownEach() {
      await teardownIDBDatabasesStoreForTest();
      await closeAndCleanupRep(repToClose);
    },
    async run(bencher: Bencher) {
      const keys = Array.from({length: numKeys}, (_, index) => makeKey(index));
      const sortedKeys = keys.sort();
      const data: Map<string, TestDataObject> = new Map(
        keys.map(key => [key, jsonObjectTestData(valueSize)]),
      );

      const rep = (repToClose = makeRep({
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
      }));

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
    },
  };
}

function makeRepName(): string {
  return `bench${uuid()}`;
}

function makeRep<MD extends MutatorDefs>(
  options: Omit<ReplicacheOptions<MD>, 'name' | 'licenseKey'> = {},
) {
  const name = makeRepName();
  return new Replicache<MD>({
    licenseKey: TEST_LICENSE_KEY,
    name,
    pullInterval: null,
    ...options,
  });
}

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type ReplicacheWithPopulate = UnwrapPromise<
  ReturnType<typeof makeRepWithPopulate>
>;

function makeRepWithPopulate() {
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

async function closeAndCleanupRep(rep: Replicache | undefined): Promise<void> {
  if (rep) {
    await rep.close();
    await kv.dropIDBStore(rep.idbName);
  }
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
    // write/sub/read 64mb
    benchmarkWriteSubRead({
      valueSize: 1024,
      numSubsTotal: 128,
      keysPerSub: 512,
      keysWatchedPerSub: 16,
      numSubsDirty: 5,
    }),
    // 128 mb is unusable
    benchmarkPopulate({numKeys: 1000, clean: true}),
    benchmarkPopulate({numKeys: 1000, clean: true, indexes: 1}),
    benchmarkPopulate({numKeys: 1000, clean: true, indexes: 2}),
    benchmarkPopulate({numKeys: 10000, clean: true}),
    benchmarkPopulate({numKeys: 10000, clean: true, indexes: 1}),
    benchmarkPopulate({numKeys: 10000, clean: true, indexes: 2}),
    benchmarkScan({numKeys: 1000}),
    benchmarkScan({numKeys: 10_000}),
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

function* rangeIter(end: number) {
  for (let i = 0; i < end; i++) {
    yield i;
  }
}

function range(end: number): number[] {
  return [...rangeIter(end)];
}

function sampleSize<T>(arr: Iterable<T>, n: number): T[] {
  return shuffle(arr).slice(0, n);
}

function shuffle<T>(arr: Iterable<T>): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
