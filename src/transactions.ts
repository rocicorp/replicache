import type {JSONValue} from './json';
import type {
  OpenTransactionRequest,
  CommitTransactionResponse,
  CloseTransactionResponse,
} from './repm-invoker';
import {
  KeyTypeForScanOptions,
  ScanOptions,
  toDbScanOptions,
} from './scan-options';
import {ScanResult} from './scan-iterator';
import {throwIfClosed} from './transaction-closed-error';
import {asyncIterableToArray} from './async-iterable-to-array';
import * as embed from './embed/mod';
import type * as db from './db/mod';

/**
 * ReadTransactions are used with [[Replicache.query]] and
 * [[Replicache.subscribe]] and allows read operations on the
 * database.
 */
export interface ReadTransaction {
  /**
   * Get a single value from the database. If the `key` is not present this
   * returns `undefined`.
   */
  get(key: string): Promise<JSONValue | undefined>;

  /** Determines if a single `key` is present in the database. */
  has(key: string): Promise<boolean>;

  /** Whether the database is empty. */
  isEmpty(): Promise<boolean>;

  /**
   * Gets many values from the database. This returns a [[ScanResult]] which
   * implements `AsyncIterable`. It also has methods to iterate over the [[ScanResult.keys|keys]]
   * and [[ScanResult.entries|entries]].
   *
   * If `options` has an `indexName`, then this does a scan over an index with
   * that name. A scan over an index uses a tuple for the key consisting of
   * `[secondary: string, primary: string]`.
   *
   * If the [[ScanResult]] is used after the `ReadTransaction` has been closed it
   * will throw a [[TransactionClosedError]].
   */
  scan(): ScanResult<string>;

  /**
   * Gets many values from the database. This returns a [[ScanResult]] which
   * implements `AsyncIterable`. It also has methods to iterate over the [[ScanResult.keys|keys]]
   * and [[ScanResult.entries|entries]].
   *
   * If `options` has an `indexName`, then this does a scan over an index with
   * that name. A scan over an index uses a tuple for the key consisting of
   * `[secondary: string, primary: string]`.
   *
   * If the [[ScanResult]] is used after the `ReadTransaction` has been closed it
   * will throw a [[TransactionClosedError]].
   */
  scan<O extends ScanOptions, K extends KeyTypeForScanOptions<O>>(
    options?: O,
  ): ScanResult<K>;

  /**
   * Convenience form of [[scan]] which returns all the entries as an array.
   * @deprecated Use `scan().entries().toArray()` instead
   */
  scanAll(): Promise<[string, JSONValue][]>;

  /**
   * Convenience form of [[scan]] which returns all the entries as an array.
   * @deprecated Use `scan().entries().toArray()` instead
   */
  scanAll<O extends ScanOptions, K extends KeyTypeForScanOptions<O>>(
    options?: O,
  ): Promise<[K, JSONValue][]>;
}

const enum OpenTransactionType {
  Normal,
  Index,
}

export class ReadTransactionImpl implements ReadTransaction {
  private _transactionId = -1;
  protected _closed = false;
  protected readonly _openTransactionType: OpenTransactionType =
    OpenTransactionType.Normal;
  private readonly _dbName: string;
  protected readonly _openResponse: Promise<unknown>;

  constructor(dbName: string, openResponse: Promise<unknown>) {
    this._dbName = dbName;
    this._openResponse = openResponse;
  }

  async get(key: string): Promise<JSONValue | undefined> {
    throwIfClosed(this);
    return await embed.get(this._transactionId, key);
  }

  async has(key: string): Promise<boolean> {
    throwIfClosed(this);
    return await embed.has(this._transactionId, key);
  }

  async isEmpty(): Promise<boolean> {
    throwIfClosed(this);

    let empty = true;
    await embed.scan(this._transactionId, {limit: 1}, () => (empty = false));
    return empty;
  }

  scan<O extends ScanOptions, K extends KeyTypeForScanOptions<O>>(
    options?: O,
  ): ScanResult<K> {
    return new ScanResult(options, () => this, false);
  }

  async scanAll<O extends ScanOptions, K extends KeyTypeForScanOptions<O>>(
    options?: O,
  ): Promise<[K, JSONValue][]> {
    return asyncIterableToArray(
      this.scan(options).entries() as AsyncIterable<[K, JSONValue]>,
    );
  }

  get id(): number {
    return this._transactionId;
  }

  get closed(): boolean {
    return this._closed;
  }

  async open(args: OpenTransactionRequest): Promise<void> {
    await this._openResponse;
    if (this._openTransactionType === OpenTransactionType.Normal) {
      this._transactionId = await embed.openTransaction(
        this._dbName,
        args.name,
        args.args,
        args.rebaseOpts,
      );
    } else {
      this._transactionId = await embed.openIndexTransaction(this._dbName);
    }
  }

