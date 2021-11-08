import {encodeIndexScanKey} from '.';
import type {ReadonlyJSONValue} from '../json';
import type {BTreeRead, Entry} from '../btree/mod';

// TODO(arv): Unify with src/scan-options.ts

// How to use ScanOptions. This could be simpler if we added more structure, eg
// separate scan types for regular vs index scans, but opting instead for
// simpler structure at the cost of making it slightly harder to hold.
//
// For *all* scans:
// - limit: only return at most this many matches
//
// For *regular* scans:
// - prefix: (primary) key prefix to scan, "" matches all of them
// - start_key: start returning (primary key) matches from this value, inclusive
//   unless:
// - start_exclusive: start returning matches *after* the start_key
// - start_key can be used for pagination
//
// For *index* scans:
// - index_name: name of the index to use
// - prefix: *secondary* key prefix to scan for, "" matches all of them
// - start_secondary_key: start returning *secondary* key matches from this
//   value, AND:
// - start_key: if provided start matching on EXACTLY the start_secondary_key
//   and return *primary* key matches starting from this value (empty string
//   means all of them).
// - start_exclusive: start returning matches *after* the (start_secondary_key,
//   start_key) entry; exclusive covers both
// - start_secondary_key and start_key can be used for pagination
//
// NOTE that in above for index scans if you provide Some start_key, the
// secondary_index_key is treated as an exact match.
export type ScanOptions = {
  prefix?: string;
  startSecondaryKey?: string;
  startKey?: string;
  startExclusive?: boolean;
  limit?: number;
  indexName?: string;
};

// ScanOptionsInternal is a version of the ScanOptions that has been
// prepared for execution of a scan. We need to carefully set up scan
// keys based on several factors (eg, is it an index scan), so you should
// probably not create this structure directly. It is intended to be
// created via TryFrom a ScanOptions.
//
// You'll note that 'start_exclusive' is missing. That's because
// of the above-mentioned scan prep; exclusive is implemented by scanning
// for the next value after the one provided.
export type ScanOptionsInternal = {
  prefix?: string;
  startKey?: string;
  limit?: number;
  indexName?: string;
};

export type ScanItem = {
  primaryKey: string;
  secondaryKey: string;
  val: ReadonlyJSONValue;
};

export async function* scan<R>(
  map: BTreeRead,
  opts: ScanOptionsInternal,
  convertEntry: (entry: Entry<ReadonlyJSONValue>) => R,
  onLimitKey?: (key: string) => void,
): AsyncIterableIterator<R> {
  // We don't do any encoding of the key in regular prolly maps, so we have no
  // way of determining from an entry.key alone whether it is a regular prolly
  // map key or an encoded IndexKey in an index map. Without encoding regular
  // prolly map keys we need to rely on the opts to tell us what we expect.

  for await (const entry of map.scan(opts, onKey)) {
    yield convertEntry(entry);
  }
}

export function convert(source: ScanOptions): ScanOptionsInternal {
  // If the scan is using an index then we need to generate the scan keys.
  let prefix: string | undefined;
  if (source.prefix !== undefined) {
    if (source.indexName !== undefined) {
      prefix = encodeIndexScanKey(source.prefix, undefined, false);
    } else {
      prefix = source.prefix;
    }
  }

  let startKey: string | undefined;
  if (source.indexName !== undefined) {
    startKey = encodeIndexScanKey(
      source.startSecondaryKey ?? '',
      source.startKey === undefined ? undefined : source.startKey,
      source.startExclusive ?? false,
    );
  } else {
    let sk = source.startKey ?? '';
    if (source.startExclusive ?? false) {
      sk += '\u0000';
    }
    startKey = sk;
  }
  return {
    prefix,
    startKey,
    limit: source.limit,
    indexName: source.indexName,
  };
}
