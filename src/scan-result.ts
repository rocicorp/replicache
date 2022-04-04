import type {ReadonlyJSONValue} from './json';
import type {AsyncIterableIteratorToArrayWrapper} from './async-iterable-iterator-to-array-wrapper.js';
import type {ScanKey} from './scan-reader.js';

/**
 * This interface is used for the results of [[ReadTransaction.scan|scan]]. It
 * extends `AsyncIterable<JSONValue>` which allows you to use it in a `for
 * await` loop. There are also methods to iterate over the [[keys]],
 * [[entries]] or [[values]].
 */
export interface ScanResult<
  Key extends ScanKey,
  Value extends ReadonlyJSONValue,
> extends AsyncIterable<Value> {
  /** The default AsyncIterable. This is the same as [[values]]. */
  [Symbol.asyncIterator](): AsyncIterableIteratorToArrayWrapper<Value>;

  /** Async iterator over the values of the [[ReadTransaction.scan|scan]] call. */
  values(): AsyncIterableIteratorToArrayWrapper<Value>;

  /**
   * Async iterator over the keys of the [[ReadTransaction.scan|scan]]
   * call. If the [[ReadTransaction.scan|scan]] is over an index the key
   * is a tuple of `[secondaryKey: string, primaryKey]`
   */
  keys(): AsyncIterableIteratorToArrayWrapper<Key>;

  /**
   * Async iterator over the entries of the [[ReadTransaction.scan|scan]]
   * call. An entry is a tuple of key values. If the
   * [[ReadTransaction.scan|scan]] is over an index the key is a tuple of
   * `[secondaryKey: string, primaryKey]`
   */
  entries(): AsyncIterableIteratorToArrayWrapper<readonly [Key, Value]>;

  /** Returns all the values as an array. Same as `values().toArray()` */
  toArray(): Promise<Value[]>;
}
