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

type ToValue<Key, ToValueReturnType> = (
  entry: readonly [key: Key, value: ReadonlyJSONValue],
) => ToValueReturnType;

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
    toValue: ToValue<ScanKey, ToValueReturnType>,
  ) {
    let reader: AsyncIterableIterator<ToValueReturnType>;
    if (isScanIndexOptions(this._options)) {
      reader = scanIteratorUsingReader(
        makeIndexedDelegate(
          this._options,
          this._reader as ScanReader<IndexKey>,
          toValue,
        ),
      );
    } else {
      reader = scanIteratorUsingReader(
        makeNonIndexedDelegate(
          this._options,
          this._reader as ScanReader<string>,
          this._onLimitKey,
          toValue,
        ),
      );
    }
    return new AsyncIterableIteratorToArrayWrapper(reader);
  }

  toArray(): Promise<Value[]> {
    return this.values().toArray();
  }
}

function makeNonIndexedDelegate<ToValueReturnType>(
  options: ScanNoIndexOptions,
  reader: ScanReader<string>,
  onLimitKey: (inclusiveLimitKey: string) => void,
  toValue: ToValue<string, ToValueReturnType>,
): ScanIteratorDelegate<ScanNoIndexOptions, ToValueReturnType, string, string> {
  return {
    maxFromKey: (key, fromKey) => (key >= fromKey ? key : fromKey),
    onLimitKey,
    reader,
    options,
    seekKey: key => key,
    shouldSeek: key => key !== '',
    shouldSkip: (fromKey, key) => fromKey === key,
    startsWith: (key, prefix) => key.startsWith(prefix),
    toValue,
  };
}

function makeIndexedDelegate<ToValueReturnType>(
  options: ScanIndexOptions,
  reader: ScanReader<IndexKey>,
  toValue: ToValue<IndexKey, ToValueReturnType>,
): ScanIteratorDelegate<ScanIndexOptions, ToValueReturnType> {
  return {
    maxFromKey: (key, fromKey) => (key[0] >= fromKey ? key : fromKey),
    onLimitKey: noopOnLimitKey,
    reader,
    options,
    seekKey: key => {
      if (typeof key === 'string') {
        return [key, ''];
      }
      if (key[1] === undefined) {
        return [key[0], ''];
      }
      return key as IndexKey;
    },
    shouldSeek: key => {
      if (typeof key === 'string') {
        return key !== '';
      }
      return key[0] !== '';
    },
    shouldSkip: (fromKey, key) => {
      if (typeof fromKey === 'string') {
        return key[0] === fromKey;
      }
      if (fromKey[1] === undefined) {
        // When primary is not defined we skip the first entry.
        return fromKey[0] === key[0];
      }
      return key[0] === fromKey[0] && key[1] === fromKey[1];
    },
    startsWith: (key, prefix) => key[0].startsWith(prefix),
    toValue,
  };
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
  return makeScanResultWithOnLimitKey(reader, options, noopOnLimitKey);
}

// Not part of the public API
export function makeScanResultWithOnLimitKey<
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

interface ScanIteratorDelegate<
  Options extends ScanOptions,
  ToValueReturnType,
  Key extends ScanKey = Options extends ScanIndexOptions ? IndexKey : string,
  StartKey extends ScanOptionIndexedStartKey = Options extends ScanIndexOptions
    ? ScanOptionIndexedStartKey
    : string,
> {
  maxFromKey(key: StartKey, fromKey: StartKey): StartKey;

  onLimitKey(key: Key): void;

  options: Options;

  reader: ScanReader<Key>;

  seekKey(key: StartKey): Key;

  shouldSeek(key: StartKey): boolean;

  shouldSkip(fromKey: StartKey, key: Key): boolean;

  startsWith(key: Key, prefix: string): boolean;

  toValue: ToValue<Key, ToValueReturnType>;
}

async function* scanIteratorUsingReader<
  Options extends ScanOptions,
  ToValueReturnType,
  Key extends ScanKey = Options extends ScanIndexOptions ? IndexKey : string,
  StartKey extends ScanOptionIndexedStartKey = Options extends ScanIndexOptions
    ? ScanOptionIndexedStartKey
    : string,
>(
  delegate: ScanIteratorDelegate<Options, ToValueReturnType, Key, StartKey>,
): AsyncIterableIterator<ToValueReturnType> {
  const {options, reader, startsWith, toValue} = delegate;
  const {prefix = '', start} = options;
  let {limit = Infinity} = options;
  let exclusive: boolean | undefined = false;
  let fromKey = prefix as StartKey;
  if (start !== undefined) {
    fromKey = delegate.maxFromKey(start.key as StartKey, fromKey);
    exclusive = start.exclusive;
  }

  if (delegate.shouldSeek(fromKey)) {
    await reader.seek(delegate.seekKey(fromKey));
  }

  while (limit--) {
    const result = await reader.next();
    if (!result || !startsWith(result[0], prefix)) {
      return;
    }

    if (exclusive) {
      exclusive = false;
      if (delegate.shouldSkip(fromKey, result[0])) {
        continue;
      }
    }

    yield toValue(result);

    if (limit === 0) {
      delegate.onLimitKey(result[0]);
    }
  }
}

export function noopOnLimitKey(_key: unknown): void {
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
