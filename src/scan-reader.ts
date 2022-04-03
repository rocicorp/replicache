import type {ReadonlyJSONValue} from './json.js';
import {AsyncIterableIteratorToArrayWrapper} from './async-iterable-iterator-to-array-wrapper';
import type {ScanResult} from './scan-result.js';
import {
  isScanIndexOptions,
  KeyTypeForScanOptions,
  ScanIndexOptions,
  ScanNoIndexOptions,
  ScanOptionIndexedStartKey,
  ScanOptions,
} from './scan-options.js';
import {decodeIndexKey, encodeIndexScanKey, IndexKey} from './db/index-key.js';

/**
 * The type of the key used when doing a scan. When scanning over an index, this
 * is a tuple of the secondary key followed by the primary key. When doing a non
 * index scan, keys are strings.
 */
export type ScanKey = string | IndexKey;

/**
 * ScanReader is a low level interface that is used to iterate over scan results.
 */
export interface ScanReader<Key extends ScanKey> {
  /**
   * Moves the reader to the key starting at `key`.
   */
  seek(key: Key): Promise<void>;

  /**
   * Returns the next entry in the reader. This should return `undefined` when
   * the reader is at the end and there are no more entries to return.
   */
  next(): Promise<readonly [key: Key, value: ReadonlyJSONValue] | undefined>;
}

/**
 * Internally we only use strings for the keys. For index maps we encode the
 * keys into specially shaped string keys.
 */
export type ScanReaderInternal = ScanReader<string>;

export class ScanResultImpl<
  Options extends ScanOptions,
  Key extends KeyTypeForScanOptions<Options>,
  Value extends ReadonlyJSONValue,
> implements ScanResult<Key, Value>
{
  private readonly _reader: ScanReader<Key>;
  private readonly _options: Options;
  private readonly _onLimitKey: (inclusiveLimitKey: string) => void;

  constructor(
    reader: ScanReader<Key>,
    options: Options,
    onLimitKey: (inclusiveLimitKey: string) => void,
  ) {
    this._reader = reader;
    this._options = options;
    this._onLimitKey = onLimitKey;
  }

  [Symbol.asyncIterator](): AsyncIterableIteratorToArrayWrapper<Value> {
    return this.values();
  }

  values(): AsyncIterableIteratorToArrayWrapper<Value> {
    return this._newIterator(e => e[1] as unknown as Value);
  }

  keys(): AsyncIterableIteratorToArrayWrapper<Key> {
    return this._newIterator(e => e[0] as unknown as Key);
  }

  entries(): AsyncIterableIteratorToArrayWrapper<readonly [Key, Value]> {
    return this._newIterator(e => e as unknown as [Key, Value]);
  }

  private _newIterator<ToValueReturnType>(
    toValue: (
      entry: readonly [key: string | IndexKey, value: ReadonlyJSONValue],
    ) => ToValueReturnType,
  ) {
    // TODO: let reader = ...
    let reader: AsyncIterableIterator<ToValueReturnType>;
    if (isScanIndexOptions(this._options)) {
      reader = scanIteratorUsingIndexedScanReader(
        this._reader as ScanReader<IndexKey>,
        this._options,
        toValue,
      );
    } else {
      reader = scanIteratorUsingNonIndexReader(
        this._reader as ScanReader<string>,
        this._options,
        this._onLimitKey,
        toValue as any,
      );
    }
    return new AsyncIterableIteratorToArrayWrapper(reader);
  }

  toArray(): Promise<Value[]> {
    return this.values().toArray();
  }
}

/**
 * Creates a [[ScanResult]] from a [[ScanReader]]. This is an utility function
 * that is exposed in the public API because it is useful for implementing
 * Replicache's [[ReadTransaction]] interface.
 */
export function makeScanResult<
  Options extends ScanOptions,
  Key extends KeyTypeForScanOptions<Options>,
  Value,
>(reader: ScanReader<Key>, options: Options): ScanResult<Key, Value> {
  if (isScanIndexOptions(options)) {
    return createScanResultFromScanReaderWithOnLimitKey(
      reader,
      options,
      noopOnLimitKey,
    );
  }
  return createScanResultFromScanReaderWithOnLimitKey(
    reader,
    options,
    noopOnLimitKey,
  );
}

