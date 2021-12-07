import {
  clock,
  initReplicacheTesting,
  MemStoreWithCounters,
  replicacheForTesting,
  testWithBothStores,
  tickAFewTimes,
  tickUntil,
} from './test-util';
import type {PatchOperation} from './mod';
import type {ReadTransaction, WriteTransaction} from './mod';
import type {JSONValue, ReadonlyJSONValue} from './json';
import {expect} from '@esm-bundle/chai';
import {sleep} from './sleep';

// fetch-mock has invalid d.ts file so we removed that on npm install.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import fetchMock from 'fetch-mock/esm/client';

initReplicacheTesting();

async function addData(tx: WriteTransaction, data: {[key: string]: JSONValue}) {
  for (const [key, value] of Object.entries(data)) {
    await tx.put(key, value);
  }
}

testWithBothStores('subscribe', async () => {
  const log: [string, ReadonlyJSONValue][] = [];

  const rep = await replicacheForTesting('subscribe', {
    mutators: {
      addData,
    },
  });
  let queryCallCount = 0;
  const cancel = rep.subscribe(
    async (tx: ReadTransaction) => {
      queryCallCount++;
      return await tx.scan({prefix: 'a/'}).entries().toArray();
    },
    {
      onData: (values: Iterable<[string, ReadonlyJSONValue]>) => {
        for (const entry of values) {
          log.push(entry);
        }
      },
    },
  );

  expect(log).to.have.length(0);
  expect(queryCallCount).to.equal(0);

  const add = rep.mutate.addData;
  await add({'a/0': 0});
  expect(log).to.deep.equal([['a/0', 0]]);
  expect(queryCallCount).to.equal(2); // One for initial subscribe and one for the add.

  // Changing a entry to the same value no longer triggers the subscription to
  // fire.
  log.length = 0;
  await add({'a/0': 0});
  expect(log).to.deep.equal([]);
  expect(queryCallCount).to.equal(2);

  log.length = 0;
  await add({'a/1': 1});
  expect(log).to.deep.equal([
    ['a/0', 0],
    ['a/1', 1],
  ]);
  expect(queryCallCount).to.equal(3);

  log.length = 0;
  log.length = 0;
  await add({'a/1': 11});
  expect(log).to.deep.equal([
    ['a/0', 0],
    ['a/1', 11],
  ]);
  expect(queryCallCount).to.equal(4);

  log.length = 0;
  cancel();
  await add({'a/1': 12});
  await Promise.resolve();
  expect(log).to.have.length(0);
  expect(queryCallCount).to.equal(4);
});

testWithBothStores(`subscribe with index`, async () => {
  const log: [[string, string], ReadonlyJSONValue][] = [];

  const rep = await replicacheForTesting('subscribe-with-index', {
    mutators: {
      addData,
    },
  });

  await rep.createIndex({
    name: 'i1',
    jsonPointer: '/id',
    prefix: 'a',
  });

  let queryCallCount = 0;
  let onDataCallCount = 0;
  const cancel = rep.subscribe(
    async (tx: ReadTransaction) => {
      queryCallCount++;
      return await tx.scan({indexName: 'i1'}).entries().toArray();
    },
    {
      onData: (values: Iterable<[[string, string], ReadonlyJSONValue]>) => {
        onDataCallCount++;
        for (const entry of values) {
          log.push(entry);
        }
      },
    },
  );

  expect(log).to.have.length(0);
  expect(queryCallCount).to.equal(0);
  expect(onDataCallCount).to.equal(0);

  await rep.mutate.addData({
    a1: {id: 'a-1', x: 1},
    a2: {id: 'a-2', x: 2},
    b: {id: 'bx'},
  });

  expect(log).to.deep.equal([
    [
      ['a-1', 'a1'],
      {
        id: 'a-1',
        x: 1,
      },
    ],
    [
      ['a-2', 'a2'],
      {
        id: 'a-2',
        x: 2,
      },
    ],
  ]);
  expect(queryCallCount).to.equal(2); // One for initial subscribe and one for the add.
  expect(onDataCallCount).to.equal(2);

  log.length = 0;
  await rep.mutate.addData({a3: {id: 'a-3', x: 3}});

  expect(queryCallCount).to.equal(3);
  expect(onDataCallCount).to.equal(3);
  expect(log).to.deep.equal([
    [
      ['a-1', 'a1'],
      {
        id: 'a-1',
        x: 1,
      },
    ],
    [
      ['a-2', 'a2'],
      {
        id: 'a-2',
        x: 2,
      },
    ],
    [
      ['a-3', 'a3'],
      {
        id: 'a-3',
        x: 3,
      },
    ],
  ]);

  await rep.dropIndex('i1');
  expect(queryCallCount).to.equal(4);
  expect(onDataCallCount).to.equal(3); // scan({indexName: 'i1'}) fails since we do not have that index any more.

  log.length = 0;
  await rep.createIndex({
    name: 'i1',
    jsonPointer: '/id',
  });

  expect(queryCallCount).to.equal(5);
  expect(onDataCallCount).to.equal(4);
  expect(log).to.deep.equal([
    [
      ['a-1', 'a1'],
      {
        id: 'a-1',
        x: 1,
      },
    ],
    [
      ['a-2', 'a2'],
      {
        id: 'a-2',
        x: 2,
      },
    ],
    [
      ['a-3', 'a3'],
      {
        id: 'a-3',
        x: 3,
      },
    ],
    [
      ['bx', 'b'],
      {
        id: 'bx',
      },
    ],
  ]);

  cancel();
});

