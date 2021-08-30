import {expect} from '@esm-bundle/chai';
import {Chunk} from '../dag/mod';
import {Leaf} from './leaf';
import type {Entry} from './mod';
import * as flatbuffers from 'flatbuffers';
import {LeafEntry as LeafEntryFB} from './generated/leaf/leaf-entry';
import {Leaf as LeafFB} from './generated/leaf/leaf';
import {initHasher} from '../hash';

setup(async () => {
  await initHasher();
});

function makeLeaf(
  kv: (Uint8Array | number[] | undefined)[] | undefined,
): Chunk {
  const builder = new flatbuffers.Builder();
  let entriesVec = 0;

  if (kv) {
    const entries: number[] = [];
    for (let i = 0; i < kv.length / 2; i++) {
      const key = kv[i * 2];
      const val = kv[i * 2 + 1];
      const keyVec = key ? LeafEntryFB.createKeyVector(builder, key) : 0;
      const valVec = val ? LeafEntryFB.createValVector(builder, val) : 0;
      const entry = LeafEntryFB.createLeafEntry(builder, keyVec, valVec);
      entries.push(entry);
    }
    entriesVec = LeafFB.createEntriesVector(builder, entries);
  }
  const leaf = LeafFB.createLeaf(builder, entriesVec);
  builder.finish(leaf);
  return Chunk.new(builder.asUint8Array(), []);
}

test('try from', () => {
  const t = (input: Chunk, expected: Entry) => {
    const leaf = Leaf.load(input);
    const actual = leaf.entries().next().value;
    expect(actual).to.deep.equal(expected);
  };

  // zero-length keys and vals are supported.
  t(makeLeaf([u8s(), u8s()]), {
    key: u8s(),
    val: u8s(),
  });

  // normal non-zero keys and values too.
  t(makeLeaf([u8s(1), u8s(1)]), {
    key: u8s(1),
    val: u8s(1),
  });
  t(makeLeaf([u8s(1, 2), u8s(3, 4)]), {
    key: u8s(1, 2),
    val: u8s(3, 4),
  });
});

const u8s = (...arr: number[]) => new Uint8Array(arr);

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
  t(makeLeaf([[1], [2]]), [
    {
      key: u8s(1),
      val: u8s(2),
    },
  ]);

  // multiple entries
  t(makeLeaf([[], [], [1], [1]]), [
    {
      key: u8s(),
      val: u8s(),
    },
    {
      key: u8s(1),
      val: u8s(1),
    },
  ]);
});

test('round trip', async () => {
  const k0 = u8s(0);
  const k1 = u8s(1);
  const expected1 = [
    {key: k0, val: k0},
    {key: k1, val: k1},
  ];
  const expected = Leaf.new(expected1);
  const actual = Leaf.load(
    Chunk.read(expected.chunk.hash, expected.chunk.data, undefined),
  );
  expect(expected).to.deep.equal(actual);
  expect([...actual]).to.have.lengthOf(2);
});

test('load', async () => {
  const t = async (
    kv: (Uint8Array | number[] | undefined)[] | undefined,
    expectedError: string,
  ) => {
    let err;
    try {
      const chunk = makeLeaf(kv);
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

  // Cannot detect missing vs empty in TS FB implementation.
  // await t(undefined, 'missing entries');

  await t([undefined, undefined], 'missing key');
  await t([[], undefined], 'missing val');
  await t([[1], [], [1], []], 'duplicate key');
  await t([[1], [], [0], []], 'unsorted key');
});
