/**
 * Index keys consists of a secondary and a primary key. The IndexKey type is
 * used when [[ReadTransaction.scan|scanning]] over indexes.
 */
export type IndexKey = [secondary: string, primary: string];

export const KEY_VERSION_0 = '\x00';
export const KEY_SEPARATOR = '\x00';

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
export function encodeIndexKey(indexKey: IndexKey): string {
  const secondary = indexKey[0];
  const primary = indexKey[1];

  if (secondary.includes('\x00')) {
    throw new Error('Secondary key cannot contain null byte');
  }
  return KEY_VERSION_0 + secondary + KEY_SEPARATOR + primary;
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
  secondary: string,
  primary: string | undefined,
  exclusive: boolean | undefined,
): string {
  let k = encodeIndexKey([secondary, primary ?? '']);

  let smallestLegalValue = '\x00';
  if (primary === undefined) {
    k = k.slice(0, k.length - 1);
    smallestLegalValue = '\x01';
  }
  if (exclusive) {
    k += smallestLegalValue;
  }
  return k;
}

// Decodes an IndexKey encoded by encode_index_key.
export function decodeIndexKey(encodedIndexKey: string): IndexKey {
  if (encodedIndexKey[0] !== KEY_VERSION_0) {
    throw new Error('Invalid version');
  }

  const versionLen = KEY_VERSION_0.length;
  const separatorLen = KEY_SEPARATOR.length;
  const separatorOffset = encodedIndexKey.indexOf(KEY_SEPARATOR, versionLen);
  if (separatorOffset === -1) {
    throw new Error('Invalid formatting');
  }

  const secondary = encodedIndexKey.slice(versionLen, separatorOffset);
  const primary = encodedIndexKey.slice(separatorOffset + separatorLen);
  return [secondary, primary];
}