  async close(): Promise<CloseTransactionResponse> {
    this._closed = true;
    return await embed.closeTransaction(this._transactionId);
  }
}

// An implementation of ReadTransaction that keeps track of `keys` and `scans`
// for use with Subscriptions.
export class SubscriptionTransactionWrapper implements ReadTransaction {
  private readonly _keys: Set<string> = new Set();
  private readonly _scans: db.ScanOptions[] = [];
  private readonly _tx: ReadTransaction;

  constructor(tx: ReadTransaction) {
    this._tx = tx;
  }

  isEmpty(): Promise<boolean> {
    // Any change to the subscription requires rerunning it.
    this._scans.push({});
    return this._tx.isEmpty();
  }

  get(key: string): Promise<JSONValue | undefined> {
    this._keys.add(key);
    return this._tx.get(key);
  }

  has(key: string): Promise<boolean> {
    this._keys.add(key);
    return this._tx.has(key);
  }

  scan<O extends ScanOptions, K extends KeyTypeForScanOptions<O>>(
    options?: O,
  ): ScanResult<K> {
    this._scans.push(toDbScanOptions(options));
    return this._tx.scan(options);
  }

  /** @deprecated Use [[scan]] instead */
  /* c8 ignore next 6 */
  async scanAll<O extends ScanOptions, K extends KeyTypeForScanOptions<O>>(
    options?: O,
  ): Promise<[K, JSONValue][]> {
    this._scans.push(toDbScanOptions(options));
    return this._tx.scanAll(options);
  }

  get keys(): ReadonlySet<string> {
    return this._keys;
  }

  get scans(): db.ScanOptions[] {
    return this._scans;
  }
}

/**
 * WriteTransactions are used with *mutators* which are registered using
 * [[ReplicacheOptions.mutators]] and allows read and write operations on the
 * database.
 */
export interface WriteTransaction extends ReadTransaction {
  /**
   * Sets a single `value` in the database. The `value` will be encoded using
   * `JSON.stringify`.
   */
  put(key: string, value: JSONValue): Promise<void>;

  /**
   * Removes a `key` and its value from the database. Returns `true` if there was a
   * `key` to remove.
   */
  del(key: string): Promise<boolean>;
}

export class WriteTransactionImpl
  extends ReadTransactionImpl
  implements WriteTransaction
{
  async put(key: string, value: JSONValue): Promise<void> {
    throwIfClosed(this);
    await embed.put(this.id, key, value);
  }

  async del(key: string): Promise<boolean> {
    throwIfClosed(this);
    return await embed.del(this.id, key);
  }

  async commit(
    generateChangedKeys: boolean,
  ): Promise<CommitTransactionResponse> {
    this._closed = true;
    return await embed.commitTransaction(this.id, generateChangedKeys);
  }
}

export interface IndexTransaction extends ReadTransaction {
  /**
   * Creates a persistent secondary index in Replicache which can be used with
   * scan.
   *
   * If the named index already exists with the same definition this returns
   * success immediately. If the named index already exists, but with a
   * different definition an error is thrown.
   */
  createIndex(def: CreateIndexDefinition): Promise<void>;

  /**
   * Drops an index previously created with [[createIndex]].
   */
  dropIndex(name: string): Promise<void>;
}

/**
 * The definition of an index. This is used with
 * [[Replicache.createIndex|createIndex]] when creating indexes.
 */
export interface CreateIndexDefinition {
  /** The name of the index. This is used when you [[ReadTransaction.scan|scan]] over an index. */
  name: string;

  /**
   * The prefix, if any, to limit the index over. If not provided the values of
   * all keys are indexed.
   * @deprecated Use [[prefix]] instead.
   */
  keyPrefix?: string;

  /**
   * The prefix, if any, to limit the index over. If not provided the values of
   * all keys are indexed.
   */
  prefix?: string;

  /**
   * A [JSON Pointer](https://tools.ietf.org/html/rfc6901) pointing at the sub
   * value inside each value to index over.
   *
   * For example, one might index over users' ages like so:
   * `createIndex({name: 'usersByAge', keyPrefix: '/user/', jsonPointer: '/age'})`
   */
  jsonPointer: string;
}

export class IndexTransactionImpl
  extends ReadTransactionImpl
  implements IndexTransaction
{
  protected readonly _openTransactionType = OpenTransactionType.Index;

  async createIndex(options: CreateIndexDefinition): Promise<void> {
    throwIfClosed(this);
    await embed.createIndex(
      this.id,
      options.name,
      options.prefix ?? options.keyPrefix ?? '',
      options.jsonPointer,
    );
  }

  async dropIndex(name: string): Promise<void> {
    throwIfClosed(this);
    await embed.dropIndex(this.id, name);
  }

  async commit(): Promise<CommitTransactionResponse> {
    this._closed = true;
    return await embed.commitTransaction(this.id, false);
  }
}
