import {expect} from '@esm-bundle/chai';
import type {JSONValue} from '../json';
import {b} from '../test-util';
import {arrayCompare} from '../prolly/array-compare';
import * as prolly from '../prolly/mod';
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
} from './index';
import * as utf8 from '../utf8';
import {stringCompare} from '../prolly/string-compare';

test('test index key', () => {
  const testValid = (secondary: string, primary: string) => {
    // Ensure the encoded value is what we expect.
    const encoded = encodeIndexKey({
      secondary,
      primary,
    });
    expect(KEY_VERSION_0).to.equal(encoded.slice(0, KEY_VERSION_0.length));
    const secondaryIndex = KEY_VERSION_0.length;
    const separatorIndex = secondaryIndex + secondary.length;
    expect(encoded.slice(secondaryIndex, separatorIndex)).to.equal(secondary);
    const primaryIndex = separatorIndex + KEY_SEPARATOR.length;
    expect(encoded.slice(separatorIndex, primaryIndex)).to.equal(KEY_SEPARATOR);
    expect(encoded.slice(primaryIndex)).to.equal(primary);

    // Ensure we can decode it properly.
    const decoded = decodeIndexKey(encoded);
    expect(decoded.secondary).to.equal(secondary);
    expect(decoded.primary).to.equal(primary);
  };

  testValid('', '');
  testValid('', '\u0000');
  testValid('', '\u0001');
  testValid('a', '');
  testValid('a', 'a');
  testValid('foo', '\u0001\u0002\u0003');

  const testInvalidEncode = (
    secondary: string,
    primary: string,
    expected: string,
  ) => {
    expect(() =>
      encodeIndexKey({
        secondary,
        primary,
      }),
    ).to.throw(Error, expected);
  };
  testInvalidEncode(
    'no \0 nulls',
    '',
    'Secondary key cannot contain null byte',
  );

  const testInvalidDecode = (encoded: string, expected: string) => {
    expect(() => decodeIndexKey(encoded)).to.throw(Error, expected);
  };
  testInvalidDecode('', 'Invalid Version');
  testInvalidDecode('\u0001', 'Invalid Version');
  testInvalidDecode('\u0000', 'Invalid Formatting');
  testInvalidDecode('\u0000\u0001\u0002', 'Invalid Formatting');
});

test('encode scan key', () => {
  const t = (secondary: string, primary: string) => {
    const encodedIndexKey = encodeIndexKey({
      secondary,
      primary,
    });
    // With exclusive == false
    let scanKey = encodeIndexScanKey(secondary, primary, false);

    expect(scanKey.startsWith(encodedIndexKey)).to.be.true;

    expect(arrayCompare(encodedIndexKey, scanKey)).to.greaterThanOrEqual(0);

    // With exclusive == true
    scanKey = encodeIndexScanKey(secondary, primary, true);
    expect(arrayCompare(encodedIndexKey, scanKey)).to.equal(-1);
  };

  t('', '');
  t('', '\u0000');
  t('', '\u0001');
  t('foo', '');
  t('foo', '\u0000');
  t('foo', '\u0001');
});

test('index key sort', () => {
  const t = (left: [string, string], right: [string, string]) => {
    const a = encodeIndexKey({
      secondary: left[0],
      primary: left[1],
    });
    const b = encodeIndexKey({
      secondary: right[0],
      primary: right[1],
    });
    expect(arrayCompare(a, b)).to.equal(-1);
  };

  t(['', ''], ['', '\u0000']);
  t(['', '\u0000'], ['a', '']);
  t(['a', '\u0000'], ['aa', '']);
  t(['A', ''], ['a', '']);
  t(['foo', ''], ['foobar', '']);
  t(['😀', ''], ['😜', '']);
  t(['a', '\u00ff'], ['aa', '\u0000']);
});

// By design the index key is encoded in a way that doesn't permit collisions,
// eg a situation where scan({indexName: "...", ...prefix="foo"}) matches a
// value with secondary index "f" and primary index "oo". This test gives us a
// tiny extra assurance that this is the case.
test('index key uniqueness', () => {
  const t = (left: [string, string], right: [string, string]) => {
    const a = encodeIndexKey({
      secondary: left[0],
      primary: left[1],
    });
    const b = encodeIndexKey({
      secondary: right[0],
      primary: right[1],
    });
    expect(stringCompare(a, b)).to.not.equal(0);
  };

  t(['', '\u0061'], ['a', '']);
});

function jsonU8(v: JSONValue): Uint8Array {
  return utf8.encode(JSON.stringify(v));
}

test('get index keys', () => {
  const t = (
    key: string,
    input: Uint8Array,
    jsonPointer: string,
    expected: IndexKey[] | string | RegExp,
  ) => {
    if (Array.isArray(expected)) {
      const keys = getIndexKeys(key, input, jsonPointer);
      expect(keys).to.deep.equal(expected.map(k => encodeIndexKey(k)));
    } else {
      expect(() => getIndexKeys(key, input, jsonPointer)).to.throw(expected);
    }
  };

  // invalid json
  t('k', new Uint8Array([]), '/', /unexpected (end of)|(EOF)/i);

  // no matching target
  t('k', b`{}`, '/foo', 'No value at path: /foo');

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
      secondary: `bar`,
      primary: `k`,
    },
    {
      secondary: ``,
      primary: `k`,
    },
    {
      secondary: `baz`,
      primary: `k`,
    },
  ]);

  // string
  t('foo', jsonU8({foo: 'bar'}), '/foo', [
    {
      secondary: `bar`,
      primary: `foo`,
    },
  ]);
  t('foo', jsonU8({foo: {bar: ['hot', 'dog']}}), '/foo/bar/1', [
    {
      secondary: `dog`,
      primary: `foo`,
    },
  ]);
  t('', jsonU8({foo: 'bar'}), '/foo', [
    {
      secondary: `bar`,
      primary: ``,
    },
  ]);
  t('/! ', jsonU8({foo: 'bar'}), '/foo', [
    {
      secondary: `bar`,
      primary: `/! `,
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
    const index = prolly.Map.new();
    index.put(
      encodeIndexKey({
        secondary: `s1`,
        primary: `1`,
      }),
      b`v1`,
    );
    index.put(
      encodeIndexKey({
        secondary: `s2`,
        primary: `2`,
      }),
      b`v2`,
    );

    if (Array.isArray(expected)) {
      indexValue(index, op, key, value, jsonPointer);

      const actual_val = [...index];
      expect(expected.length).to.equal(actual_val.length);
      for (let i = 0; i < expected.length; i++) {
        const expEntry = encodeIndexKey({
          secondary: `s${expected[i]}`,
          primary: `${expected[i]}`,
        });
        expect(expEntry).to.deep.equal(actual_val[i].key);
        expect(index.get(expEntry)).to.deep.equal(actual_val[i].val);
      }
    } else {
      expect(() => indexValue(index, op, key, value, jsonPointer)).to.throw(
        expected,
      );
    }
  };

  t('3', jsonU8({s: 's3', v: 'v3'}), '/s', IndexOperation.Add, [1, 2, 3]);
  t('1', jsonU8({s: 's1', v: 'v1'}), '/s', IndexOperation.Remove, [2]);
});
