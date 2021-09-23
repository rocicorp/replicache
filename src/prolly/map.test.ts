import {expect} from '@esm-bundle/chai';
import {Chunk, Store} from '../dag/mod';
import {MemStore} from '../kv/mod';
import {stringCompare} from './string-compare';
import * as prolly from './mod';
import {initHasher} from '../hash';
import {binarySearch, Entry} from './map';

setup(async () => {
  await initHasher();
});

function makeMap(base: string[]): prolly.Map {
  const entries = base.sort();
  return new prolly.Map(entries.map(s => [s, s.split('').reverse().join('')]));
}

test('has', () => {
  const t = (map: prolly.Map, test: string, expected: boolean) => {
    const actual = map.has(test);
    expect(actual).to.equal(expected);
  };

  t(makeMap([]), 'foo', false);
  t(makeMap(['foo']), 'foo', true);
  t(makeMap(['foo']), 'bar', false);
  t(makeMap(['foo', 'bar']), 'foo', true);
  t(makeMap(['foo', 'bar']), 'bar', true);
  t(makeMap(['foo', 'bar']), 'baz', false);
  t(makeMap(['foo', 'bar', 'baz']), 'foo', true);
  t(makeMap(['foo', 'bar', 'baz']), 'bar', true);
  t(makeMap(['foo', 'bar', 'baz']), 'baz', true);
  t(makeMap(['foo', 'bar', 'baz']), 'qux', false);
});

test('get', async () => {
  const t = (map: prolly.Map, test: string, expected: string | undefined) => {
    const actual = map.get(test);
    expect(actual).to.deep.equal(expected);
  };

  t(makeMap([]), 'foo', undefined);
  t(makeMap(['foo', 'bar']), 'foo', 'oof');
  t(makeMap(['foo', 'bar']), 'bar', 'rab');
  t(makeMap(['foo', 'bar']), 'baz', undefined);
});

test('put', async () => {
  const t = async (
    base: string[],
    put: string,
    expected: string | undefined,
  ) => {
    const map = makeMap(base);
    map.put(put, 'x');
    const actual = map.get(put);
    expect(actual).to.deep.equal(expected);
  };

  await t([], '', 'x');
  await t([], 'foo', 'x');
  await t(['foo'], 'foo', 'x');
  await t(['foo'], 'foo', 'x');
  await t(['foo'], 'bar', 'x');
  await t(['foo'], 'go!', 'x');
});

test('del', async () => {
  const t = async (base: string[], del: string) => {
    const map = makeMap(base);
    map.del(del);
    const has = map.has(del);
    expect(has).to.be.false;
  };

  await t([], '');
  await t([], 'foo');
  await t(['foo'], 'foo');
  await t(['foo'], 'bar');
  await t(['foo', 'bar'], 'bar');
  await t(['foo', 'bar'], 'foo');
});

test('iter flush', async () => {
  const t = async (base: string[], expected: string[]) => {
    const map = makeMap(base);

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

  await t([], []);
  await t(['0'], ['0']);
  await t(['0', 'foo'], ['0', 'foo']);
  await t(['0', 'foo', 'bar'], ['0', 'bar', 'foo']);
  await t(['0', 'bar'], ['0', 'bar']);
  await t(['a', 'b', 'c', 'd'], ['a', 'b', 'c', 'd']);
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
  return new prolly.Map(entries);
}

test('pending changes keys', async () => {
  const map = new prolly.Map([
    ['a', 'a'],
    ['b', 'b'],
  ]);

  map.put('c', 'c');
  expect(map.pendingChangedKeys()).to.deep.equal(['c']);

  // Set b to b again... should be a nop
  map.put('b', 'b');
  expect(map.pendingChangedKeys()).to.deep.equal(['b', 'c']);

  // Remove c from pending
  map.del('c');
  expect(map.pendingChangedKeys()).to.deep.equal(['b', 'c']);

  map.del('d');
  expect(map.pendingChangedKeys()).to.deep.equal(['b', 'c']);

  map.put('b', '2');
  expect(map.pendingChangedKeys()).to.deep.equal(['b', 'c']);
});

test('load errors', async () => {
  // This tests invalid data so we can't use valid type annotations.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = async (data: any, expectedError: string) => {
    let err;
    try {
      // @ts-expect-error Constructor is private
      const chunk = new Chunk('hash', data, undefined);
      prolly.fromChunk(chunk);
    } catch (e) {
      err = e;
    }
    expect(err).to.be.instanceOf(
      Error,
      `expected error with message: ${expectedError}`,
    );
    expect((err as Error).message).to.equal(expectedError);
  };

  await t(undefined, 'Invalid type: undefined, expected array');

  await t([[undefined, undefined]], 'Invalid type: undefined, expected string');
  await t([['0', undefined]], 'Invalid type: undefined, expected JSON value');
  await t(
    [
      ['\u0001', ''],
      ['\u0001', ''],
    ],
    'duplicate key',
  );
  await t(
    [
      ['\u0001', ''],
      ['\u0000', ''],
    ],
    'unsorted key',
  );

  await t([['0', 1, 2]], 'Invalid entry length');
});

test('binary search', () => {
  const t = (needle: string, haystack: string[], expectedIndex: number) => {
    const entries: ReadonlyArray<Entry> = haystack.sort().map(k => [k, k]);
    expect(binarySearch(needle, entries)).to.equal(expectedIndex);
  };

  t('a', [], -1);

  t('b', ['b'], 0);

  t('a', ['b'], -1);
  t('c', ['b'], -2);

  t('b', ['b', 'd'], 0);
  t('d', ['b', 'd'], 1);

  t('a', ['b', 'd'], -1);
  t('c', ['b', 'd'], -2);
  t('e', ['b', 'd'], -3);

  t('b', ['b', 'd', 'f'], 0);
  t('d', ['b', 'd', 'f'], 1);
  t('f', ['b', 'd', 'f'], 2);

  t('a', ['b', 'd', 'f'], -1);
  t('c', ['b', 'd', 'f'], -2);
  t('e', ['b', 'd', 'f'], -3);
  t('g', ['b', 'd', 'f'], -4);
});
