import {initReplicacheTesting, replicacheForTesting} from './test-util';
import type {WriteTransaction} from './mod';
import type {JSONValue} from './json';
import {expect} from '@esm-bundle/chai';
import * as sinon from 'sinon';
import {findMatchingWatchers, WatchCallbackEntry} from './watcher.js';
import type {Diff} from './btree/node.js';

initReplicacheTesting();

async function addData(tx: WriteTransaction, data: {[key: string]: JSONValue}) {
  for (const [key, value] of Object.entries(data)) {
    await tx.put(key, value);
  }
}

test('watch', async () => {
  const rep = await replicacheForTesting('watch', {
    mutators: {addData, del: (tx, key) => tx.del(key)},
  });

  const spy = sinon.spy();
  const unwatch = rep.watch(spy);

  await rep.mutate.addData({a: 1, b: 2});

  expect(spy.callCount).to.equal(1);
  expect(spy.lastCall.args).to.deep.equal([
    [
      {
        op: 'add',
        key: 'a',
        newValue: 1,
      },
      {
        op: 'add',
        key: 'b',
        newValue: 2,
      },
    ],
    '9lrb08p9b7jqo8oad3aef60muj4td8ke',
    't/000000000000000000000000000001',
  ]);

  spy.resetHistory();
  await rep.mutate.addData({a: 1, b: 2});
  expect(spy.callCount).to.equal(0);

  await rep.mutate.addData({a: 11});
  expect(spy.callCount).to.equal(1);
  expect(spy.lastCall.args).to.deep.equal([
    [
      {
        op: 'change',
        key: 'a',
        newValue: 11,
        oldValue: 1,
      },
    ],
    't/000000000000000000000000000003',
    't/000000000000000000000000000005',
  ]);

  spy.resetHistory();
  await rep.mutate.del('b');
  expect(spy.callCount).to.equal(1);
  expect(spy.lastCall.args).to.deep.equal([
    [
      {
        op: 'del',
        key: 'b',
        oldValue: 2,
      },
    ],
    't/000000000000000000000000000005',
    't/000000000000000000000000000007',
  ]);

  unwatch();

  spy.resetHistory();
  await rep.mutate.addData({c: 6});
  expect(spy.callCount).to.equal(0);
});

test('watch with prefix', async () => {
  const rep = await replicacheForTesting('watch-with-prefix', {
    mutators: {addData, del: (tx, key) => tx.del(key)},
  });

  const spy = sinon.spy();
  const unwatch = rep.watch(spy, {prefix: 'b'});

  await rep.mutate.addData({a: 1, b: 2});

  expect(spy.callCount).to.equal(1);
  expect(spy.lastCall.args).to.deep.equal([
    [
      {
        op: 'add',
        key: 'b',
        newValue: 2,
      },
    ],
    '9lrb08p9b7jqo8oad3aef60muj4td8ke',
    't/000000000000000000000000000001',
  ]);

  spy.resetHistory();
  await rep.mutate.addData({a: 1, b: 2});
  expect(spy.callCount).to.equal(0);

  await rep.mutate.addData({a: 11});
  expect(spy.callCount).to.equal(0);

  await rep.mutate.addData({b: 3, b1: 4, c: 5});
  expect(spy.callCount).to.equal(1);
  expect(spy.lastCall.args).to.deep.equal([
    [
      {
        op: 'change',
        key: 'b',
        oldValue: 2,
        newValue: 3,
      },
      {
        op: 'add',
        key: 'b1',
        newValue: 4,
      },
    ],
    't/000000000000000000000000000005',
    't/000000000000000000000000000007',
  ]);

  spy.resetHistory();
  await rep.mutate.del('b');
  expect(spy.callCount).to.equal(1);
  expect(spy.lastCall.args).to.deep.equal([
    [
      {
        op: 'del',
        key: 'b',
        oldValue: 3,
      },
    ],
    't/000000000000000000000000000007',
    't/000000000000000000000000000009',
  ]);

  unwatch();

  spy.resetHistory();
  await rep.mutate.addData({b: 6});
  expect(spy.callCount).to.equal(0);
});

