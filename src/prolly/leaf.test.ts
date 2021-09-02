import {expect} from '@esm-bundle/chai';
import {Chunk} from '../dag/mod';
import {Leaf} from './leaf';
import type {Entry} from './mod';
import {initHasher} from '../hash';

setup(async () => {
  await initHasher();
});

function makeLeaf(entries: Entry[]): Chunk {
  return Chunk.new(entries, []);
}

test('try from', () => {
  const t = (input: Chunk, expected: Entry) => {
    const leaf = Leaf.load(input);
    const actual = leaf.entries[0];
    expect(actual).to.deep.equal(expected);
  };

  // zero-length keys and vals are supported.

  t(makeLeaf([['', '']]), ['', '']);

  // normal non-zero keys and values too.
  t(makeLeaf([['\u0001', 1]]), ['\u0001', 1]);
  t(makeLeaf([['\u0001\u0002', [3, 4]]]), ['\u0001\u0002', [3, 4]]);
});

test('leaf iter', async () => {
  const t = (chunk: Chunk | undefined, expected: Entry[]) => {
    const leaf = chunk ? Leaf.load(chunk) : undefined;
    if (!leaf) {
      expect(expected).to.deep.equal([]);
    } else {
      expect([...leaf]).to.deep.equal(expected);
    }
  };

  // None is flattened to empty iterator.
  t(undefined, []);
  t(makeLeaf([]), []);

  // Single entry
  t(makeLeaf([['\u0001', 2]]), [['\u0001', 2]]);

  // multiple entries
  t(
    makeLeaf([
      ['a', []],
      ['b', 1],
    ]),
    [
      ['a', []],
      ['b', 1],
    ],
  );
});

test('round trip', async () => {
  const k0 = '\u0000';
  const k1 = '\u0001';
  const expected1: Entry[] = [
    [k0, 0],
    [k1, 1],
  ];
  const expected = new Leaf(expected1);
  const actual = Leaf.load(
    Chunk.read(expected.chunk.hash, expected.chunk.data, undefined),
  );
  expect(expected).to.deep.equal(actual);
  expect([...actual]).to.have.lengthOf(2);
});

test('load', async () => {
  // This tests invalid data so we can't use valid type annotations.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = async (kv: any, expectedError: string) => {
    let err;
    try {
      // @ts-expect-error Constructor is private
      const chunk = new Chunk('hash', kv, undefined);
      Leaf.load(chunk);
    } catch (e) {
      err = e;
    }
    expect(err).to.be.instanceOf(
      Error,
      `expected error with message: ${expectedError}`,
    );
    expect(err.message).to.equal(expectedError);
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
