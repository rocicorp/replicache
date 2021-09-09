import {expect} from '@esm-bundle/chai';
import {Chunk} from '../dag/mod';
import {getEntriesFromFlatbuffer, Leaf} from './leaf';
import type {Entry} from './mod';
import {initHasher} from '../hash';
import * as flatbuffers from 'flatbuffers';
import {Leaf as LeafFB} from './generated/leaf/leaf';
import {LeafEntry as LeafEntryFB} from './generated/leaf/leaf-entry';
import * as utf8 from '../utf8';

setup(async () => {
  await initHasher();
});

function makeLeafJSON(entries: Entry[]): Chunk {
  return Chunk.new(entries, []);
}

function makeLeafFlatbuffer(entries: Entry[]): Chunk {
  return Chunk.new(entriesAsFlatbuffer(entries), []);
}

for (const makeLeaf of [makeLeafJSON, makeLeafFlatbuffer]) {
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
}
test('round trip', async () => {
  const roundtrip = (entries: Entry[]) => {
    const expected = new Leaf(entries);
    const actual = Leaf.load(
      Chunk.read(expected.chunk.hash, expected.chunk.data, []),
    );
    expect(expected).to.deep.equal(actual);
    expect([...actual]).to.have.lengthOf(2);

    {
      const actual = Leaf.load(
        Chunk.read(
          expected.chunk.hash,
          entriesAsFlatbuffer(expected.chunk.data as Entry[]),
          [],
        ),
      );
      expect(expected).to.deep.equal(actual);
      expect([...actual]).to.have.lengthOf(2);
    }
  };

  roundtrip([
    ['\u0000', 0],
    ['\u0001', 1],
  ]);
});

test('load errors', async () => {
  // This tests invalid data so we can't use valid type annotations.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = async (data: any, expectedError: string) => {
    let err;
    try {
      // @ts-expect-error Constructor is private
      const chunk = new Chunk('hash', data, undefined);
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

  // flatbuffers too
  await t(
    entriesAsFlatbuffer([
      ['a', ''],
      ['a', ''],
    ]),
    'duplicate key',
  );
  await t(
    entriesAsFlatbuffer([
      ['b', ''],
      ['a', ''],
    ]),
    'unsorted key',
  );

  // No way to test invalid flatbuffer data in JS. Antything that is invalid is
  // just treated as an empty vector.
});

function entriesAsFlatbuffer(entries: Entry[]): Uint8Array {
  const builder = new flatbuffers.Builder();
  const leafEntries = [];
  for (const entry of entries) {
    const leafEntry = LeafEntryFB.createLeafEntry(
      builder,
      LeafEntryFB.createKeyVector(builder, utf8.encode(entry[0])),
      LeafEntryFB.createValVector(
        builder,
        utf8.encode(JSON.stringify(entry[1])),
      ),
    );
    leafEntries.push(leafEntry);
  }
  const root = LeafFB.createLeaf(
    builder,
    LeafFB.createEntriesVector(builder, leafEntries),
  );
  builder.finish(root);
  return builder.asUint8Array();
}

test('getEntriesFromFlatbuffer', () => {
  const roundtrip = (entries: Entry[]) => {
    const buf = entriesAsFlatbuffer(entries);
    const actual = getEntriesFromFlatbuffer(buf);
    expect(actual).to.deep.equal(entries);
    const buf2 = entriesAsFlatbuffer(actual);
    expect(buf).to.deep.equal(buf2);
  };
  roundtrip([]);
  roundtrip([['a', 1]]);
  roundtrip([
    ['a', 1],
    ['b', 2],
  ]);
  roundtrip([['a', {a: true, b: false, c: null}]]);
});
