import type {JSONValue, ReadonlyJSONValue} from './json';
import {throwIfClosed} from './transaction-closed-error';
import {ScanOptions, toDbScanOptions} from './scan-options';
import {asyncIterableToArray} from './async-iterable-to-array';
import * as embed from './embed/mod';

interface IdCloser {
  close(): void;
  closed: boolean;
  id: number;
}

const VALUE = 0;
const KEY = 1;
const ENTRY = 2;
type ScanIterableKind = typeof VALUE | typeof KEY | typeof ENTRY;

type Args = [
  options: ScanOptions | undefined,
  getTransaction: () => Promise<IdCloser> | IdCloser,
  shouldCloseTransaction: boolean,
  shouldClone: boolean,
];

/**
 * This class is used for the results of [[ReadTransaction.scan|scan]]. It
 * implements `AsyncIterable<JSONValue>` which allows you to use it in a `for
 * await` loop. There are also methods to iterate over the [[keys]],
 * [[entries]] or [[values]].
 */
export class ScanResult<K, V extends ReadonlyJSONValue = JSONValue>
  implements AsyncIterable<V>
{
  private readonly _args: Args;

  /** @internal */
  constructor(...args: Args) {
    this._args = args;
  }

  /** The default AsyncIterable. This is the same as [[values]]. */
  [Symbol.asyncIterator](): AsyncIterableIteratorToArrayWrapper<V> {
    return this.values();
  }

  /** Async iterator over the valus of the [[ReadTransaction.scan|scan]] call. */
  values(): AsyncIterableIteratorToArrayWrapper<V> {
    return new AsyncIterableIteratorToArrayWrapper(this._newIterator(VALUE));
  }

  /**
   * Async iterator over the keys of the [[ReadTransaction.scan|scan]]
   * call. If the [[ReadTransaction.scan|scan]] is over an index the key
   * is a tuple of `[secondaryKey: string, primaryKey]`
   */
  keys(): AsyncIterableIteratorToArrayWrapper<K> {
    return new AsyncIterableIteratorToArrayWrapper(this._newIterator(KEY));
  }

  /**
   * Async iterator over the entries of the [[ReadTransaction.scan|scan]]
   * call. An entry is a tuple of key values. If the
   * [[ReadTransaction.scan|scan]] is over an index the key is a tuple of
   * `[secondaryKey: string, primaryKey]`
   */
  entries(): AsyncIterableIteratorToArrayWrapper<[K, V]> {
    return new AsyncIterableIteratorToArrayWrapper(this._newIterator(ENTRY));
  }

  /** Returns all the values as an array. Same as `values().toArray()` */
  toArray(): Promise<V[]> {
    return this.values().toArray();
  }

  private _newIterator<T>(kind: ScanIterableKind): AsyncIterableIterator<T> {
    return scanIterator(kind, ...this._args);
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
  getTransaction: () => Promise<IdCloser> | IdCloser,
  shouldCloseTransaction: boolean,
  shouldClone: boolean,
): AsyncGenerator<V> {
  const transaction = await getTransaction();
  throwIfClosed(transaction);

  try {
    const items: V[] = await load(kind, options, transaction.id, shouldClone);
    for (const item of items) {
      yield item;
    }
  } finally {
    if (shouldCloseTransaction && !transaction.closed) {
      transaction.close();
    }
  }
}

async function load<V>(
  kind: ScanIterableKind,
  options: ScanOptions | undefined,
  transactionID: number,
  shouldClone: boolean,
): Promise<V[]> {
  const items: V[] = [];
  type MaybeIndexName = {indexName?: string};
  const key = (primaryKey: string, secondaryKey: string | null) =>
    (options as MaybeIndexName)?.indexName !== undefined
      ? [secondaryKey, primaryKey]
      : primaryKey;

  const receiver = (
    primaryKey: string,
    secondaryKey: string | null,
    value: ReadonlyJSONValue,
  ) => {
    switch (kind) {
      case VALUE:
        items.push(value as unknown as V);
        return;
      case KEY:
        items.push(key(primaryKey, secondaryKey) as unknown as V);
        return;
      case ENTRY:
        items.push([key(primaryKey, secondaryKey), value] as unknown as V);
    }
  };

  await embed.scan(
    transactionID,
    toDbScanOptions(options),
    receiver,
    shouldClone,
  );

  return items;
}
