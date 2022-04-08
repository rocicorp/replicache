import {expect} from '@esm-bundle/chai';
import type {ScanItem} from './scan';
import * as dag from '../dag/mod';
import {BTreeWrite} from '../btree/mod';
import {decodeIndexKey} from './index.js';
import {fromKeyForIndexScanInternal} from '../scan-iterator.js';

test('scan', async () => {
  const t = async (fromKey: string, expected: string[]) => {
    const dagStore = new dag.TestStore();

    await dagStore.withWrite(async dagWrite => {
      const map = new BTreeWrite(dagWrite);
      await map.put('foo', 'foo');
      await map.put('bar', 'bar');
      await map.put('baz', 'baz');
      await map.flush();

      const actual = [];
      for await (const entry of map.scan(fromKey)) {
        actual.push(entry[0]);
      }
      const expected2 = expected;
      expect(actual).to.deep.equal(expected2);
    });
  };

  await t('', ['bar', 'baz', 'foo']);
  await t('ba', ['bar', 'baz', 'foo']);
  await t('bar', ['bar', 'baz', 'foo']);
  await t('bas', ['baz', 'foo']);
  await t('baz', ['baz', 'foo']);
  await t('baza', ['foo']);
  await t('fop', []);
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

test('scan index startKey', async () => {
  const t = async (
    entries: Iterable<[string, string]>,
    {
      startSecondaryKey,
      startPrimaryKey,
    }: {
      startSecondaryKey: string;
      startPrimaryKey?: string;
    },
    expected: ScanItem[],
  ) => {
    const dagStore = new dag.TestStore();

    await dagStore.withWrite(async dagWrite => {
      const map = await makeBTreeWrite(dagWrite, entries);
      await map.flush();

      const fromKey = fromKeyForIndexScanInternal({
        start: {key: [startSecondaryKey, startPrimaryKey]},
        indexName: 'dummy',
      });
      const actual: ScanItem[] = [];
      for await (const entry of map.scan(fromKey)) {
        const [secondaryKey, primaryKey] = decodeIndexKey(entry[0]);
        actual.push({primaryKey, secondaryKey, val: entry[1]});
      }

      expect(actual).to.deep.equal(expected);
    });
  };

  await t(
    [
      ['\u{0000}as\u{0000}ap', '1'],
      ['\u{0000}bs\u{0000}bp', '2'],
      ['\u{0000}cs\u{0000}cp', '3'],
    ],
    {
      startSecondaryKey: 'bs',
      startPrimaryKey: undefined,
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
      startSecondaryKey: 'bs',
      startPrimaryKey: undefined,
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
      ['\u{0000}bs\u{0000}bp1', '2'],
      ['\u{0000}bs\u{0000}bp2', '3'],
      ['\u{0000}cs\u{0000}cp', '4'],
    ],
    {
      startSecondaryKey: 'bs',
      startPrimaryKey: 'bp2',
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
      startSecondaryKey: 'bs',
      startPrimaryKey: 'bp2',
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
});
