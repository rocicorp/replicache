import type {Map as ProllyMap} from '../prolly/map';
import type {Entry} from '../prolly/mod';

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
  prefix?: Uint8Array;
  startKey?: Uint8Array;
  limit?: number;
  indexName?: string;
};

const enum ScanResultType {
  Error,
  Item,
}

export type ScanItem = {
  key: Uint8Array;
  secondaryKey: Uint8Array;
  val: Uint8Array;
};

export type ScanResult =
  | {type: ScanResultType.Error; error: unknown}
  | {type: ScanResultType.Item; item: ScanItem};

export function scan(
  map: ProllyMap,
  opts: ScanOptionsInternal,
): IterableIterator<ScanResult> {
  throw new Error('Not implemented');
}

export function convert(opts: ScanOptions): ScanOptionsInternal {
  throw new Error('Not implemented');
}

export function scanRaw(
  map: ProllyMap,
  opts: ScanOptionsInternal,
): IterableIterator<Entry> {
  throw new Error('Not implemented');
}
