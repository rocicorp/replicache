import {expect} from '@esm-bundle/chai';
import type {ScanItem} from './scan';
import * as dag from '../dag/mod';
import {BTreeWrite} from '../btree/mod';
import type {ReadonlyEntry} from '../btree/node';
import type {ReadonlyJSONValue} from '../json';
import {decodeIndexKey, encodeIndexKey} from './index-key.js';

test('scanReader', async () => {
  const t = async (seekKey: string | undefined, expected: string[]) => {
    const dagStore = new dag.TestStore();

    await dagStore.withWrite(async dagWrite => {
      const map = new BTreeWrite(dagWrite);
      await map.put('foo', 'foo');
      await map.put('bar', 'bar');
      await map.put('baz', 'baz');
      const actual = [];
      const reader = await map.scanReader();
      if (seekKey) {
        await reader.seek(seekKey);
      }
      let entry: ReadonlyEntry<ReadonlyJSONValue> | undefined;
      while ((entry = await reader.next())) {
        actual.push(entry[0]);
      }
      const expected2 = expected;
      expect(actual).to.deep.equal(expected2);
    });
  };

  // Empty
  await t(undefined, ['bar', 'baz', 'foo']);

  // Prefix alone
  await t('', ['bar', 'baz', 'foo']);
  await t('ba', ['bar', 'baz', 'foo']);
  await t('bar', ['bar', 'baz', 'foo']);
  await t('bas', ['baz', 'foo']);
  await t('a', ['bar', 'baz', 'foo']);
  await t('b', ['bar', 'baz', 'foo']);
  await t('bas', ['baz', 'foo']);
  await t('baz', ['baz', 'foo']);
  await t('baza', ['foo']);
  await t('fop', []);

  // exclusive and limit are handled externally from the reader.
});

test('regular map', async () => {
  const t = async (keys: string[], seekKey: string, expected: string[]) => {
    const dagStore = new dag.TestStore();

    await dagStore.withWrite(async dagWrite => {
      const map = new BTreeWrite(dagWrite);
      for (const key of keys) {
        await map.put(key, 'value');
      }
      const got = [];

      const reader = await map.scanReader();
      if (seekKey) {
        await reader.seek(seekKey);
      }
      let entry: ReadonlyEntry<ReadonlyJSONValue> | undefined;
      while ((entry = await reader.next())) {
        got.push(entry[0]);
      }
      expect(got).to.deep.equal(expected);
    });
  };

  await t(['', 'a', 'aa', 'ab', 'b'], '', ['', 'a', 'aa', 'ab', 'b']);
  await t(['', 'a', 'aa', 'ab', 'b'], 'a', ['a', 'aa', 'ab', 'b']);
  await t(['', 'a', 'aa', 'ab', 'b'], 'aa', ['aa', 'ab', 'b']);
  await t(['', 'a', 'aa', 'ab', 'b'], 'ab', ['ab', 'b']);
});

test('index map', async () => {
  const t = async (
    entries: [string, string][],
    seekSecondaryKey: string,
    seekPrimaryKey: string,
    expected: [string, string][],
  ) => {
    const testDesc = `entries: ${entries}, seekSecondaryKey ${seekSecondaryKey}, seekPrimaryKey: ${seekPrimaryKey}, expected: ${expected}`;

    const dagStore = new dag.TestStore();

    await dagStore.withWrite(async dagWrite => {
      const map = new BTreeWrite(dagWrite);
      for (const entry of entries) {
        const encoded = encodeIndexKey(entry);
        await map.put(encoded, 'value');
      }
      const got = [];
      const reader = await map.scanReader();

      const seekKey = encodeIndexKey([seekSecondaryKey, seekPrimaryKey]);
      await reader.seek(seekKey);

      let entry: ReadonlyEntry<ReadonlyJSONValue> | undefined;
      while ((entry = await reader.next())) {
        got.push(decodeIndexKey(entry[0]));
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
      '',
      [
        ['', pk],
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
      '',
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
      'aa',
      '',
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
      'ab',
      '',

      [
        ['ab', pk],
        ['b', pk],
      ],
    );
  }

  // scanning with startSecondaryKey and startKey,
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
      ['a', ''],
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
    '\u{0000}\u{0000}',
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
    '\u{0000}\u{0001}',
    [
      ['a', '\u0000\u0001'],
      ['a', '\u0001'],
    ],
  );

  // scanning with startSecondaryKey and startKey,
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
      ['', ''],
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
    'aa',
    '\u{0000}\u{0000}',
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
    'ab',
    '\u{0000}\u{0001}',
    [
      ['ab', '\u0000\u0001'],
      ['b', '\u0001'],
    ],
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

function convertEntry(entry: ReadonlyEntry<ReadonlyJSONValue>): ScanItem {
  return {
    primaryKey: entry[0],
    secondaryKey: '',
    val: entry[1],
  };
}

function convertEntryIndexScan(
  entry: ReadonlyEntry<ReadonlyJSONValue>,
): ScanItem {
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
    seekKey: string,
    isIndexScan: boolean,
    expected: ScanItem[],
  ) => {
    const dagStore = new dag.TestStore();

    await dagStore.withWrite(async dagWrite => {
      const map = await makeBTreeWrite(dagWrite, entries);

      const actual: ScanItem[] = [];
      const reader = await map.scanReader();
      if (seekKey) {
        await reader.seek(seekKey);
      }
      let entry: ReadonlyEntry<ReadonlyJSONValue> | undefined;
      while ((entry = await reader.next())) {
        actual.push(
          isIndexScan ? convertEntryIndexScan(entry) : convertEntry(entry),
        );
      }

      expect(actual).to.deep.equal(expected);
    });
  };

  await t(
    [
      ['a', '1'],
      ['b', '2'],
      ['c', '3'],
    ],
    'b',
    false,
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
      ['\u{0000}as\u{0000}ap', '1'],
      ['\u{0000}bs\u{0000}bp', '2'],
      ['\u{0000}cs\u{0000}cp', '3'],
    ],
    encodeIndexKey(['bs', '']),
    true,
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
      ['\u{0000}bs\u{0000}bp1', '2'],
      ['\u{0000}bs\u{0000}bp2', '3'],
      ['\u{0000}cs\u{0000}cp', '4'],
    ],
    encodeIndexKey(['bs', 'bp2']),
    true,
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
});
