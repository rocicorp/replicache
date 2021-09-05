import type * as prolly from '../prolly/mod';
import type {Entry} from '../prolly/mod';
import {PeekIterator} from '../prolly/peek-iterator';
import {take, takeWhile} from './iter-util';
import {decodeIndexKey, encodeIndexScanKey} from '.';
import type {ReadonlyJSONValue} from '../json';

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
  key: string;
  secondaryKey: string;
  val: ReadonlyJSONValue;
};

export const enum ScanResultType {
  Error,
  Item,
}

export type ScanResult =
  | {type: ScanResultType.Error; error: unknown}
  | {type: ScanResultType.Item; item: ScanItem};

export function* scan(
  map: prolly.Map,
  opts: ScanOptionsInternal,
): IterableIterator<ScanResult> {
  // We don't do any encoding of the key in regular prolly maps, so we have no
  // way of determining from an entry.key alone whether it is a regular prolly
  // map key or an encoded IndexKey in an index map. Without encoding regular
  // prolly map keys we need to rely on the opts to tell us what we expect.

  const indexScan = opts.indexName !== undefined;

  for (const entry of scanRaw(map, opts)) {
    if (indexScan) {
      try {
        const decoded = decodeIndexKey(entry[0]);
        const secondary = decoded[0];
        const primary = decoded[1];
        yield {
          type: ScanResultType.Item,
          item: {
            key: primary,
            secondaryKey: secondary,
            val: entry[1],
          },
        };
      } catch (e) {
        yield {type: ScanResultType.Error, error: e};
      }
    } else {
      yield {
        type: ScanResultType.Item,
        item: {
          key: entry[0],
          secondaryKey: '',
          val: entry[1],
        },
      };
    }
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

export function scanRaw(
  map: prolly.Map,
  opts: ScanOptionsInternal,
): IterableIterator<Entry> {
  const it = new PeekIterator(map.entries());
  const prefix = opts.prefix !== undefined ? opts.prefix : '';
  let fromKey = prefix;

  const {startKey} = opts;
  if (startKey !== undefined) {
    if (startKey > fromKey) {
      fromKey = startKey;
    }
  }

  while (!it.peek().done) {
    // Note: exclusive implemented at a higher level by appending a 0x01 to the
    // key before passing it to scan.
    const key = it.peek().value[0];
    if (key >= fromKey) {
      break;
    }

    it.next();
  }

  return take(
    opts.limit ?? Infinity,
    takeWhile(item => item[0].startsWith(prefix), it),
  );
}
