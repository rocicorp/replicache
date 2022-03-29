import type * as db from './db/mod';
import type {ReadonlyJSONValue} from './json.js';
import {AsyncIterableIteratorToArrayWrapper} from './async-iterable-iterator-to-array-wrapper';
import type {ScanResult} from './scan-result.js';
import {ScanOptions, toDbScanOptions} from './scan-options.js';
import {convert} from './db/scan.js';
import {decodeIndexKey} from './db/index-key.js';

/**
 * ScanReader is a low level interface that is used to iterate over scan results.
 */
export interface ScanReader {
  /**
   * Moves the reader to the key starting at `key`.
   */
  seek(key: string): Promise<void>;

  /**
   * Returns the next entry in the reader. This should return `undefined` when
   * the reader is at the end and there are no more entries to return.
   */
  next(): Promise<readonly [key: string, value: ReadonlyJSONValue] | undefined>;
}

export class ScanResultImpl<K, V extends ReadonlyJSONValue = ReadonlyJSONValue>
  implements ScanResult<K, V>
{
  private readonly _reader: ScanReader;
  private readonly _options: db.ScanOptions;
  private readonly _onLimitKey: (inclusiveLimitKey: string) => void;

  constructor(
    reader: ScanReader,
    options: ScanOptions,
    onLimitKey: (inclusiveLimitKey: string) => void,
  ) {
    this._reader = reader;
    this._options = toDbScanOptions(options);
    this._onLimitKey = onLimitKey;
  }

  [Symbol.asyncIterator](): AsyncIterableIteratorToArrayWrapper<V> {
    return this.values();
  }

  values(): AsyncIterableIteratorToArrayWrapper<V> {
    return this._newIterator(e => e[1] as unknown as V);
  }

  keys(): AsyncIterableIteratorToArrayWrapper<K> {
    return this._newIterator(e => e[0] as unknown as K);
  }

  entries(): AsyncIterableIteratorToArrayWrapper<[K, V]> {
    return this._newIterator(e => e as unknown as [K, V]);
  }

  private _newIterator<V>(
    toValue: (
      entry: readonly [key: string | db.IndexKey, value: ReadonlyJSONValue],
    ) => V,
  ) {
    return new AsyncIterableIteratorToArrayWrapper(
      scanIteratorUsingReader<V>(
        this._reader,
        this._options,
        this._onLimitKey,
        toValue,
      ),
    );
  }

  toArray(): Promise<V[]> {
    return this.values().toArray();
  }
}

/**
 * Creates a [[ScanResult]] from a [[ScanReader]]. This is an utility function
 * that is exposed in the public API because it is useful for implementing
 * Replicache's [[ReadTransaction]] interface.
 */
export function createScanResultFromScanReader<K, V>(
  reader: ScanReader,
  options: ScanOptions = {},
): ScanResult<K, V> {
  return createScanResultFromScanReaderWithOnLimitKey(
    reader,
    options,
    noopOnLimitKey,
  );
}

export function createScanResultFromScanReaderWithOnLimitKey<K, V>(
  reader: ScanReader,
  options: ScanOptions = {},
  onLimitKey: (key: string) => void,
): ScanResult<K, V> {
  return new ScanResultImpl(reader, options, onLimitKey);
}

async function* scanIteratorUsingReader<V>(
  reader: ScanReader,
  options: db.ScanOptions,
  onLimitKey: (key: string) => void,
  toValue: (
    entry: readonly [key: string | db.IndexKey, value: ReadonlyJSONValue],
  ) => V,
): AsyncIterableIterator<V> {
  // TODO(arv): Clean up the ScanOptions interfaces! We should only have
  // ScanOptions and ScanOptionsInternal. We should remove db.ScanOptions.
  const optionsInternal = convert(options);

  const {prefix = '', startKey, indexName} = optionsInternal;
  let {limit = Infinity} = optionsInternal;
  let fromKey = prefix;
  if (startKey !== undefined && startKey > fromKey) {
    fromKey = startKey;
  }

  if (fromKey !== '') {
    await reader.seek(fromKey);
  }

  while (limit--) {
    const result = await reader.next();
    if (!result || !result[0].startsWith(prefix)) {
      return;
    }

    if (indexName) {
      const key = decodeIndexKey(result[0]);
      yield toValue([key, result[1]]);
    } else {
      yield toValue(result);
    }

    if (limit === 0) {
      onLimitKey(result[0]);
    }
  }
}

export function noopOnLimitKey(_key: string): void {
  // noop
}