testWithBothStores('subscribe with index and start', async () => {
  const log: [[string, string], ReadonlyJSONValue][] = [];

  const rep = await replicacheForTesting('subscribe-with-index-and-start', {
    mutators: {
      addData,
    },
  });

  await rep.createIndex({
    name: 'i1',
    jsonPointer: '/id',
  });

  let queryCallCount = 0;
  let onDataCallCount = 0;
  const cancel = rep.subscribe(
    async (tx: ReadTransaction) => {
      queryCallCount++;
      return await tx
        .scan({indexName: 'i1', start: {key: 'a-2'}})
        .entries()
        .toArray();
    },
    {
      onData: (values: Iterable<[[string, string], ReadonlyJSONValue]>) => {
        onDataCallCount++;
        for (const entry of values) {
          log.push(entry);
        }
      },
    },
  );

  expect(log).to.have.length(0);
  expect(queryCallCount).to.equal(0);
  expect(onDataCallCount).to.equal(0);

  await rep.mutate.addData({
    a1: {id: 'a-1', x: 1},
    a2: {id: 'a-2', x: 2},
    b: {id: 'bx'},
  });

  expect(log).to.deep.equal([
    [
      ['a-2', 'a2'],
      {
        id: 'a-2',
        x: 2,
      },
    ],
    [
      ['bx', 'b'],
      {
        id: 'bx',
      },
    ],
  ]);
  expect(queryCallCount).to.equal(2); // One for initial subscribe and one for the add.
  expect(onDataCallCount).to.equal(2);

  log.length = 0;
  await rep.mutate.addData({
    b: {id: 'bx2'},
  });
  expect(log).to.deep.equal([
    [
      ['a-2', 'a2'],
      {
        id: 'a-2',
        x: 2,
      },
    ],
    [
      ['bx2', 'b'],
      {
        id: 'bx2',
      },
    ],
  ]);
  expect(queryCallCount).to.equal(3); // One for initial subscribe and one for the add.
  expect(onDataCallCount).to.equal(3);

  // Adding a entry that does not match the index... no id property
  await rep.mutate.addData({
    c: {noid: 'c-3'},
  });
  expect(queryCallCount).to.equal(3); // One for initial subscribe and one for the add.
  expect(onDataCallCount).to.equal(3);

  // Changing a entry before the start key
  await rep.mutate.addData({
    a1: {id: 'a-1', x: 2},
  });
  expect(queryCallCount).to.equal(3); // One for initial subscribe and one for the add.
  expect(onDataCallCount).to.equal(3);

  // Changing a entry to the same value we do not fire the subscription any more.
  await rep.mutate.addData({
    a2: {id: 'a-2', x: 2},
  });
  expect(queryCallCount).to.equal(3); // One for initial subscribe and one for the add.
  expect(onDataCallCount).to.equal(3);

  cancel();
});

