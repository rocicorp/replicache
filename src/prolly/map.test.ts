import {expect} from '@esm-bundle/chai';
import {Store} from '../dag/mod';
import {MemStore} from '../kv/mod';
import {Leaf} from './leaf';
import {stringCompare} from './string-compare';
import * as prolly from './mod';
import * as utf8 from '../utf8';
import {b} from '../test-util';
import {initHasher} from '../hash';

setup(async () => {
  await initHasher();
});

function makeMap(
  base: string[] | undefined,
  pending: string[],
  deleted: string[],
): prolly.Map {
  const entries = base && base.sort();
  const leaf =
    entries && Leaf.new(entries.map(s => [utf8.encode(s), utf8.encode(s)]));

  const pm = new Map();
  for (const p of pending) {
    const v = utf8.encode(p);
    v.reverse();
    pm.set(p, v);
  }
  for (const p of deleted) {
    pm.set(p, null);
  }
  return new prolly.Map(leaf, pm);
}

test('has', () => {
  const t = (map: prolly.Map, test: string, expected: boolean) => {
    const actual = map.has(utf8.encode(test));
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
    const actual = map.get(utf8.encode(test));
    expect(actual).to.deep.equal(expected && utf8.encode(expected));
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
    map.put(utf8.encode(put), b`x`);
    const actual = map.get(utf8.encode(put));
    expect(actual).to.deep.equal(expected && utf8.encode(expected));
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
    map.del(utf8.encode(del));
    const has = map.has(utf8.encode(del));
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
    expected1: string[],
  ) => {
    const map = makeMap(base, pending, deleted);
    const expected = expected1.map(utf8.encode);

    const t = (map: prolly.Map, expected: Uint8Array[]) => {
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
  await t([''], [], [], ['']);
  await t(['', 'foo'], [], [], ['', 'foo']);

  // Pending-only
  await t(undefined, [''], [], ['']);
  await t(undefined, ['', 'foo'], [], ['', 'foo']);

  // basic+pending
  await t(['', 'foo'], ['bar', 'foo'], [], ['', 'bar', 'foo']);
  await t([''], ['', 'bar'], [], ['', 'bar']);
  await t(['a', 'b'], ['c', 'd'], [], ['a', 'b', 'c', 'd']);
  await t(['c', 'd'], ['a', 'b'], [], ['a', 'b', 'c', 'd']);
  await t(['b', 'd'], ['a', 'c'], [], ['a', 'b', 'c', 'd']);

  // deletes
  await t([], [], [''], []);
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
  const pending: Map<string, Uint8Array | null> = new Map();
  for (const [key, value] of entries) {
    pending.set(key, utf8.encode(value));
  }
  return new prolly.Map(undefined, pending);
}

test('pending changes keys', async () => {
  const baseMap = new Map();
  baseMap.set(b`a`, b`a`);
  baseMap.set(b`b`, b`b`);

  const base = Leaf.new(baseMap);
  const map = new prolly.Map(base, new Map());

  map.put(b`c`, b`c`);
  expect(map.pendingChangedKeys()).to.deep.equal(['c']);

  // Set b to b again... should be a nop
  map.put(b`b`, b`b`);
  expect(map.pendingChangedKeys()).to.deep.equal(['c']);

  // Remove c from pending
  map.del(b`c`);
  expect(map.pendingChangedKeys()).to.deep.equal([]);

  map.del(b`d`);
  expect(map.pendingChangedKeys()).to.deep.equal([]);

  map.put(b`b`, b`2`);
  expect(map.pendingChangedKeys()).to.deep.equal(['b']);
});
