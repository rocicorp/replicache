import {expect} from '@esm-bundle/chai';
import {convert, scan, ScanItem, ScanOptions} from './scan';
import * as kv from '../kv/mod';
import * as dag from '../dag/mod';
import {decodeIndexKey, encodeIndexKey} from './index';
import {BTreeWrite} from '../btree/mod';
import type {Entry} from '../btree/entry-type';
import type {ReadonlyJSONValue} from '../json';

test('scan', async () => {
  const t = async (opts: ScanOptions, expected: string[]) => {
    const testDesc = `opts: ${JSON.stringify(
      opts,
      null,
      2,
    )}, expected: ${expected}`;

    const memStore = new kv.MemStore();
    const dagStore = new dag.Store(memStore);

    await dagStore.withWrite(async dagWrite => {
      const map = new BTreeWrite(dagWrite);
      await map.put('foo', 'foo');
      await map.put('bar', 'bar');
      await map.put('baz', 'baz');
      const optsInternal = convert(opts);
      const actual = [];
      for await (const key of scan(map, optsInternal, entry => entry[0])) {
        actual.push(key);
      }
      const expected2 = expected;
      expect(actual).to.deep.equal(expected2, testDesc);
    });
  };

  // Empty
  await t(
    {
      prefix: undefined,
      startSecondaryKey: undefined,
      startKey: undefined,
      startExclusive: undefined,
      limit: undefined,
      indexName: undefined,
    },
    ['bar', 'baz', 'foo'],
  );

  // Prefix alone
  await t(
    {
      prefix: '',
      startSecondaryKey: undefined,
      startKey: undefined,
      startExclusive: undefined,
      limit: undefined,
      indexName: undefined,
    },
    ['bar', 'baz', 'foo'],
  );
  await t(
    {
      prefix: 'ba',
      startSecondaryKey: undefined,
      startKey: undefined,
      startExclusive: undefined,
      limit: undefined,
      indexName: undefined,
    },
    ['bar', 'baz'],
  );
  await t(
    {
      prefix: 'bar',
      startSecondaryKey: undefined,
      startKey: undefined,
      startExclusive: undefined,
      limit: undefined,
      indexName: undefined,
    },
    ['bar'],
  );
  await t(
    {
      prefix: 'bas',
      startSecondaryKey: undefined,
      startKey: undefined,
      startExclusive: undefined,
      limit: undefined,
      indexName: undefined,
    },
    [],
  );
  // start key alone
  await t(
    {
      prefix: undefined,
      startSecondaryKey: undefined,
      startKey: '',
      startExclusive: undefined,
      limit: undefined,
      indexName: undefined,
    },
    ['bar', 'baz', 'foo'],
  );
  await t(
    {
      prefix: undefined,
      startSecondaryKey: undefined,
      startKey: 'a',
      startExclusive: undefined,
      limit: undefined,
      indexName: undefined,
    },
    ['bar', 'baz', 'foo'],
  );
  await t(
    {
      prefix: undefined,
      startSecondaryKey: undefined,
      startKey: 'b',
      startExclusive: undefined,
      limit: undefined,
      indexName: undefined,
    },
    ['bar', 'baz', 'foo'],
  );
  await t(
    {
      prefix: undefined,
      startSecondaryKey: undefined,
      startKey: 'bas',
      startExclusive: undefined,
      limit: undefined,
      indexName: undefined,
    },
    ['baz', 'foo'],
  );
  await t(
    {
      prefix: undefined,
      startSecondaryKey: undefined,
      startKey: 'baz',
      startExclusive: undefined,
      limit: undefined,
      indexName: undefined,
    },
    ['baz', 'foo'],
  );
  await t(
    {
      prefix: undefined,
      startSecondaryKey: undefined,
      startKey: 'baza',
      startExclusive: undefined,
      limit: undefined,
      indexName: undefined,
    },
    ['foo'],
  );
  await t(
    {
      prefix: undefined,
      startSecondaryKey: undefined,
      startKey: 'fop',
      startExclusive: undefined,
      limit: undefined,
      indexName: undefined,
    },
    [],
  );

  // exclusive
  await t(
    {
      prefix: undefined,
      startSecondaryKey: undefined,
      startKey: '',
      startExclusive: true,
      limit: undefined,
      indexName: undefined,
    },
    ['bar', 'baz', 'foo'],
  );
  await t(
    {
      prefix: undefined,
      startSecondaryKey: undefined,
      startKey: 'bar',
      startExclusive: true,
      limit: undefined,
      indexName: undefined,
    },
    ['baz', 'foo'],
  );

  // limit alone
  await t(
    {
      prefix: undefined,
      startSecondaryKey: undefined,
      startKey: undefined,
      startExclusive: undefined,
      limit: 0,
      indexName: undefined,
    },
    [],
  );
  await t(
    {
      prefix: undefined,
      startSecondaryKey: undefined,
      startKey: undefined,
      startExclusive: undefined,
      limit: 1,
      indexName: undefined,
    },
    ['bar'],
  );
  await t(
    {
      prefix: undefined,
      startSecondaryKey: undefined,
      startKey: undefined,
      startExclusive: undefined,
      limit: 2,
      indexName: undefined,
    },
    ['bar', 'baz'],
  );
  await t(
    {
      prefix: undefined,
      startSecondaryKey: undefined,
      startKey: undefined,
      startExclusive: undefined,
      limit: 3,
      indexName: undefined,
    },
    ['bar', 'baz', 'foo'],
  );
  await t(
    {
      prefix: undefined,
      startSecondaryKey: undefined,
      startKey: undefined,
      startExclusive: undefined,
      limit: 7,
      indexName: undefined,
    },
    ['bar', 'baz', 'foo'],
  );

  // combos
  await t(
    {
      prefix: 'f',
      startSecondaryKey: undefined,
      startKey: undefined,
      startExclusive: undefined,
      limit: 0,
      indexName: undefined,
    },
    [],
  );
  await t(
    {
      prefix: 'f',
      startSecondaryKey: undefined,
      startKey: undefined,
      startExclusive: undefined,
      limit: 7,
      indexName: undefined,
    },
    ['foo'],
  );
  await t(
    {
      prefix: 'ba',
      startSecondaryKey: undefined,
      startKey: 'a',
      startExclusive: undefined,
      limit: 2,
      indexName: undefined,
    },
    ['bar', 'baz'],
  );
  await t(
    {
      prefix: 'ba',
      startSecondaryKey: undefined,
      startKey: 'a',
      startExclusive: false,
      limit: 1,
      indexName: undefined,
    },
    ['bar'],
  );
  await t(
    {
      prefix: 'ba',
      startSecondaryKey: undefined,
      startKey: 'a',
      startExclusive: false,
      limit: 1,
      indexName: undefined,
    },
    ['bar'],
  );
  await t(
    {
      prefix: 'ba',
      startSecondaryKey: undefined,
      startKey: 'bar',
      startExclusive: true,
      limit: 1,
      indexName: undefined,
    },
    ['baz'],
  );
});