testWithBothStores('subscribe with index and prefix', async () => {
  const log: [[string, string], ReadonlyJSONValue][] = [];

  const rep = await replicacheForTesting('subscribe-with-index-and-prefix', {
    mutators: {
      addData,
    },
  });

  await rep.createIndex({
    name: 'i1',
    jsonPointer: '/id',
  });

  let queryCallCount = 0;
  let onDataCallCount = 0;
  const cancel = rep.subscribe(
    async (tx: ReadTransaction) => {
      queryCallCount++;
      return await tx.scan({indexName: 'i1', prefix: 'b'}).entries().toArray();
    },
    {
      onData: (values: Iterable<[[string, string], ReadonlyJSONValue]>) => {
        onDataCallCount++;
        for (const entry of values) {
          log.push(entry);
        }
      },
    },
  );

  expect(log).to.have.length(0);
  expect(queryCallCount).to.equal(0);
  expect(onDataCallCount).to.equal(0);

  await rep.mutate.addData({
    a1: {id: 'a-1', x: 1},
    a2: {id: 'a-2', x: 2},
    b: {id: 'bx'},
  });

  expect(log).to.deep.equal([
    [
      ['bx', 'b'],
      {
        id: 'bx',
      },
    ],
  ]);
  expect(queryCallCount).to.equal(2); // One for initial subscribe and one for the add.
  expect(onDataCallCount).to.equal(2);

  log.length = 0;
  await rep.mutate.addData({
    b: {id: 'bx2'},
  });
  expect(log).to.deep.equal([
    [
      ['bx2', 'b'],
      {
        id: 'bx2',
      },
    ],
  ]);
  expect(queryCallCount).to.equal(3); // One for initial subscribe and one for the add.
  expect(onDataCallCount).to.equal(3);

  // Adding a entry that does not match the index... no id property
  await rep.mutate.addData({
    c: {noid: 'c-3'},
  });
  expect(queryCallCount).to.equal(3); // One for initial subscribe and one for the add.
  expect(onDataCallCount).to.equal(3);

  // Changing a entry but still matching prefix
  await rep.mutate.addData({
    b: {id: 'bx3', x: 3},
  });
  expect(queryCallCount).to.equal(4);
  expect(onDataCallCount).to.equal(4);

  // Changing a entry to the same value will not trigger the subscription.
  await rep.mutate.addData({
    b: {id: 'bx3', x: 3},
  });
  expect(queryCallCount).to.equal(4); // One for initial subscribe and one for the add.
  expect(onDataCallCount).to.equal(4);

  cancel();
});

testWithBothStores('subscribe with isEmpty and prefix', async () => {
  const log: boolean[] = [];

  const rep = await replicacheForTesting('subscribe-with-is-empty', {
    mutators: {
      addData,
      del: (tx, k: string) => tx.del(k),
    },
  });

  let queryCallCount = 0;
  let onDataCallCount = 0;
  const cancel = rep.subscribe(
    async (tx: ReadTransaction) => {
      queryCallCount++;
      return await tx.isEmpty();
    },
    {
      onData: (empty: boolean) => {
        onDataCallCount++;
        log.push(empty);
      },
    },
  );

  expect(log).to.deep.equal([]);
  expect(queryCallCount).to.equal(0);
  expect(onDataCallCount).to.equal(0);

  await tickAFewTimes();

  expect(log).to.deep.equal([true]);
  expect(queryCallCount).to.equal(1);
  expect(onDataCallCount).to.equal(1);

  await rep.mutate.addData({
    a: 1,
  });

  expect(log).to.deep.equal([true, false]);
  expect(queryCallCount).to.equal(2);
  expect(onDataCallCount).to.equal(2);

  await rep.mutate.addData({
    b: 2,
  });

  expect(log).to.deep.equal([true, false]);
  expect(queryCallCount).to.equal(3);
  expect(onDataCallCount).to.equal(2);

  await rep.mutate.del('a');

  expect(log).to.deep.equal([true, false]);
  expect(queryCallCount).to.equal(4);
  expect(onDataCallCount).to.equal(2);

  await rep.mutate.del('b');

  expect(log).to.deep.equal([true, false, true]);
  expect(queryCallCount).to.equal(5);
  expect(onDataCallCount).to.equal(3);

  cancel();
});

