import {expect} from '@esm-bundle/chai';
import {fakeHash, Hash} from '../hash';
import {computeRefCountUpdates, GarbageCollectionDelegate} from './gc';

function createGraph(graph: Record<string, string[]>, root: string) {
  const hashes = Object.fromEntries(
    Object.keys(graph).map(k => [k.toString(), fakeHash(k)]),
  );
  const refCount = (k: string) =>
    Object.values(graph).filter(refs => refs.includes(k)).length +
    (k === root ? 1 : 0);
  const refCounts = Object.fromEntries(
    Object.keys(graph).map(k => [hashes[k].toString(), refCount(k)]),
  );
  const refs = Object.fromEntries(
    Object.entries(graph).map(([k, refs]) => [
      hashes[k].toString(),
      refs.map(v => hashes[v]),
    ]),
  );
  const delegate: GarbageCollectionDelegate = {
    getRefCount: async hash => refCounts[hash.toString()] || 0,
    getRefs: async hash => refs[hash.toString()] || [],
  };

  return {
    hashes,
    refCounts,
    refs,
    delegate,
  };
}

function expectRefCountUpdates(
  actual: Map<Hash, number>,
  expected: Record<string, number>,
) {
  const expectedAsMap = new Map(
    Object.entries(expected).map(([k, v]) => [fakeHash(k), v]),
  );
  expect(actual).to.deep.equal(expectedAsMap);
}

test('computeRefCountUpdates for basic diamond pattern', async () => {
  // If we have a diamond structure we update the refcount for C twice.
  //
  //   R
  //  / \
  //  A  B
  //  \ /
  //   C

  const {hashes, delegate} = createGraph(
    {
      r: ['a', 'b'],
      a: ['c'],
      b: ['c'],
      c: [],
    },
    'r',
  );

  const eHash = fakeHash('e');
  const refCountUpdates = await computeRefCountUpdates(
    [{old: hashes['r'], new: eHash}],
    new Set([eHash]),
    delegate,
  );
  expectRefCountUpdates(refCountUpdates, {
    r: 0,
    a: 0,
    b: 0,
    c: 0,
    e: 1,
  });
});

test('computeRefCountUpdates for a diamond pattern and a child', async () => {
  // If we have a diamond structure we update the refcount for C twice.
  //
  //   R
  //  / \
  //  A  B
  //  \ /
  //   C
  //   |
  //   D

  const {hashes, delegate} = createGraph(
    {
      r: ['a', 'b'],
      a: ['c'],
      b: ['c'],
      c: ['d'],
      d: [],
    },
    'r',
  );

  // Move test head from R to A
  //  A
  //  |
  //  C
  //  |
  //  D
  const refCountUpdates = await computeRefCountUpdates(
    [{old: hashes['r'], new: hashes['a']}],
    new Set(),
    delegate,
  );
  expectRefCountUpdates(refCountUpdates, {
    r: 0,
    a: 1,
    b: 0,
    c: 1,
  });
});

test('computeRefCountUpdates for 3 incoming refs', async () => {
  // If we have a diamond structure we update the refcount for D three times.
  //
  //    R
  //  / | \
  //  A B C
  //  \ | /
  //    D

  const {hashes, delegate} = createGraph(
    {
      r: ['a', 'b', 'c'],
      a: ['d'],
      b: ['d'],
      c: ['d'],
      d: [],
    },
    'r',
  );

  const eHash = fakeHash('e');
  const refCountUpdates = await computeRefCountUpdates(
    [{old: hashes['r'], new: eHash}],
    new Set([eHash]),
    delegate,
  );
  expectRefCountUpdates(refCountUpdates, {
    r: 0,
    a: 0,
    b: 0,
    c: 0,
    d: 0,
    e: 1,
  });
});

test('computeRefCountUpdates for 3 incoming refs bypassing one level', async () => {
  //    R
  //  / | \
  //  A B  |
  //  \ | /
  //    C

  const {hashes, delegate} = createGraph(
    {
      r: ['a', 'b', 'c'],
      a: ['c'],
      b: ['c'],
      c: [],
    },
    'r',
  );

  const eHash = fakeHash('e');
  const refCountUpdates = await computeRefCountUpdates(
    [{old: hashes['r'], new: eHash}],
    new Set([eHash]),
    delegate,
  );
  expectRefCountUpdates(refCountUpdates, {
    r: 0,
    a: 0,
    b: 0,
    c: 0,
    e: 1,
  });
});