test('exclusive regular map', async () => {
  const t = async (keys: string[], startKey: string, expected: string[]) => {
    const testDesc = `keys: ${keys}, startKey: ${startKey}, expected: ${expected}`;

    const memStore = new kv.MemStore();
    const dagStore = new dag.Store(memStore);

    await dagStore.withWrite(async dagWrite => {
      const map = new BTreeWrite(dagWrite);
      for (const key of keys) {
        await map.put(key, 'value');
      }
      const opts = {
        prefix: undefined,
        startSecondaryKey: undefined,
        startKey,
        startExclusive: true,
        limit: undefined,
        indexName: undefined,
      };
      const convertedOpts = convert(opts);
      const got = [];

      for await (const key of scan(map, convertedOpts, entry => entry[0])) {
        got.push(key);
      }
      expect(got).to.deep.equal(expected, testDesc);
    });
  };

  await t(['', 'a', 'aa', 'ab', 'b'], '', ['a', 'aa', 'ab', 'b']);
  await t(['', 'a', 'aa', 'ab', 'b'], 'a', ['aa', 'ab', 'b']);
  await t(['', 'a', 'aa', 'ab', 'b'], 'aa', ['ab', 'b']);
  await t(['', 'a', 'aa', 'ab', 'b'], 'ab', ['b']);
});