testWithBothStores('subscribe change keys', async () => {
  const log: ReadonlyJSONValue[][] = [];

  const rep = await replicacheForTesting('subscribe-change-keys', {
    mutators: {
      addData,
      del: (tx, k: string) => tx.del(k),
    },
  });

  let queryCallCount = 0;
  let onDataCallCount = 0;
  const cancel = rep.subscribe(
    async (tx: ReadTransaction) => {
      queryCallCount++;
      const a = await tx.get('a');
      const rv = [a ?? 'no-a'];
      if (a === 1) {
        rv.push((await tx.get('b')) ?? 'no b');
      }
      await tx.has('c');
      return rv;
    },
    {
      onData: (values: ReadonlyJSONValue[]) => {
        onDataCallCount++;
        log.push(values);
      },
    },
  );

  expect(log).to.have.length(0);
  expect(queryCallCount).to.equal(0);
  expect(onDataCallCount).to.equal(0);

  await rep.mutate.addData({
    a: 0,
  });

  expect(log).to.deep.equal([['no-a'], [0]]);
  expect(queryCallCount).to.equal(2); // One for initial subscribe and one for the add.
  expect(onDataCallCount).to.equal(2);

  await rep.mutate.addData({
    b: 2,
  });
  expect(queryCallCount).to.equal(2);
  expect(onDataCallCount).to.equal(2);

  log.length = 0;
  await rep.mutate.addData({
    a: 1,
  });
  expect(queryCallCount).to.equal(3);
  expect(onDataCallCount).to.equal(3);
  expect(log).to.deep.equal([[1, 2]]);

  log.length = 0;
  await rep.mutate.addData({
    b: 3,
  });
  expect(queryCallCount).to.equal(4);
  expect(onDataCallCount).to.equal(4);
  expect(log).to.deep.equal([[1, 3]]);

  log.length = 0;
  await rep.mutate.addData({
    a: 4,
  });
  expect(queryCallCount).to.equal(5);
  expect(onDataCallCount).to.equal(5);
  expect(log).to.deep.equal([[4]]);

  await rep.mutate.addData({
    b: 5,
  });
  expect(queryCallCount).to.equal(5);
  expect(onDataCallCount).to.equal(5);

  await rep.mutate.addData({
    c: 6,
  });
  expect(queryCallCount).to.equal(6);
  expect(onDataCallCount).to.equal(5);

  await rep.mutate.del('c');
  expect(queryCallCount).to.equal(7);
  expect(onDataCallCount).to.equal(5);

  cancel();
});

testWithBothStores('subscribe close', async () => {
  const rep = await replicacheForTesting('subscribe-close', {
    mutators: {addData},
  });

  const log: (ReadonlyJSONValue | undefined)[] = [];

  const cancel = rep.subscribe((tx: ReadTransaction) => tx.get('k'), {
    onData: value => log.push(value),
    onDone: () => (done = true),
  });

  expect(log).to.have.length(0);

  const add = rep.mutate.addData;
  await add({k: 0});
  await Promise.resolve();
  expect(log).to.deep.equal([undefined, 0]);

  let done = false;

  await rep.close();
  expect(done).to.equal(true);
  cancel();
});

testWithBothStores('subscribe with error', async () => {
  const rep = await replicacheForTesting('suberr', {mutators: {addData}});

  const add = rep.mutate.addData;

  let gottenValue = 0;
  let error;

  const cancel = rep.subscribe(
    async tx => {
      const v = await tx.get('k');
      if (v !== undefined && v !== null) {
        throw v;
      }
      return null;
    },
    {
      onData: () => {
        gottenValue++;
      },
      onError: e => {
        error = e;
      },
    },
  );
  await Promise.resolve();

  expect(error).to.equal(undefined);
  expect(gottenValue).to.equal(0);

  await add({k: 'throw'});
  expect(gottenValue).to.equal(1);
  await Promise.resolve();
  expect(error).to.equal('throw');

  cancel();
});

testWithBothStores('subscribe pull and index update', async () => {
  const pullURL = 'https://pull.com/rep';
  const rep = await replicacheForTesting('subscribe-pull-and-index-update', {
    pullURL,
    mutators: {addData},
  });

  const indexName = 'idx1';
  await rep.createIndex({name: indexName, jsonPointer: '/id'});

  const log: ReadonlyJSONValue[] = [];
  let queryCallCount = 0;

  const cancel = rep.subscribe(
    tx => {
      queryCallCount++;
      return tx.scan({indexName}).entries().toArray();
    },
    {
      onData(res) {
        log.push(res);
      },
    },
  );

  let lastMutationID = 0;

  let expectedQueryCallCount = 1;

  async function testPull(opt: {
    patch: PatchOperation[];
    expectedLog: JSONValue[];
    expectChange: boolean;
  }) {
    if (opt.expectChange) {
      expectedQueryCallCount++;
    }
    log.length = 0;
    fetchMock.post(pullURL, {
      lastMutationID: lastMutationID++,
      patch: opt.patch,
    });

    rep.pull();
    await tickUntil(() => log.length >= opt.expectedLog.length);
    expect(queryCallCount).to.equal(expectedQueryCallCount);
    expect(log).to.deep.equal(opt.expectedLog);
  }

  await testPull({patch: [], expectedLog: [[]], expectChange: false});

  await testPull({
    patch: [
      {
        op: 'put',
        key: 'a1',
        value: {id: 'a-1', x: 1},
      },
    ],
    expectedLog: [
      [
        [
          ['a-1', 'a1'],
          {
            id: 'a-1',
            x: 1,
          },
        ],
      ],
    ],
    expectChange: true,
  });

  // Same value
  await testPull({
    patch: [
      {
        op: 'put',
        key: 'a1',
        value: {id: 'a-1', x: 1},
      },
    ],
    expectedLog: [],
    expectChange: false,
  });

  // Change value
  await testPull({
    patch: [
      {
        op: 'put',
        key: 'a1',
        value: {id: 'a-1', x: 2},
      },
    ],
    expectedLog: [
      [
        [
          ['a-1', 'a1'],
          {
            id: 'a-1',
            x: 2,
          },
        ],
      ],
    ],
    expectChange: true,
  });

  // Not matching index json patch
  await testPull({
    patch: [
      {
        op: 'put',
        key: 'b1',
        value: {notAnId: 'b-1', x: 1},
      },
    ],
    expectedLog: [],
    expectChange: false,
  });

  // Clear
  await testPull({
    patch: [
      {
        op: 'clear',
      },
    ],
    expectedLog: [[]],
    expectChange: true,
  });

  // Add again so we can test del...
  await testPull({
    patch: [
      {
        op: 'put',
        key: 'a2',
        value: {id: 'a-2', x: 2},
      },
    ],
    expectedLog: [
      [
        [
          ['a-2', 'a2'],
          {
            id: 'a-2',
            x: 2,
          },
        ],
      ],
    ],
    expectChange: true,
  });
  // .. and del
  await testPull({
    patch: [
      {
        op: 'del',
        key: 'a2',
      },
    ],
    expectedLog: [[]],
    expectChange: true,
  });

  cancel();
});

