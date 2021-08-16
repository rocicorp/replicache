import type {Read} from '../dag/read';
import type {Write} from '../dag/write';
import type {JSONValue} from '../json';
import {Map as ProllyMap} from '../prolly/map';
import {RWLock} from '../rw-lock';
import type {IndexRecord} from './commit';
import {stringToUint8Array} from './util';

export class Index {
  readonly meta: IndexRecord;
  private _map: ProllyMap | undefined;
  // TODO(arv): Is this lock necessary?
  private _rwLock = new RWLock();

  constructor(meta: IndexRecord, map: ProllyMap | undefined) {
    this.meta = meta;
    this._map = map;
  }

  getMap(dagRead: Read): Promise<ProllyMap> {
    return this._rwLock.withWrite(async () => {
      if (this._map) {
        return this._map;
      }
      return (this._map = await ProllyMap.load(this.meta.valueHash, dagRead));
    });
  }

  // Note: does not update self.meta.value_hash (doesn't need to at this point as flush
  // is only called during commit.)
  flush(write: Write): Promise<string> {
    return this._rwLock.withWrite(() => {
      if (this._map) {
        return this._map.flush(write);
      }
      return this.meta.valueHash;
    });
  }

  clear(): Promise<void> {
    return this._rwLock.withWrite(() => {
      this._map = ProllyMap.new();
    });
  }
}

// Index or de-index a single primary entry.
export function indexValue(
  index: ProllyMap,
  op: IndexOperation,
  key: Uint8Array,
  val: Uint8Array,
  jsonPointer: string,
): void {
  for (const entry of getIndexKeys(key, val, jsonPointer)) {
    switch (op) {
      case IndexOperation.Add:
        index.put(entry, val);
        break;
      case IndexOperation.Remove:
        index.del(entry);
        break;
    }
  }
}

// Gets the set of index keys for a given primary key and value.
export function getIndexKeys(
  key: Uint8Array,
  val: Uint8Array,
  jsonPointer: string,
): Uint8Array[] {
  // TODO: It's crazy to decode the entire value just to evaluate the json pointer.
  // There should be some way to shortcut this. Halp @arv.
  const value: JSONValue = JSON.parse(new TextDecoder().decode(val));
  const target = evaluateJSONPointer(value, jsonPointer);
  if (target === undefined) {
    throw new Error(`No value at path: ${jsonPointer}`);
  }

  const values = [];
  if (Array.isArray(target)) {
    target.forEach(v => values.push(v));
  } else {
    values.push(target);
  }
  const strings = [];
  for (const value of values) {
    if (typeof value === 'string') {
      strings.push(value);
    } else {
      throw new Error('Unsupported target type');
    }
  }

  return strings.map(v =>
    encodeIndexKey({
      secondary: stringToUint8Array(v),
      primary: key,
    }),
  );
}

// TODO(arv): Share code with subscriptions.ts
export const KEY_VERSION_0 = new Uint8Array([0]);
export const KEY_SEPARATOR = new Uint8Array([0]);

export type IndexKey = {
  secondary: Uint8Array;
  primary: Uint8Array;
};

// An index key is encoded to vec of bytes in the following order:
//   - key version byte(s), followed by
//   - the secondary key bytes (which for now is a UTF8 encoded string), followed by
//   - the key separator, a null byte, followed by
//   - the primary key bytes
//
// The null separator byte ensures that if a secondary key A is longer than B then
// A always sorts after B. Appending the primary key ensures index keys with
// identical secondary keys sort in primary key order. Secondary keys must not
// contain a zero (null) byte.
export function encodeIndexKey(indexKey: IndexKey): Uint8Array {
  const {secondary, primary} = indexKey;

  if (secondary.includes(0)) {
    throw new Error('Secondary key cannot contain null byte');
  }
  const byteLength =
    KEY_VERSION_0.length +
    secondary.length +
    KEY_SEPARATOR.length +
    primary.length +
    1; // One extra to allow efficient converting to index scan key
  const v = new Uint8Array(new ArrayBuffer(byteLength), 0, byteLength - 1);
  let i = 0;
  v.set(KEY_VERSION_0, i);
  i += KEY_VERSION_0.length;
  v.set(secondary, i);
  i += secondary.length;
  v.set(KEY_SEPARATOR, i);
  i += KEY_SEPARATOR.length;
  v.set(primary, i);
  return v;
}

