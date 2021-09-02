import {expect} from '@esm-bundle/chai';
import {Store} from '../dag/mod';
import {MemStore} from '../kv/mod';
import {Leaf} from './leaf';
import {stringCompare} from './string-compare';
import * as prolly from './mod';
import {initHasher} from '../hash';
import type {JSONValue} from '../json';
import {deleteSentinel, DeleteSentinel} from './map';

setup(async () => {
  await initHasher();
});

function makeMap(
  base: string[] | undefined,
  pending: string[],
  deleted: string[],
): prolly.Map {
  const entries = base && base.sort();
  const leaf = entries && new Leaf(entries.map(s => [s, s]));

  const pm = new Map();
  for (const p of pending) {
    const v = p.split('').reverse().join('');
    pm.set(p, v);
  }
  for (const p of deleted) {
    pm.set(p, deleteSentinel);
  }
  return new prolly.Map(leaf, pm);
}

test('has', () => {
  const t = (map: prolly.Map, test: string, expected: boolean) => {
    const actual = map.has(test);
    expect(actual).to.equal(expected);
  };

  t(makeMap(undefined, [], []), 'foo', false);

  // basic base-only cases
  t(makeMap(['foo', 'bar'], [], []), 'foo', true);
  t(makeMap(['foo', 'bar'], [], []), 'baz', false);

  // basic+pending
  t(makeMap(['foo', 'bar'], ['baz'], []), 'foo', true);
  t(makeMap(['foo', 'bar'], ['foo', 'bar'], []), 'bar', true);
  t(makeMap(['foo', 'bar'], ['baz'], []), 'baz', true);
  t(makeMap(['foo', 'bar'], ['baz'], []), 'qux', false);

  // deletes
  t(makeMap(['foo', 'bar'], [], ['bar']), 'foo', true);
  t(makeMap(['foo', 'bar'], [], ['bar']), 'bar', false);
  t(
    makeMap(
      ['foo', 'bar'],
      [],
      // Should not be possible, but whatever
      ['baz'],
    ),
    'baz',
    false,
  );
});

test('get', async () => {
  const t = (map: prolly.Map, test: string, expected: string | undefined) => {
    const actual = map.get(test);
    expect(actual).to.deep.equal(expected);
  };

  // Empty
  t(makeMap(undefined, [], []), 'foo', undefined);

  // Base-only
  t(makeMap(['foo', 'bar'], [], []), 'foo', 'foo');
  t(makeMap(['foo', 'bar'], [], []), 'baz', undefined);

  // Pending-only
  t(makeMap(undefined, ['foo', 'bar'], []), 'foo', 'oof');
  t(makeMap(undefined, ['foo', 'bar'], []), 'baz', undefined);

  // basic+pending
  t(makeMap(['foo', 'bar'], ['baz'], []), 'foo', 'foo');
  t(makeMap(['foo', 'bar'], ['foo', 'bar'], []), 'bar', 'rab');
  t(makeMap(['foo', 'bar'], ['baz'], []), 'baz', 'zab');
  t(makeMap(['foo', 'bar'], ['baz'], []), 'qux', undefined);

  // deletes
  t(makeMap(['foo', 'bar'], [], ['bar']), 'foo', 'foo');
  t(makeMap(['foo', 'bar'], [], ['bar']), 'bar', undefined);
  t(
    makeMap(
      ['foo', 'bar'],
      [],
      // Should not be possible, but whatever
      ['baz'],
    ),
    'baz',
    undefined,
  );
});

test('put', async () => {
  const t = async (
    base: string[] | undefined,
    pending: string[],
    deleted: string[],
    put: string,
    expected: string | undefined,
  ) => {
    const map = makeMap(base, pending, deleted);
    map.put(put, 'x');
    const actual = map.get(put);
    expect(actual).to.deep.equal(expected);
  };

  // Empty
  await t(undefined, [], [], '', 'x');
  await t(undefined, [], [], 'foo', 'x');

  // Base only
  await t([], [], [], 'foo', 'x');
  await t(['foo'], [], [], 'foo', 'x');

  // Base+pending
  await t(['foo'], ['foo'], [], 'foo', 'x');

  // Base+pending+deletes
  await t(['foo'], ['foo'], ['foo'], 'foo', 'x');
});

