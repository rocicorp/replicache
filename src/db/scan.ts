import type {ReadonlyJSONValue} from '../json';
import {
  isScanIndexOptions,
  ScanIndexOptions,
  scanOptionIndexedStartKeyToSecondaryAndPrimary,
  ScanOptions,
} from '../scan-options.js';
import {encodeIndexScanKey} from './index-key.js';

// ScanOptionsInternal is a version of the ScanOptions that has been
// prepared for execution of a scan. We need to carefully set up scan
// keys based on several factors (eg, is it an index scan), so you should
// probably not create this structure directly. It is intended to be
// created via TryFrom a ScanOptions.
//
// You'll note that 'start.exclusive' is missing. That's because
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

export function convertToOptionsInternal(
  source: ScanOptions,
): ScanOptionsInternal {
  // If the scan is using an index then we need to generate the scan keys.

  const {indexName} = source as Partial<ScanIndexOptions>;

  let prefix: string | undefined;
  if (source.prefix !== undefined) {
    if (indexName !== undefined) {
      prefix = encodeIndexScanKey(source.prefix, undefined, false);
    } else {
      ({prefix} = source);
    }
  }

  let startKey: string | undefined;
  if (isScanIndexOptions(source)) {
    const {start} = source;
    if (start) {
      const {key} = start;
      const [startSecondaryKey, startPrimaryKey] =
        scanOptionIndexedStartKeyToSecondaryAndPrimary(key);
      startKey = encodeIndexScanKey(
        startSecondaryKey ?? '',
        startPrimaryKey,
        start.exclusive,
      );
    }
  } else {
    const {start} = source;
    if (start) {
      startKey = start.key;
      if (start.exclusive) {
        startKey += '\u0000';
      }
    }
  }
  return {
    prefix,
    startKey,
    limit: source.limit,
    indexName,
  };
}
