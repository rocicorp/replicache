const valSize = 1024;

import {deepEqual} from '../src/json';
import {assert} from '../src/asserts';
import {
  MutatorDefs,
  ReadTransaction,
  Replicache,
  ReplicacheOptions,
  WriteTransaction,
} from '../src/mod';
import {jsonArrayTestData, TestDataObject, jsonObjectTestData} from './data';
import type {Bencher, Benchmark} from './perf';

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
          getCount += ((await tx.get(`key${i}`)) as ArrayLike<unknown>).length;
          hasCount += (await tx.has(`key${i}`)) === true ? 1 : 0;
        }
      });
      bench.stop();
      clog(getCount, hasCount);
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
        clog(count);
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

function shuffle<T>(arr: Array<T>) {
  for (let i = arr.length - 1; i > 0; i--) {
    // Pick a remaining element...
    const randomIndex = Math.floor(Math.random() * i);

    // And swap it with the current element.
    const valAtI = arr[i]; 
    arr[i] = arr[randomIndex];
    arr[randomIndex] = valAtI;
  }

  return arr;
}

function shuffledRange(limit: number) {
  const keys = Array.from({length: limit}).map((_val, index) => index);
  shuffle(keys);
  return keys
}

const clog = console.log.bind(console);
// const clog = (v: any) => {
//   return;
// };


// goal: 95% of writes/sub/read cycle complete in <1ms with 100 active subscriptions, 5 of which are dirty, which each read 10KB > each, while there is 100MB of data in Replicache.
export function benchmarkWriteSubRead(opts: {
  valueSize: number;
  numSubsTotal: number;
  keysPerSub: number;
  keysWatchedPerSub: number;
  numSubsDirty: number;
  useMemstore: boolean;
  randomInvalidate: boolean;
}): Benchmark {
  // keysPerSub needs to be >= keysWatchedPerSub, currently not true for keysPerSub = 8, 1 MB
  const {valueSize, numSubsTotal, keysPerSub, keysWatchedPerSub, numSubsDirty, randomInvalidate} =
    opts;

  const numKeys = keysPerSub * numSubsTotal;
  const cacheSizeMB = (numKeys * valueSize) / 1024 / 1024;
  const kbReadPerSub = (keysWatchedPerSub * valueSize) / 1024;
  const key = (k: number) => `key${k}`;
  //const key = (k: number) => `key${k.toString().padStart(10, '0')}`;
  const indexFromKey = (k: string) => parseInt(k.substring('key'.length));
  const createRandomValueForKey = (key: string) => {
    return {
      key,
      ...randomObject(valueSize)
    };
  };

  const data = jsonArrayTestData(numKeys, valueSize);

  return {
    name: `${
      opts.useMemstore ? '[MemStore] ' : ''
    }writeSubRead ${cacheSizeMB}MB total, ${numSubsTotal} subs total, ${numSubsDirty} subs dirty, ${randomInvalidate ? 'random invalidate, ' : ''}${kbReadPerSub}kb read per sub`,
    group: 'replicache',
    async run(bencher: Bencher) {
      const data = Array.from({length: numKeys}).map((_v, i) =>
        createRandomValueForKey(key(i))
      );
      const rep = await makeRep({
        useMemstore: opts.useMemstore,
        mutators: {
          // Create `numKeys` key/value pairs, each holding `valueSize` data
          async init(tx: WriteTransaction) {
            const keys = shuffledRange(numKeys).map(key);
            for (let i = 0; i < numKeys; i++) {
              const k = keys[i];
              const d = data[indexFromKey(k)];
              await tx.put(k, d);
            }
          },
          // For each random data item provided, invalidate a different subscription by writing to the first key it is scanning.
          async invalidate(
            tx: WriteTransaction,
            changes: {key: string, value: Record<string, string>}[],
          ) {
            for (const change of changes.values()) {
              clog('invalidate');
              clog(change);
              await tx.put(change.key, change.value);
            }
          },
        },
      });

      await rep.mutate.init();
      let onDataCallCount = 0;

      const sortedKeys = Array.from({length: numKeys}).map((_v, i) => key(i)).sort();
      const subs = Array.from({length: numSubsTotal}, (_, i) =>
        rep.subscribe(
          async tx => {
            const startKey = sortedKeys[i * keysPerSub];
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
              const vals = v as string[];
              clog('onData');
              clog(vals);
              for (const [j, val] of vals.entries()) {
                const index = indexFromKey(sortedKeys[i * keysPerSub + j]);
                data[index] = val as unknown as {key: string, value: Record<
                  string,
                  string
                >};
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
      
      const keysToInvalidate = randomInvalidate ?
        shuffledRange(numSubsTotal).slice(0, numSubsDirty).map(i => sortedKeys[i * keysPerSub]) :
        Array.from({length: numSubsDirty}).map((_v, index) => sortedKeys[index * keysPerSub]);
      const changes = [];
      for (let i = 0; i < numSubsDirty; i++) {
        const key = keysToInvalidate[i];
        changes.push({key, value: createRandomValueForKey(key)});
      }

      clog(changes);

      // OK time the below!
      console.time(`writeSubRead ${cacheSizeMB}MB total`);
      bencher.reset();
      //console.profile(`writeSubRead ${cacheSizeMB}MB`);
      clog({onDataCallCount, numSubsTotal, numSubsDirty});

      // In a single transaction, invalidate numSubsDirty subscriptions.
      await rep.mutate.invalidate(changes);


      clog({onDataCallCount, numSubsTotal, numSubsDirty});

      //console.profileEnd(`writeSubRead ${cacheSizeMB}MB`);
      bencher.stop();
      console.timeEnd(`writeSubRead ${cacheSizeMB}MB total`);

      subs.forEach(c => c());

      clog({onDataCallCount, numSubsTotal, numSubsDirty});

      assert(onDataCallCount === numSubsTotal + numSubsDirty);
      for (const change of changes.values()) {
        clog({key: change.key, index: indexFromKey(change.key), data: data[indexFromKey(change.key)], changeValue: change.value})
        assert(deepEqual(data[indexFromKey(change.key)], change.value));
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
    useMemstore,
    mutators,
  });
}

function createWriteSubReadBenchmarks(useMemstore: boolean) : Benchmark[] {
  const benchmarks = [];
  for (let i = 16; i <= 256; i+=8) {
    benchmarks.push(benchmarkWriteSubRead({
      valueSize: 1024,
      numSubsTotal: 128,
      keysPerSub: i,
      keysWatchedPerSub: 16,
      numSubsDirty: 5,
      useMemstore,
      randomInvalidate: false
    }));
    benchmarks.push(benchmarkWriteSubRead({
      valueSize: 1024,
      numSubsTotal: 128,
      keysPerSub: i,
      keysWatchedPerSub: 16,
      numSubsDirty: 5,
      useMemstore,
      randomInvalidate: true
    }));
  }
  return benchmarks;
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
    ...createWriteSubReadBenchmarks(useMemstore)
  ];
  return [...createWriteSubReadBenchmarks(true)];
}