export function createScanResultFromScanReaderWithOnLimitKey<
  Options extends ScanOptions,
  Key extends KeyTypeForScanOptions<Options>,
  Value,
>(
  reader: ScanReader<Key>,
  options: Options,
  onLimitKey: (key: string) => void,
): ScanResult<Key, Value> {
  return new ScanResultImpl(reader, options, onLimitKey);
}

function maxFromKey(
  key: ScanOptionIndexedStartKey,
  fromKey: string,
): ScanOptionIndexedStartKey {
  if (key[0] >= fromKey) {
    return key;
  }
  return fromKey;
}

async function* scanIteratorUsingNonIndexReader<ToValueReturnType>(
  reader: ScanReader<string>,
  options: ScanNoIndexOptions,
  onLimitKey: (key: string) => void,
  toValue: (
    entry: readonly [key: string, value: ReadonlyJSONValue],
  ) => ToValueReturnType,
): AsyncIterableIterator<ToValueReturnType> {
  const {prefix = '', start} = options;
  let {limit = Infinity} = options;
  let exclusive: boolean | undefined = false;
  let fromKey = prefix;
  if (start !== undefined) {
    fromKey = start.key;
    exclusive = start.exclusive;
  }

  if (fromKey !== '') {
    await reader.seek(fromKey);
  }

  while (limit--) {
    const result = await reader.next();
    if (!result || !result[0].startsWith(prefix)) {
      return;
    }

    if (exclusive) {
      exclusive = false;
      if (result[0] === fromKey) {
        continue;
      }
    }

    yield toValue(result);

    if (limit === 0) {
      onLimitKey(result[0]);
    }
  }
}

function shouldSeek(key: ScanOptionIndexedStartKey): boolean {
  if (typeof key === 'string') {
    return key !== '';
  }
  return key[0] !== '';
}

function seekKey(key: ScanOptionIndexedStartKey): IndexKey {
  if (typeof key === 'string') {
    return [key, ''];
  }
  if (key[1] === undefined) {
    return [key[0], ''];
  }
  return key as IndexKey;
}

function shouldSkip(
  fromKey: ScanOptionIndexedStartKey,
  key: IndexKey,
): boolean {
  if (typeof fromKey === 'string') {
    return key[0] === fromKey;
  }
  if (fromKey[1] === undefined) {
    // When primary is not defined we skip the first entry.
    return fromKey[0] === key[0];
  }
  return key[0] === fromKey[0] && key[1] === fromKey[1];
}

async function* scanIteratorUsingIndexedScanReader<ToValueReturnType>(
  reader: ScanReader<IndexKey>,
  options: ScanIndexOptions,
  toValue: (
    entry: readonly [key: IndexKey, value: ReadonlyJSONValue],
  ) => ToValueReturnType,
): AsyncIterableIterator<ToValueReturnType> {
  const {prefix = '', start} = options;
  let {limit = Infinity} = options;
  let exclusive: boolean | undefined = false;

  let fromKey: ScanOptionIndexedStartKey = prefix;
  if (start !== undefined) {
    fromKey = maxFromKey(start.key, fromKey);
    exclusive = start.exclusive;
  }

  if (shouldSeek(fromKey)) {
    await reader.seek(seekKey(fromKey));
  }

  while (limit--) {
    const result = await reader.next();
    // prefix only applies to secondary key.
    if (!result || !result[0][0].startsWith(prefix)) {
      return;
    }

    if (exclusive) {
      exclusive = false;
      if (shouldSkip(fromKey, result[0])) {
        continue;
      }
    }

    yield toValue(result);
  }
}

export function noopOnLimitKey(_key: string): void {
  // noop
}

export class ScanReaderForIndex implements ScanReader<IndexKey> {
  private readonly _reader: ScanReader<string>;

  constructor(reader: ScanReader<string>) {
    this._reader = reader;
  }

  seek(key: IndexKey): Promise<void> {
    // exclusive is handled by the main scan loop.
    const k = encodeIndexScanKey(key[0], key[1], false);
    return this._reader.seek(k);
  }

  async next(): Promise<
    readonly [key: IndexKey, value: ReadonlyJSONValue] | undefined
  > {
    const res = await this._reader.next();
    if (!res) {
      return undefined;
    }
    return [decodeIndexKey(res[0]), res[1]];
  }
}