test('subscription coalescing', async () => {
  const store = new MemStoreWithCounters();
  const rep = await replicacheForTesting('experiment-kv-store', {
    experimentalKVStore: store,
    mutators: {addData},
  });

  expect(store.readCount).to.equal(4);
  expect(store.writeCount).to.equal(5);
  expect(store.closeCount).to.equal(0);
  store.resetCounters();

  const log: string[] = [];
  const ca = rep.subscribe(tx => tx.has('a'), {
    onData() {
      log.push('a');
    },
  });
  const cb = rep.subscribe(tx => tx.has('b'), {
    onData() {
      log.push('b');
    },
  });
  const cc = rep.subscribe(tx => tx.has('c'), {
    onData() {
      log.push('c');
    },
  });

  await tickUntil(() => log.length === 3);
  expect(log).to.deep.equal(['a', 'b', 'c']);

  expect(store.readCount).to.equal(1);
  expect(store.writeCount).to.equal(0);
  expect(store.closeCount).to.equal(0);
  store.resetCounters();

  ca();
  cb();
  cc();
  log.length = 0;
  rep.subscribe(tx => tx.has('d'), {
    onData() {
      log.push('d');
    },
  });
  rep.subscribe(tx => tx.has('e'), {
    onData() {
      log.push('e');
    },
  });

  expect(store.readCount).to.equal(0);
  expect(store.writeCount).to.equal(0);
  expect(store.closeCount).to.equal(0);
  store.resetCounters();

  await rep.mutate.addData({a: 1});

  expect(store.readCount).to.equal(1);
  expect(store.writeCount).to.equal(1);
  expect(store.closeCount).to.equal(0);

  expect(log).to.deep.equal(['d', 'e']);
});

testWithBothStores('subscribe perf test regression', async () => {
  clock.restore();
  const count = 100;
  const maxCount = 1000;
  const minCount = 10;
  const key = (k: number) => `key${k}`;
  const rep = await replicacheForTesting('subscribe-perf-test-regression', {
    mutators: {
      async init(tx: WriteTransaction) {
        await Promise.all(
          Array.from({length: maxCount}, (_, i) => tx.put(key(i), i)),
        );
      },
      async put(tx: WriteTransaction, options: {key: string; val: JSONValue}) {
        // console.log('put', options.key, options.val);
        await tx.put(options.key, options.val);
      },
    },
  });

  await rep.mutate.init();
  const data = Array.from({length: count}).fill(0);
  let onDataCallCount = 0;
  const subs = Array.from({length: count}, (_, i) =>
    rep.subscribe(tx => tx.get(key(i)), {
      onData(v) {
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

  for (let i = 0; i < mut; i++) {
    await rep.mutate.put({key: key(i), val: i ** 2 + rand});
  }

  subs.forEach(c => c());

  await sleep(100);

  expect(onDataCallCount).to.equal(count + mut);
  for (let i = 0; i < count; i++) {
    expect(data[i]).to.equal(i < mut ? i ** 2 + rand : i);
  }
});
