import {expect} from '@esm-bundle/chai';
import type {JSONValue} from '../json.js';
import {b} from '../kv/store-test-util.js';
import {arrayCompare} from '../prolly/array-compare.js';
import {Map as ProllyMap} from '../prolly/map.js';
import {
  decodeIndexKey,
  encodeIndexKey,
  encodeIndexScanKey,
  evaluateJSONPointer,
  getIndexKeys,
  IndexKey,
  IndexOperation,
  indexValue,
  KEY_SEPARATOR,
  KEY_VERSION_0,
} from './index.js';
import {startsWith} from './starts-with.js';
import {stringToUint8Array} from './util.js';

test('test index key', () => {
  const testValid = (secondary: string, primary: Uint8Array) => {
    // Ensure the encoded value is what we expect.
    const encoded = encodeIndexKey({
      secondary: stringToUint8Array(secondary),
      primary,
    });
    expect(KEY_VERSION_0).to.deep.equal(
      encoded.subarray(0, KEY_VERSION_0.length),
    );
    const secondaryIndex = KEY_VERSION_0.length;
    const separatorIndex = secondaryIndex + secondary.length;
    expect(encoded.subarray(secondaryIndex, separatorIndex)).to.deep.equal(
      stringToUint8Array(secondary),
    );
    const primaryIndex = separatorIndex + KEY_SEPARATOR.length;
    expect(encoded.subarray(separatorIndex, primaryIndex)).to.deep.equal(
      KEY_SEPARATOR,
    );
    expect(encoded.subarray(primaryIndex)).to.deep.equal(primary);

    // Ensure we can decode it properly.
    const decoded = decodeIndexKey(encoded);
    expect(decoded.secondary).to.deep.equal(stringToUint8Array(secondary));
    expect(decoded.primary).to.deep.equal(primary);
  };

  testValid('', new Uint8Array([]));
  testValid('', new Uint8Array([0x00]));
  testValid('', new Uint8Array([0x01]));
  testValid('a', new Uint8Array([]));
  testValid('a', new Uint8Array([0x61 /* 'a' */]));
  testValid('foo', new Uint8Array([0x01, 0x02, 0x03]));

  const testInvalidEncode = (
    secondary: string,
    primary: Uint8Array,
    expected: string,
  ) => {
    expect(() =>
      encodeIndexKey({
        secondary: stringToUint8Array(secondary),
        primary,
      }),
    ).to.throw(Error, expected);
  };
  testInvalidEncode(
    'no \0 nulls',
    new Uint8Array([]),
    'Secondary key cannot contain null byte',
  );

  const testInvalidDecode = (encoded: Uint8Array, expected: string) => {
    expect(() => decodeIndexKey(encoded)).to.throw(Error, expected);
  };
  testInvalidDecode(new Uint8Array([]), 'Invalid Version');
  testInvalidDecode(new Uint8Array([0x01]), 'Invalid Version');
  testInvalidDecode(new Uint8Array([0x00]), 'Invalid Formatting');
  testInvalidDecode(new Uint8Array([0x00, 0x01, 0x02]), 'Invalid Formatting');
});

test('encode scan key', () => {
  const t = (secondary: string, primary: Uint8Array) => {
    const encodedIndexKey = encodeIndexKey({
      secondary: stringToUint8Array(secondary),
      primary,
    });
    // With exclusive == false
    let scanKey = encodeIndexScanKey(
      stringToUint8Array(secondary),
      primary,
      false,
    );

    expect(startsWith(encodedIndexKey, scanKey)).to.be.true;

    expect(arrayCompare(encodedIndexKey, scanKey)).to.greaterThanOrEqual(0);

    // With exclusive == true
    scanKey = encodeIndexScanKey(stringToUint8Array(secondary), primary, true);
    expect(arrayCompare(encodedIndexKey, scanKey)).to.equal(-1);
  };

  t('', new Uint8Array([]));
  t('', new Uint8Array([0x00]));
  t('', new Uint8Array([0x01]));
  t('foo', new Uint8Array([]));
  t('foo', new Uint8Array([0x00]));
  t('foo', new Uint8Array([0x01]));
});

test('index key sort', () => {
  const t = (left: [string, Uint8Array], right: [string, Uint8Array]) => {
    const a = encodeIndexKey({
      secondary: stringToUint8Array(left[0]),
      primary: left[1],
    });
    const b = encodeIndexKey({
      secondary: stringToUint8Array(right[0]),
      primary: right[1],
    });
    expect(arrayCompare(a, b)).to.equal(-1);
  };

  t(['', new Uint8Array([])], ['', new Uint8Array([0x00])]);
  t(['', new Uint8Array([0x00])], ['a', new Uint8Array([])]);
  t(['a', new Uint8Array([0x00])], ['aa', new Uint8Array([])]);
  t(['A', new Uint8Array([])], ['a', new Uint8Array([])]);
  t(['foo', new Uint8Array([])], ['foobar', new Uint8Array([])]);
  t(['😀', new Uint8Array([])], ['😜', new Uint8Array([])]);
  t(['a', new Uint8Array([0xff])], ['aa', new Uint8Array([0x00])]);
});

// By design the index key is encoded in a way that doesn't permit collisions,
// eg a situation where scan({indexName: "...", ...prefix="foo"}) matches a
// value with secondary index "f" and primary index "oo". This test gives us a
// tiny extra assurance that this is the case.
test('index key uniqueness', () => {
  const t = (left: [string, Uint8Array], right: [string, Uint8Array]) => {
    const a = encodeIndexKey({
      secondary: stringToUint8Array(left[0]),
      primary: left[1],
    });
    const b = encodeIndexKey({
      secondary: stringToUint8Array(right[0]),
      primary: right[1],
    });
    expect(arrayCompare(a, b)).to.not.equal(0);
  };

  t(['', new Uint8Array([0x61])], ['a', new Uint8Array([])]);
});