// Returns bytes that can be used to scan for the given secondary index value.
//
// Consider a scan for start_secondary_key="a" (97). We want to scan with scan
// key [0, 97]. We could also scan with [0, 97, 0], but then we couldn't use
// this function for prefix scans, so we lop off the null byte. If we want
// the scan to be exclusive, we scan with the next greater value, [0, 97, 1]
// (we disallow zero bytes in secondary keys).
//
// Now it gets a little tricky. We also want to be able to scan using the
// primary key, start_key. When we do this we have to encode the scan key
// a little differently We essentially have to fix the value of the
// secondary key so we can vary the start_key. That is, the match on
// start_secondary_key becomes an exact match.
//
// Consider the scan for start_secondary_key="a" and start_key=[2]. We want
// to scan with [0, 97, 0, 2]. If we want exclusive we want to scan with
// the next highest value, [0, 97, 0, 2, 0] (zero bytes are allowed in primary
// keys). So far so good. It is important to notice that we need to
// be able to distinguish between not wanting use start_key and wanting to
// use start_key=[]. In the former case we want to scan with the secondary
// key value, possibly followed by a 1 with no trailing zero byte ([0, 97]
// or [0, 97, 1]). In the latter case we want to scan by the secondary
// key value, followed by the zero byte, followed by the primary key value
// and another zero if it is exclusive ([0, 97, 0] or [0, 97, 0, 0]).
// This explains why we need the Option around start_key.
export function encodeIndexScanKey(
  secondary: Uint8Array,
  primary: Uint8Array | undefined,
  exclusive: boolean,
): Uint8Array {
  let k = encodeIndexKey({
    secondary,
    primary: primary || new Uint8Array(0),
  });

  let smallest_legal_value = 0x00;
  if (primary === undefined) {
    k = k.subarray(0, k.length - 1);
    smallest_legal_value = 0x01;
  }
  if (exclusive) {
    k = new Uint8Array(k.buffer, 0, k.length + 1);
    k[k.length - 1] = smallest_legal_value;
  }
  return k;
}

// TODO(arv): Unify with impl in subscriptions.ts

// Decodes an IndexKey encoded by encode_index_key.
export function decodeIndexKey(encodedIndexKey: Uint8Array): IndexKey {
  if (encodedIndexKey[0] !== KEY_VERSION_0[0]) {
    throw new Error('Invalid Version');
  }

  const version_len = KEY_VERSION_0.length;
  const separator_len = KEY_SEPARATOR.length;
  let separator_offset: number | undefined;
  for (let i = version_len; i < encodedIndexKey.length; i++) {
    if (encodedIndexKey[i] === KEY_SEPARATOR[0]) {
      separator_offset = i;
      break;
    }
  }
  if (separator_offset === undefined) {
    throw new Error('Invalid Formatting');
  }

  const secondary = encodedIndexKey.subarray(version_len, separator_offset);
  const primary = encodedIndexKey.subarray(separator_offset + separator_len);
  return {secondary, primary};
}

export function evaluateJSONPointer(
  value: JSONValue,
  pointer: string,
): JSONValue | undefined {
  function parseIndex(s: string): number | undefined {
    if (s.startsWith('+') || (s.startsWith('0') && s.length !== 1)) {
      return undefined;
    }
    return parseInt(s, 10);
  }

  if (pointer === '') {
    return value;
  }
  if (!pointer.startsWith('/')) {
    return undefined;
  }

  const tokens = pointer
    .split('/')
    .slice(1)
    .map(x => x.replace(/~1/g, '/').replace(/~0/g, '~'));

  let target = value;
  for (const token of tokens) {
    let targetOpt;
    if (Array.isArray(target)) {
      const i = parseIndex(token);
      if (i === undefined) {
        return undefined;
      }
      targetOpt = target[i];
    } else if (target === null) {
      return undefined;
    } else if (typeof target === 'object') {
      targetOpt = target[token];
    }
    if (targetOpt === undefined) {
      return undefined;
    }
    target = targetOpt;
  }
  return target;
}

export const enum IndexOperation {
  Add,
  Remove,
}
