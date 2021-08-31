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
  kv: [string | undefined, Uint8Array | undefined][] | undefined,
): Chunk {
  const builder = new flatbuffers.Builder();
  let entriesVec = 0;

  if (kv) {
    const entries: number[] = [];
    for (let i = 0; i < kv.length; i++) {
      const key = kv[i][0];
      const val = kv[i][1];
      const keyOffset = key !== undefined ? builder.createString(key) : 0;
      const valVec = val ? LeafEntryFB.createValVector(builder, val) : 0;
      const entry = LeafEntryFB.createLeafEntry(builder, keyOffset, valVec);
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
  // TODO(arv): zero-length leafs are not supported due to bugs in flatbuffer
  // https://github.com/google/flatbuffers/issues/6798
  // t(makeLeaf([['', u8s()]]), {
  //   key: '',
  //   val: u8s(),
  // });

  // normal non-zero keys and values too.
  t(makeLeaf([['\u0001', u8s(1)]]), {
    key: '\u0001',
    val: u8s(1),
  });
  t(makeLeaf([['\u0001\u0002', u8s(3, 4)]]), {
    key: '\u0001\u0002',
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
  t(makeLeaf([['\u0001', u8s(2)]]), [
    {
      key: '\u0001',
      val: u8s(2),
    },
  ]);

  // multiple entries
  t(
    makeLeaf([
      ['a', u8s()],
      ['b', u8s(1)],
    ]),
    [
      {
        key: 'a',
        val: u8s(),
      },
      {
        key: 'b',
        val: u8s(1),
      },
    ],
  );
});

test('round trip', async () => {
  const k0 = '\u0000';
  const k1 = '\u0001';
  const expected1 = [
    {key: k0, val: u8s(0)},
    {key: k1, val: u8s(1)},
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
    kv: [string | undefined, Uint8Array | undefined][] | undefined,
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

  // TODO(arv): Cannot detect missing keys due to bugs in flatbuffers
  // https://github.com/google/flatbuffers/issues/6798
  // await t([[undefined, undefined]], 'missing key');
  await t([['0', undefined]], 'missing val');
  await t(
    [
      ['\u0001', u8s()],
      ['\u0001', u8s()],
    ],
    'duplicate key',
  );
  await t(
    [
      ['\u0001', u8s()],
      ['\u0000', u8s()],
    ],
    'unsorted key',
  );
});