test('exclusive index map', async () => {
  const t = async (
    entries: [string, string][],
    startSecondaryKey: string,
    startKey: string | undefined,
    expected: [string, string][],
  ) => {
    const testDesc = `entries: ${entries}, startSecondaryKey ${startSecondaryKey}, startKey: ${startKey}, expected: ${expected}`;

    const memStore = new kv.MemStore();
    const dagStore = new dag.Store(memStore);

    await dagStore.withWrite(async dagWrite => {
      const map = new BTreeWrite(dagWrite);
      for (const entry of entries) {
        const encoded = encodeIndexKey(entry);
        await map.put(encoded, 'value');
      }
      const opts = {
        prefix: undefined,
        startSecondaryKey,
        startKey,
        startExclusive: true,
        limit: undefined,
        indexName: 'index',
      };
      const got = [];
      for await (const key of scan(map, convert(opts), entry => entry[0])) {
        const [secondary, primary] = decodeIndexKey(key);
        got.push([secondary, primary]);
      }
      expect(got).to.deep.equal(expected, testDesc);
    });
  };

  // Test exclusive scanning with startSecondaryKey.
  const v: string[] = ['', '\u0000', '\u0001', '\u0001\u0002'];
  for (const pk of v) {
    await t(
      [
        ['', pk],
        ['a', pk],
        ['aa', pk],
        ['ab', pk],
        ['b', pk],
      ],
      '',
      undefined,
      [
        ['a', pk],
        ['aa', pk],
        ['ab', pk],
        ['b', pk],
      ],
    );
    await t(
      [
        ['', pk],
        ['a', pk],
        ['aa', pk],
        ['ab', pk],
        ['b', pk],
      ],
      'a',
      undefined,
      [
        ['aa', pk],
        ['ab', pk],
        ['b', pk],
      ],
    );
    await t(
      [
        ['', pk],
        ['a', pk],
        ['aa', pk],
        ['ab', pk],
        ['b', pk],
      ],
      'aa',
      undefined,
      [
        ['ab', pk],
        ['b', pk],
      ],
    );
    await t(
      [
        ['', pk],
        ['a', pk],
        ['aa', pk],
        ['ab', pk],
        ['b', pk],
      ],
      'ab',
      undefined,
      [['b', pk]],
    );
  }

  // t exclusive scanning with startSecondaryKey and startKey,
  // with the same secondary value.
  await t(
    [
      ['a', ''],
      ['a', '\u0000'],
      ['a', '\u0000\u0000'],
      ['a', '\u0000\u0001'],
      ['a', '\u0001'],
    ],
    'a',
    '',
    [
      ['a', '\u0000'],
      ['a', '\u0000\u0000'],
      ['a', '\u0000\u0001'],
      ['a', '\u0001'],
    ],
  );
  await t(
    [
      ['a', ''],
      ['a', '\u0000'],
      ['a', '\u0000\u0000'],
      ['a', '\u0000\u0001'],
      ['a', '\u0001'],
    ],
    'a',
    '\u{0000}',
    [
      ['a', '\u0000\u0000'],
      ['a', '\u0000\u0001'],
      ['a', '\u0001'],
    ],
  );
  await t(
    [
      ['a', ''],
      ['a', '\u0000'],
      ['a', '\u0000\u0000'],
      ['a', '\u0000\u0001'],
      ['a', '\u0001'],
    ],
    'a',
    '\u{0000}\u{0000}',
    [
      ['a', '\u0000\u0001'],
      ['a', '\u0001'],
    ],
  );
  await t(
    [
      ['a', ''],
      ['a', '\u0000'],
      ['a', '\u0000\u0000'],
      ['a', '\u0000\u0001'],
      ['a', '\u0001'],
    ],
    'a',
    '\u{0000}\u{0001}',
    [['a', '\u0001']],
  );

  // t exclusive scanning with startSecondaryKey and startKey,
  // with different secondary values.
  await t(
    [
      ['', ''],
      ['a', '\u0000'],
      ['aa', '\u0000\u0000'],
      ['ab', '\u0000\u0001'],
      ['b', '\u0001'],
    ],
    '',
    '',
    [
      ['a', '\u0000'],
      ['aa', '\u0000\u0000'],
      ['ab', '\u0000\u0001'],
      ['b', '\u0001'],
    ],
  );
  await t(
    [
      ['', ''],
      ['a', '\u0000'],
      ['aa', '\u0000\u0000'],
      ['ab', '\u0000\u0001'],
      ['b', '\u0001'],
    ],
    'a',
    '\u{0000}',
    [
      ['aa', '\u0000\u0000'],
      ['ab', '\u0000\u0001'],
      ['b', '\u0001'],
    ],
  );
  await t(
    [
      ['', ''],
      ['a', '\u0000'],
      ['aa', '\u0000\u0000'],
      ['ab', '\u0000\u0001'],
      ['b', '\u0001'],
    ],
    'aa',
    '\u{0000}\u{0000}',
    [
      ['ab', '\u0000\u0001'],
      ['b', '\u0001'],
    ],
  );
  await t(
    [
      ['', ''],
      ['a', '\u0000'],
      ['aa', '\u0000\u0000'],
      ['ab', '\u0000\u0001'],
      ['b', '\u0001'],
    ],
    'ab',
    '\u{0000}\u{0001}',
    [['b', '\u0001']],
  );
});

async function makeBTreeWrite(
  dagWrite: dag.Write,
  entries: Iterable<[string, string]>,
): Promise<BTreeWrite> {
  const map = new BTreeWrite(dagWrite);
  for (const [k, v] of entries) {
    await map.put(k, v);
  }
  return map;
}

