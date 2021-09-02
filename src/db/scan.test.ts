import {expect} from '@esm-bundle/chai';
import {convert, scan, ScanItem, ScanOptions, ScanResultType} from './scan';
import * as prolly from '../prolly/mod';
import {encodeIndexKey} from './index';

test('scan', () => {
  const t = (opts: ScanOptions, expected: string[]) => {
    const testDesc = `opts: ${JSON.stringify(
      opts,
      null,
      2,
    )}, expected: ${expected}`;

    const map = prolly.Map.new();
    map.put('foo', 'foo');
    map.put('bar', 'bar');
    map.put('baz', 'baz');
    const optsInternal = convert(opts);
    const actual = [];
    for (const sr of scan(map, optsInternal)) {
      if (sr.type === ScanResultType.Error) {
        throw sr.error;
      }
      actual.push(sr.item.key);
    }
    const expected2 = expected;
    expect(actual).to.deep.equal(expected2, testDesc);
  };

  // Empty
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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

test('exclusive regular map', () => {
  const t = (keys: string[], startKey: string, expected: string[]) => {
    const testDesc = `keys: ${keys}, startKey: ${startKey}, expected: ${expected}`;
    const map = prolly.Map.new();
    for (const key of keys) {
      map.put(key, 'value');
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

    for (const sr of scan(map, convertedOpts)) {
      if (sr.type === ScanResultType.Error) {
        throw sr.error;
      }
      got.push(sr.item.key);
    }
    expect(got).to.deep.equal(expected, testDesc);
  };

  t(['', 'a', 'aa', 'ab', 'b'], '', ['a', 'aa', 'ab', 'b']);
  t(['', 'a', 'aa', 'ab', 'b'], 'a', ['aa', 'ab', 'b']);
  t(['', 'a', 'aa', 'ab', 'b'], 'aa', ['ab', 'b']);
  t(['', 'a', 'aa', 'ab', 'b'], 'ab', ['b']);
});

test('exclusive index map', () => {
  const t = (
    entries: [string, string][],
    startSecondaryKey: string,
    startKey: string | undefined,
    expected: [string, string][],
  ) => {
    const test_desc = `entries: ${entries}, startSecondaryKey ${startSecondaryKey}, startKey: ${startKey}, expected: ${expected}`;

    const map = prolly.Map.new();
    for (const entry of entries) {
      const encoded = encodeIndexKey(entry);
      map.put(encoded, 'value');
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
    for (const sr of scan(map, convert(opts))) {
      if (sr.type === ScanResultType.Error) {
        throw sr.error;
      }
      got.push([sr.item.secondaryKey, sr.item.key]);
    }
    expect(got).to.deep.equal(expected, test_desc);
  };

  // Test exclusive scanning with startSecondaryKey.
  const v: string[] = ['', '\u0000', '\u0001', '\u0001\u0002'];
  for (const pk of v) {
    t(
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
    t(
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
    t(
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
    t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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
  t(
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

function makeProllyMap(entries: Iterable<[string, string]>): prolly.Map {
  const map = prolly.Map.new();
  for (const [k, v] of entries) {
    map.put(k, v);
  }
  return map;
}

test('scan index startKey', () => {
  const t = (
    entries: Iterable<[string, string]>,
    opts: ScanOptions,
    expected: ScanItem[],
  ) => {
    const map = makeProllyMap(entries);
    const testDesc = `opts: ${opts}, expected: ${expected}`;

    const actual: ScanItem[] = [];
    for (const sr of scan(map, convert(opts))) {
      if (sr.type === ScanResultType.Error) {
        throw sr.error;
      }
      actual.push(sr.item);
    }

    expect(actual).to.deep.equal(expected, testDesc);
  };

  t(
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
        key: 'b',
        secondaryKey: '',
        val: '2',
      },
      {
        key: 'c',
        secondaryKey: '',
        val: '3',
      },
    ],
  );

  t(
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
        key: 'c',
        secondaryKey: '',
        val: '3',
      },
    ],
  );

  t(
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
        key: 'bp',
        secondaryKey: 'bs',
        val: '2',
      },
      {
        key: 'cp',
        secondaryKey: 'cs',
        val: '3',
      },
    ],
  );

  t(
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
        key: 'cp',
        secondaryKey: 'cs',
        val: '3',
      },
    ],
  );

  t(
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
        key: 'bp2',
        secondaryKey: 'bs',
        val: '3',
      },
      {
        key: 'cp',
        secondaryKey: 'cs',
        val: '4',
      },
    ],
  );

  t(
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
        key: 'cp',
        secondaryKey: 'cs',
        val: '4',
      },
    ],
  );
});