test('del', async () => {
  const t = async (
    base: string[] | undefined,
    pending: string[],
    deleted: string[],
    del: string,
  ) => {
    const map = makeMap(base, pending, deleted);
    map.del(del);
    const has = map.has(del);
    expect(has).to.be.false;
  };

  // Empty
  await t(undefined, [], [], '');
  await t(undefined, [], [], 'foo');

  // Base only
  await t([], [], [], 'foo');
  await t(['foo'], [], [], 'foo');

  // Base+pending
  await t(['foo'], ['foo'], [], 'foo');

  // Base+pending+deletes
  await t(['foo'], ['bar'], ['baz'], 'foo');
  await t(['foo'], ['foo'], ['foo'], 'foo');
});

test('iter flush', async () => {
  const t = async (
    base: string[] | undefined,
    pending: string[],
    deleted: string[],
    expected: string[],
  ) => {
    const map = makeMap(base, pending, deleted);

    const t = (map: prolly.Map, expected: string[]) => {
      const actual = [...map].map(item => item[0]);
      expect(actual).to.deep.equal(expected);
    };

    t(map, expected);

    const kv = new MemStore();
    const store = new Store(kv);
    const write = await store.write();
    const hash = await map.flush(write);

    // Original map should still have same data.
    t(map, expected);

    await write.setHead('iter_flush', hash);

    // The hash should yield a new map with same data
    await write.commit();
    const read = await store.read();
    const map2 = await prolly.Map.load(hash, read);
    t(map2, expected);
  };

  // Empty
  await t(undefined, [], [], []);

  // Base-only
  await t([], [], [], []);
  await t(['0'], [], [], ['0']);
  await t(['0', 'foo'], [], [], ['0', 'foo']);

  // Pending-only
  await t(undefined, ['0'], [], ['0']);
  await t(undefined, ['0', 'foo'], [], ['0', 'foo']);

  // basic+pending
  await t(['0', 'foo'], ['bar', 'foo'], [], ['0', 'bar', 'foo']);
  await t(['0'], ['0', 'bar'], [], ['0', 'bar']);
  await t(['a', 'b'], ['c', 'd'], [], ['a', 'b', 'c', 'd']);
  await t(['c', 'd'], ['a', 'b'], [], ['a', 'b', 'c', 'd']);
  await t(['b', 'd'], ['a', 'c'], [], ['a', 'b', 'c', 'd']);

  // deletes
  await t([], [], ['0'], []);
  await t([], [], ['a'], []);
  await t(['a'], [], ['a'], []);
  await t(['a', 'b'], [], ['a'], ['b']);
  await t(['a', 'b'], ['c', 'd'], ['a', 'c'], ['b', 'd']);
});

test('changed keys', () => {
  const t = (
    o: Record<string, string>,
    n: Record<string, string>,
    expected: string[],
  ) => {
    const old = makeProllyMap(o);
    const newMap = makeProllyMap(n);
    expected.sort();
    let actual = prolly.Map.changedKeys(old, newMap);
    expect(actual).to.deep.equal(expected);
    actual = prolly.Map.changedKeys(newMap, old);
    expect(actual).to.deep.equal(expected);
  };

  t({}, {}, []);
  t({a: 'b'}, {a: 'b'}, []);

  t({a: 'a'}, {a: 'b'}, ['a']);
  t({a: 'a'}, {b: 'b'}, ['a', 'b']);
  t({a: 'a', b: 'b'}, {b: 'b', c: 'c'}, ['a', 'c']);
  t({a: 'a', b: 'b'}, {b: 'b'}, ['a']);
  t({b: 'b'}, {b: 'b', c: 'c'}, ['c']);
  t({a: 'a1', b: 'b1'}, {a: 'a2', b: 'b2'}, ['a', 'b']);
});

function makeProllyMap(m: Record<string, string>): prolly.Map {
  const entries = Object.entries(m);
  entries.sort((a, b) => stringCompare(a[0], b[0]));
  const pending: Map<string, JSONValue | DeleteSentinel> = new Map();
  for (const [key, value] of entries) {
    pending.set(key, value);
  }
  return new prolly.Map(undefined, pending);
}

test('pending changes keys', async () => {
  const baseMap = new Map();
  baseMap.set('a', 'a');
  baseMap.set('b', 'b');

  const base = new Leaf([...baseMap]);
  const map = new prolly.Map(base, new Map());

  map.put('c', 'c');
  expect(map.pendingChangedKeys()).to.deep.equal(['c']);

  // Set b to b again... should be a nop
  map.put('b', 'b');
  expect(map.pendingChangedKeys()).to.deep.equal(['c']);

  // Remove c from pending
  map.del('c');
  expect(map.pendingChangedKeys()).to.deep.equal([]);

  map.del('d');
  expect(map.pendingChangedKeys()).to.deep.equal([]);

  map.put('b', '2');
  expect(map.pendingChangedKeys()).to.deep.equal(['b']);
});