function jsonU8(v: JSONValue): Uint8Array {
  return stringToUint8Array(JSON.stringify(v));
}

test('get index keys', () => {
  const t = (
    key: string,
    input: Uint8Array,
    jsonPointer: string,
    expected: IndexKey[] | string | RegExp,
  ) => {
    if (Array.isArray(expected)) {
      const keys = getIndexKeys(stringToUint8Array(key), input, jsonPointer);
      expect(keys).to.deep.equal(expected.map(k => encodeIndexKey(k)));
    } else {
      expect(() =>
        getIndexKeys(stringToUint8Array(key), input, jsonPointer),
      ).to.throw(expected);
    }
  };

  // invalid json
  t('k', new Uint8Array([]), '/', /unexpected (end of)|(EOF)/i);

  // no matching target
  t('k', stringToUint8Array('{}'), '/foo', 'No value at path: /foo');

  // unsupported target types
  t('k', jsonU8({unsupported: {}}), '/unsupported', 'Unsupported target type');
  t(
    'k',
    jsonU8({unsupported: null}),
    '/unsupported',
    'Unsupported target type',
  );
  t(
    'k',
    jsonU8({unsupported: true}),
    '/unsupported',
    'Unsupported target type',
  );
  t('k', jsonU8({unsupported: 42}), '/unsupported', 'Unsupported target type');
  t(
    'k',
    jsonU8({unsupported: 88.8}),
    '/unsupported',
    'Unsupported target type',
  );
  t('k', jsonU8('no \0 allowed'), '', 'Secondary key cannot contain null byte');

  // success
  // array of string
  t('k', jsonU8({foo: []}), '/foo', []);
  t('k', jsonU8({foo: ['bar', '', 'baz']}), '/foo', [
    {
      secondary: b`bar`,
      primary: b`k`,
    },
    {
      secondary: b``,
      primary: b`k`,
    },
    {
      secondary: b`baz`,
      primary: b`k`,
    },
  ]);

  // string
  t('foo', jsonU8({foo: 'bar'}), '/foo', [
    {
      secondary: b`bar`,
      primary: b`foo`,
    },
  ]);
  t('foo', jsonU8({foo: {bar: ['hot', 'dog']}}), '/foo/bar/1', [
    {
      secondary: b`dog`,
      primary: b`foo`,
    },
  ]);
  t('', jsonU8({foo: 'bar'}), '/foo', [
    {
      secondary: b`bar`,
      primary: b``,
    },
  ]);
  t('/! ', jsonU8({foo: 'bar'}), '/foo', [
    {
      secondary: b`bar`,
      primary: b`/! `,
    },
  ]);
});

test('json pointer', () => {
  for (const v of [null, 42, true, false, [], {}, 'foo']) {
    expect(evaluateJSONPointer(v, '')).to.equal(v);
    expect(evaluateJSONPointer(null, 'x')).to.equal(undefined);
    expect(evaluateJSONPointer(v, '/')).to.equal(undefined);
    expect(evaluateJSONPointer(v, '/a')).to.equal(undefined);
  }

  expect(evaluateJSONPointer({a: 1}, '/a')).to.equal(1);
  expect(evaluateJSONPointer({a: {b: 2}}, '/a')).to.deep.equal({b: 2});
  expect(evaluateJSONPointer({a: {b: 3}}, '/a/b')).to.equal(3);
  expect(evaluateJSONPointer({a: {b: 4}}, '/a/')).to.equal(undefined);

  expect(evaluateJSONPointer('hi', '/length')).to.equal(undefined);

  expect(evaluateJSONPointer(['a', 'b'], '/0')).to.equal('a');
  expect(evaluateJSONPointer(['a', 'b'], '/1')).to.equal('b');
  expect(evaluateJSONPointer(['a', 'b'], '/00')).to.equal(undefined);
  expect(evaluateJSONPointer(['a', 'b'], '/01')).to.equal(undefined);
  expect(evaluateJSONPointer(['a', 'b'], '/2')).to.equal(undefined);
});

test('index value', () => {
  const t = (
    key: string,
    value: Uint8Array,
    jsonPointer: string,
    op: IndexOperation,
    expected: number[] | string,
  ) => {
    const index = ProllyMap.new();
    index.put(
      encodeIndexKey({
        secondary: b`s1`,
        primary: b`1`,
      }),
      b`v1`,
    );
    index.put(
      encodeIndexKey({
        secondary: b`s2`,
        primary: b`2`,
      }),
      b`v2`,
    );

    if (Array.isArray(expected)) {
      indexValue(index, op, stringToUint8Array(key), value, jsonPointer);

      const actual_val = [...index];
      expect(expected.length).to.equal(actual_val.length);
      for (let i = 0; i < expected.length; i++) {
        const expEntry = encodeIndexKey({
          secondary: stringToUint8Array(`s${expected[i]}`),
          primary: stringToUint8Array(`${expected[i]}`),
        });
        expect(expEntry).to.deep.equal(actual_val[i].key);
        expect(index.get(expEntry)).to.deep.equal(actual_val[i].val);
      }
    } else {
      expect(() =>
        indexValue(index, op, stringToUint8Array(key), value, jsonPointer),
      ).to.throw(expected);
    }
  };

  t('3', jsonU8({s: 's3', v: 'v3'}), '/s', IndexOperation.Add, [1, 2, 3]);
  t('1', jsonU8({s: 's1', v: 'v1'}), '/s', IndexOperation.Remove, [2]);
});
