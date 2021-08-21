import {expect} from '@esm-bundle/chai';
import {convert, scan, ScanItem, ScanOptions, ScanResultType} from './scan';
import * as prolly from '../prolly/mod.js';
import {b, stringToUint8Array} from '../test-util';
import {encodeIndexKey} from './index';

test('scan', () => {
  const t = (opts: ScanOptions, expected: string[]) => {
    const testDesc = `opts: ${JSON.stringify(
      opts,
      null,
      2,
    )}, expected: ${expected}`;

    const map = prolly.Map.new();
    map.put(b`foo`, b`foo`);
    map.put(b`bar`, b`bar`);
    map.put(b`baz`, b`baz`);
    const optsInternal = convert(opts);
    const actual = [];
    for (const sr of scan(map, optsInternal)) {
      if (sr.type === ScanResultType.Error) {
        throw sr.error;
      }
      actual.push(sr.item.key);
    }
    const expected2 = expected.map(stringToUint8Array);
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
      map.put(stringToUint8Array(key), b`value`);
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
      got.push(new TextDecoder().decode(sr.item.key));
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
    entries: [string, Uint8Array][],
    startSecondaryKey: string,
    startKey: string | undefined,
    expected: [string, Uint8Array][],
  ) => {
    const test_desc = `entries: ${entries}, startSecondaryKey ${startSecondaryKey}, startKey: ${startKey}, expected: ${expected}`;

    const map = prolly.Map.new();
    for (const entry of entries) {
      const encoded = encodeIndexKey({
        secondary: stringToUint8Array(entry[0]),
        primary: entry[1],
      });
      map.put(encoded, b`value`);
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
      got.push([new TextDecoder().decode(sr.item.secondaryKey), sr.item.key]);
    }
    expect(got).to.deep.equal(expected, test_desc);
  };

  // Test exclusive scanning with startSecondaryKey.
  const v: Uint8Array[] = [
    new Uint8Array([]),
    new Uint8Array([0]),
    new Uint8Array([1]),
    new Uint8Array([1, 2]),
  ];
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
      ['a', new Uint8Array([])],
      ['a', new Uint8Array([0])],
      ['a', new Uint8Array([0, 0])],
      ['a', new Uint8Array([0, 1])],
      ['a', new Uint8Array([1])],
    ],
    'a',
    '',
    [
      ['a', new Uint8Array([0])],
      ['a', new Uint8Array([0, 0])],
      ['a', new Uint8Array([0, 1])],
      ['a', new Uint8Array([1])],
    ],
  );
  t(
    [
      ['a', new Uint8Array([])],
      ['a', new Uint8Array([0])],
      ['a', new Uint8Array([0, 0])],
      ['a', new Uint8Array([0, 1])],
      ['a', new Uint8Array([1])],
    ],
    'a',
    '\u{0000}',
    [
      ['a', new Uint8Array([0, 0])],
      ['a', new Uint8Array([0, 1])],
      ['a', new Uint8Array([1])],
    ],
  );
  t(
    [
      ['a', new Uint8Array([])],
      ['a', new Uint8Array([0])],
      ['a', new Uint8Array([0, 0])],
      ['a', new Uint8Array([0, 1])],
      ['a', new Uint8Array([1])],
    ],
    'a',
    '\u{0000}\u{0000}',
    [
      ['a', new Uint8Array([0, 1])],
      ['a', new Uint8Array([1])],
    ],
  );
  t(
    [
      ['a', new Uint8Array([])],
      ['a', new Uint8Array([0])],
      ['a', new Uint8Array([0, 0])],
      ['a', new Uint8Array([0, 1])],
      ['a', new Uint8Array([1])],
    ],
    'a',
    '\u{0000}\u{0001}',
    [['a', new Uint8Array([1])]],
  );

  // t exclusive scanning with startSecondaryKey and startKey,
  // with different secondary values.
  t(
    [
      ['', new Uint8Array([])],
      ['a', new Uint8Array([0])],
      ['aa', new Uint8Array([0, 0])],
      ['ab', new Uint8Array([0, 1])],
      ['b', new Uint8Array([1])],
    ],
    '',
    '',
    [
      ['a', new Uint8Array([0])],
      ['aa', new Uint8Array([0, 0])],
      ['ab', new Uint8Array([0, 1])],
      ['b', new Uint8Array([1])],
    ],
  );
  t(
    [
      ['', new Uint8Array([])],
      ['a', new Uint8Array([0])],
      ['aa', new Uint8Array([0, 0])],
      ['ab', new Uint8Array([0, 1])],
      ['b', new Uint8Array([1])],
    ],
    'a',
    '\u{0000}',
    [
      ['aa', new Uint8Array([0, 0])],
      ['ab', new Uint8Array([0, 1])],
      ['b', new Uint8Array([1])],
    ],
  );
  t(
    [
      ['', new Uint8Array([])],
      ['a', new Uint8Array([0])],
      ['aa', new Uint8Array([0, 0])],
      ['ab', new Uint8Array([0, 1])],
      ['b', new Uint8Array([1])],
    ],
    'aa',
    '\u{0000}\u{0000}',
    [
      ['ab', new Uint8Array([0, 1])],
      ['b', new Uint8Array([1])],
    ],
  );
  t(
    [
      ['', new Uint8Array([])],
      ['a', new Uint8Array([0])],
      ['aa', new Uint8Array([0, 0])],
      ['ab', new Uint8Array([0, 1])],
      ['b', new Uint8Array([1])],
    ],
    'ab',
    '\u{0000}\u{0001}',
    [['b', new Uint8Array([1])]],
  );
});

function makeProllyMap(entries: Iterable<[string, string]>): prolly.Map {
  const map = prolly.Map.new();
  for (const [k, v] of entries) {
    map.put(stringToUint8Array(k), stringToUint8Array(v));
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
        key: b`b`,
        secondaryKey: b``,
        val: b`2`,
      },
      {
        key: b`c`,
        secondaryKey: b``,
        val: b`3`,
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
        key: b`c`,
        secondaryKey: b``,
        val: b`3`,
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
        key: b`bp`,
        secondaryKey: b`bs`,
        val: b`2`,
      },
      {
        key: b`cp`,
        secondaryKey: b`cs`,
        val: b`3`,
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
        key: b`cp`,
        secondaryKey: b`cs`,
        val: b`3`,
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
        key: b`bp2`,
        secondaryKey: b`bs`,
        val: b`3`,
      },
      {
        key: b`cp`,
        secondaryKey: b`cs`,
        val: b`4`,
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
        key: b`cp`,
        secondaryKey: b`cs`,
        val: b`4`,
      },
    ],
  );
});