function convertEntry(entry: Entry<ReadonlyJSONValue>): ScanItem {
  return {
    primaryKey: entry[0],
    secondaryKey: '',
    val: entry[1],
  };
}

function convertEntryIndexScan(entry: Entry<ReadonlyJSONValue>): ScanItem {
  const decoded = decodeIndexKey(entry[0]);
  const secondary = decoded[0];
  const primary = decoded[1];
  return {
    primaryKey: primary,
    secondaryKey: secondary,
    val: entry[1],
  };
}

test('scan index startKey', async () => {
  const t = async (
    entries: Iterable<[string, string]>,
    opts: ScanOptions,
    expected: ScanItem[],
  ) => {
    const memStore = new kv.MemStore();
    const dagStore = new dag.Store(memStore);

    await dagStore.withWrite(async dagWrite => {
      const map = await makeBTreeWrite(dagWrite, entries);
      const testDesc = `opts: ${opts}, expected: ${expected}`;

      const actual: ScanItem[] = [];
      for await (const item of scan(
        map,
        convert(opts),
        opts.indexName ? convertEntryIndexScan : convertEntry,
      )) {
        actual.push(item);
      }

      expect(actual).to.deep.equal(expected, testDesc);
    });
  };

  await t(
    [
      ['a', '1'],
      ['b', '2'],
      ['c', '3'],
    ],
    {
      prefix: undefined,
      startSecondaryKey: undefined,
      startKey: 'b',
      startExclusive: false,
      limit: undefined,
      indexName: undefined,
    },
    [
      {
        primaryKey: 'b',
        secondaryKey: '',
        val: '2',
      },
      {
        primaryKey: 'c',
        secondaryKey: '',
        val: '3',
      },
    ],
  );

  await t(
    [
      ['a', '1'],
      ['b', '2'],
      ['c', '3'],
    ],
    {
      prefix: undefined,
      startSecondaryKey: undefined,
      startKey: 'b',
      startExclusive: true,
      limit: undefined,
      indexName: undefined,
    },
    [
      {
        primaryKey: 'c',
        secondaryKey: '',
        val: '3',
      },
    ],
  );

  await t(
    [
      ['\u{0000}as\u{0000}ap', '1'],
      ['\u{0000}bs\u{0000}bp', '2'],
      ['\u{0000}cs\u{0000}cp', '3'],
    ],
    {
      prefix: undefined,
      startSecondaryKey: 'bs',
      startKey: undefined,
      startExclusive: false,
      limit: undefined,
      indexName: 'index',
    },
    [
      {
        primaryKey: 'bp',
        secondaryKey: 'bs',
        val: '2',
      },
      {
        primaryKey: 'cp',
        secondaryKey: 'cs',
        val: '3',
      },
    ],
  );

  await t(
    [
      ['\u{0000}as\u{0000}ap', '1'],
      ['\u{0000}bs\u{0000}bp', '2'],
      ['\u{0000}cs\u{0000}cp', '3'],
    ],
    {
      prefix: undefined,
      startSecondaryKey: 'bs',
      startKey: undefined,
      startExclusive: true,
      limit: undefined,
      indexName: 'index',
    },
    [
      {
        primaryKey: 'cp',
        secondaryKey: 'cs',
        val: '3',
      },
    ],
  );

  await t(
    [
      ['\u{0000}as\u{0000}ap', '1'],
      ['\u{0000}bs\u{0000}bp1', '2'],
      ['\u{0000}bs\u{0000}bp2', '3'],
      ['\u{0000}cs\u{0000}cp', '4'],
    ],
    {
      prefix: undefined,
      startSecondaryKey: 'bs',
      startKey: 'bp2',
      startExclusive: false,
      limit: undefined,
      indexName: 'index',
    },
    [
      {
        primaryKey: 'bp2',
        secondaryKey: 'bs',
        val: '3',
      },
      {
        primaryKey: 'cp',
        secondaryKey: 'cs',
        val: '4',
      },
    ],
  );

  await t(
    [
      ['\u{0000}as\u{0000}ap', '1'],
      ['\u{0000}bs\u{0000}bp1', '2'],
      ['\u{0000}bs\u{0000}bp2', '3'],
      ['\u{0000}cs\u{0000}cp', '4'],
    ],
    {
      prefix: undefined,
      startSecondaryKey: 'bs',
      startKey: 'bp2',
      startExclusive: true,
      limit: undefined,
      indexName: 'index',
    },
    [
      {
        primaryKey: 'cp',
        secondaryKey: 'cs',
        val: '4',
      },
    ],
  );
});