test('findMatchingWatchers', () => {
  const t = (
    changedKeys: string[],
    prefixes: string[],
    expected: {prefix: string; diff: Diff}[],
  ) => {
    // Make diff
    let i = 0;
    const diff: Diff = changedKeys.map(key => ({
      op: 'add',
      key,
      newValue: i++,
    }));
    const callbackEntries: WatchCallbackEntry[] = prefixes.map(prefix => ({
      cb: () => void 0,
      prefix,
    }));

    const actual = findMatchingWatchers(diff, callbackEntries);
    const actualReadable = [...actual.entries()].map(([entry, diff]) => ({
      prefix: entry.prefix,
      diff,
    }));
    expect(expected).to.deep.equal(actualReadable);
  };

  t(
    ['a', 'b'],
    [''],
    [
      {
        prefix: '',
        diff: [
          {op: 'add', key: 'a', newValue: 0},
          {op: 'add', key: 'b', newValue: 1},
        ],
      },
    ],
  );

  t(
    ['a', 'b'],
    ['a'],
    [
      {
        prefix: 'a',
        diff: [{op: 'add', key: 'a', newValue: 0}],
      },
    ],
  );

  t(
    ['a', 'b'],
    ['b'],
    [
      {
        prefix: 'b',
        diff: [{op: 'add', key: 'b', newValue: 1}],
      },
    ],
  );

  t(
    ['a', 'b'],
    ['a', 'b'],
    [
      {
        prefix: 'a',
        diff: [{op: 'add', key: 'a', newValue: 0}],
      },
      {
        prefix: 'b',
        diff: [{op: 'add', key: 'b', newValue: 1}],
      },
    ],
  );

  t(
    ['a', 'b'],
    ['c'],
    [
      {
        prefix: 'c',
        diff: [],
      },
    ],
  );

  t(
    ['a', 'b1', 'b2', 'b3', 'c', 'd'],
    ['b'],
    [
      {
        prefix: 'b',
        diff: [
          {op: 'add', key: 'b1', newValue: 1},
          {op: 'add', key: 'b2', newValue: 2},
          {op: 'add', key: 'b3', newValue: 3},
        ],
      },
    ],
  );

  t(
    ['a', 'b1', 'b2', 'b3', 'c'],
    ['', 'a', 'b', 'b2', 'c', 'd'],
    [
      {
        prefix: '',
        diff: [
          {op: 'add', key: 'a', newValue: 0},
          {op: 'add', key: 'b1', newValue: 1},
          {op: 'add', key: 'b2', newValue: 2},
          {op: 'add', key: 'b3', newValue: 3},
          {op: 'add', key: 'c', newValue: 4},
        ],
      },
      {
        prefix: 'a',
        diff: [{op: 'add', key: 'a', newValue: 0}],
      },
      {
        prefix: 'b',
        diff: [
          {op: 'add', key: 'b1', newValue: 1},
          {op: 'add', key: 'b2', newValue: 2},
          {op: 'add', key: 'b3', newValue: 3},
        ],
      },
      {
        prefix: 'b2',
        diff: [{op: 'add', key: 'b2', newValue: 2}],
      },
      {
        prefix: 'c',
        diff: [{op: 'add', key: 'c', newValue: 4}],
      },
      {
        prefix: 'd',
        diff: [],
      },
    ],
  );

  t(
    ['a', 'b', 'c'],
    ['b', 'b'],
    [
      {
        prefix: 'b',
        diff: [{op: 'add', key: 'b', newValue: 1}],
      },
      {
        prefix: 'b',
        diff: [{op: 'add', key: 'b', newValue: 1}],
      },
    ],
  );
});
