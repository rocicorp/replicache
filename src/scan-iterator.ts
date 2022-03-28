import {deepClone, JSONValue, ReadonlyJSONValue} from './json';
import {throwIfClosed} from './transaction-closed-error';
import {
  ScanIndexOptions,
  ScanOptions,
  toDbScanOptions as toDBScanOptions,
} from './scan-options';
import {asyncIterableToArray} from './async-iterable-to-array';
import * as db from './db/mod';
import type {Entry} from './btree/node';
import {decodeIndexKey} from './db/mod';

const VALUE = 0;
const KEY = 1;
const ENTRY = 2;
type ScanIterableKind = typeof VALUE | typeof KEY | typeof ENTRY;

/**
 * This interface is used for the results of [[ReadTransaction.scan|scan]]. It
 * extends `AsyncIterable<JSONValue>` which allows you to use it in a `for
 * await` loop. There are also methods to iterate over the [[keys]],
 * [[entries]] or [[values]].
 */
export interface ScanResult<K, V extends ReadonlyJSONValue = JSONValue>
  extends AsyncIterable<V> {
  /** The default AsyncIterable. This is the same as [[values]]. */
  [Symbol.asyncIterator](): AsyncIterableIteratorToArrayWrapper<V>;

  /** Async iterator over the values of the [[ReadTransaction.scan|scan]] call. */
  values(): AsyncIterableIteratorToArrayWrapper<V>;

  /**
   * Async iterator over the keys of the [[ReadTransaction.scan|scan]]
   * call. If the [[ReadTransaction.scan|scan]] is over an index the key
   * is a tuple of `[secondaryKey: string, primaryKey]`
   */
  keys(): AsyncIterableIteratorToArrayWrapper<K>;

  /**
   * Async iterator over the entries of the [[ReadTransaction.scan|scan]]
   * call. An entry is a tuple of key values. If the
   * [[ReadTransaction.scan|scan]] is over an index the key is a tuple of
   * `[secondaryKey: string, primaryKey]`
   */
  entries(): AsyncIterableIteratorToArrayWrapper<[K, V]>;

  /** Returns all the values as an array. Same as `values().toArray()` */
  toArray(): Promise<V[]>;
}

export class ScanResultImpl<K, V extends ReadonlyJSONValue = JSONValue>
  implements ScanResult<K, V>
{
  private readonly _options: ScanOptions | undefined;
  private readonly _dbRead: db.Read;
  private readonly _onLimitKey?: (inclusiveLimitKey: string) => void;

  constructor(
    options: ScanOptions | undefined,
    dbRead: db.Read,
    onLimitKey?: (inclusiveLimitKey: string) => void,
  ) {
    this._options = options;
    this._dbRead = dbRead;
    this._onLimitKey = onLimitKey;
  }

  [Symbol.asyncIterator](): AsyncIterableIteratorToArrayWrapper<V> {
    return this.values();
  }

  values(): AsyncIterableIteratorToArrayWrapper<V> {
    return new AsyncIterableIteratorToArrayWrapper(this._newIterator(VALUE));
  }

  keys(): AsyncIterableIteratorToArrayWrapper<K> {
    return new AsyncIterableIteratorToArrayWrapper(this._newIterator(KEY));
  }

  entries(): AsyncIterableIteratorToArrayWrapper<[K, V]> {
    return new AsyncIterableIteratorToArrayWrapper(this._newIterator(ENTRY));
  }

  toArray(): Promise<V[]> {
    return this.values().toArray();
  }

  private _newIterator<T>(kind: ScanIterableKind): AsyncIterableIterator<T> {
    return scanIterator(kind, this._options, this._dbRead, this._onLimitKey);
  }
}

/**
 * A class that wraps an async iterable iterator to add a [[toArray]] method.
 *
 * Usage:
 *
 * ```ts
 * const keys: string[] = await rep.scan().keys().toArray();
 * ```
 */
export class AsyncIterableIteratorToArrayWrapper<V>
  implements AsyncIterableIterator<V>
{
  private readonly _it: AsyncIterableIterator<V>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly next: (v?: any) => Promise<IteratorResult<V>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly return?: (value?: any) => Promise<IteratorResult<V>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly throw?: (e?: any) => Promise<IteratorResult<V>>;

  constructor(it: AsyncIterableIterator<V>) {
    this._it = it;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.next = (v: any) => it.next(v);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion
    this.return = it.return ? (v: any) => it.return!(v) : undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion
    this.throw = it.throw ? (v: any) => it.throw!(v) : undefined;
  }

  toArray(): Promise<V[]> {
    return asyncIterableToArray(this._it);
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<V> {
    return this._it[Symbol.asyncIterator]();
  }
}

async function* scanIterator<V>(
  kind: ScanIterableKind,
  options: ScanOptions | undefined,
  dbRead: db.Read,
  onLimitKey?: (inclusiveLimitKey: string) => void,
): AsyncIterableIterator<V> {
  throwIfClosed(dbRead);

  type MaybeIndexName = Partial<ScanIndexOptions>;
  const isIndexScan = (options as MaybeIndexName)?.indexName !== undefined;

  const shouldClone = dbRead instanceof db.Write;
  const toValue = shouldClone ? deepClone : <T>(x: T): T => x;

  let convertEntry: (entry: Entry<ReadonlyJSONValue>) => V;
  switch (kind) {
    case VALUE:
      convertEntry = entry => toValue(entry[1]) as V;
      break;
    case KEY:
      convertEntry = isIndexScan
        ? entry => decodeIndexKey(entry[0]) as unknown as V
        : entry => entry[0] as unknown as V;
      break;
    case ENTRY:
      convertEntry = isIndexScan
        ? entry => [decodeIndexKey(entry[0]), toValue(entry[1])] as unknown as V
        : entry => entry as unknown as V;
      break;
  }

  yield* dbRead.scan(toDBScanOptions(options), convertEntry, onLimitKey);
}
