import type {JSONValue, ReadonlyJSONValue} from './json';
import type {CommitTransactionResponse, RebaseOpts} from './repm-invoker';
import {
  KeyTypeForScanOptions,
  ScanOptions,
  toDbScanOptions,
} from './scan-options';
import {ScanResult} from './scan-iterator';
import {throwIfClosed} from './transaction-closed-error';
import * as embed from './embed/mod';
import type * as db from './db/mod';
import type {LogContext} from './logger';
import {assertNotUndefined} from './asserts';

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
  get(key: string): Promise<ReadonlyJSONValue | undefined>;

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
  scan(): ScanResult<string, ReadonlyJSONValue>;

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
  scan<Options extends ScanOptions, Key extends KeyTypeForScanOptions<Options>>(
    options?: Options,
  ): ScanResult<Key, ReadonlyJSONValue>;
}

export class ReadTransactionImpl<Value extends ReadonlyJSONValue>
  implements ReadTransaction
{
  protected _transactionId = -1;
  protected _closed = false;
  protected readonly _dbName: string;
  protected readonly _openResponse: Promise<unknown>;
  protected readonly _shouldClone: boolean = false;

  protected _transaction: db.Read | db.Write | undefined = undefined;
  protected readonly _lc: LogContext;

  constructor(
    dbName: string,
    openResponse: Promise<unknown>,
    lc: LogContext,
    rpcName = 'openReadTransaction',
  ) {
    this._dbName = dbName;
    this._openResponse = openResponse;
    this._lc = lc.addContext('rpc', rpcName);
  }

  async get(key: string): Promise<Value | undefined> {
    throwIfClosed(this);
    assertNotUndefined(this._transaction);
    assertNotUndefined(this._lc);
    return embed.get(this._transaction, this._lc, key, this._shouldClone) as
      | Value
      | undefined;
  }

  async has(key: string): Promise<boolean> {
    throwIfClosed(this);
    assertNotUndefined(this._transaction);
    assertNotUndefined(this._lc);
    return embed.has(this._transaction, this._lc, key);
  }

  async isEmpty(): Promise<boolean> {
    throwIfClosed(this);
    assertNotUndefined(this._transaction);
    assertNotUndefined(this._lc);
    let empty = true;
    await embed.scan(
      this._transaction,
      this._lc,
      {limit: 1},
      () => (empty = false),
      false, // shouldClone
    );
    return empty;
  }

  scan<Options extends ScanOptions, Key extends KeyTypeForScanOptions<Options>>(
    options?: Options,
  ): ScanResult<Key, Value> {
    return new ScanResult(
      options,
      () => this,
      false, // shouldCloseTransaction
      this._shouldClone,
    );
  }

  get id(): number {
    return this._transactionId;
  }

  get closed(): boolean {
    return this._closed;
  }

  async open(): Promise<void> {
    await this._openResponse;
    const {id, txn} = await embed.openReadTransaction(this._dbName, this._lc);
    this._transactionId = id;
    this._transaction = txn;
  }

  async close(): Promise<void> {
    this._closed = true;
    assertNotUndefined(this._transaction);
    return await embed.closeTransaction(this._transaction.asRead(), this._lc);
  }

  lc(): LogContext {
    return this._lc;
  }

  dbTxn(): db.Read | db.Write {
    assertNotUndefined(this._transaction);
    return this._transaction;
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

  get(key: string): Promise<ReadonlyJSONValue | undefined> {
    this._keys.add(key);
    return this._tx.get(key);
  }

  has(key: string): Promise<boolean> {
    this._keys.add(key);
    return this._tx.has(key);
  }

  scan<Options extends ScanOptions, Key extends KeyTypeForScanOptions<Options>>(
    options?: Options,
  ): ScanResult<Key, ReadonlyJSONValue> {
    this._scans.push(toDbScanOptions(options));
    return this._tx.scan(options);
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

  /**
   * Overrides [[ReadTransaction.get]] to return a mutable [[JSONValue]].
   */
  get(key: string): Promise<JSONValue | undefined>;

  /**
   * Overrides [[ReadTransaction.scan]] to return a mutable [[JSONValue]].
   */
  scan(): ScanResult<string, JSONValue>;
  scan<Options extends ScanOptions, Key extends KeyTypeForScanOptions<Options>>(
    options?: Options,
  ): ScanResult<Key, JSONValue>;
}

export class WriteTransactionImpl
  extends ReadTransactionImpl<JSONValue>
  implements WriteTransaction
{
  protected readonly _shouldClone: boolean = true;
  private readonly _name: string;
  private readonly _args: JSONValue;
  private readonly _rebaseOpts: RebaseOpts | undefined;

  protected _transaction: db.Write | undefined = undefined;

  constructor(
    dbName: string,
    openResponse: Promise<unknown>,
    name: string,
    args: JSONValue,
    rebaseOpts: RebaseOpts | undefined,
    lc: LogContext,
  ) {
    super(dbName, openResponse, lc, 'openWriteTransaction');
    this._name = name;
    this._args = args;
    this._rebaseOpts = rebaseOpts;
  }

  async put(key: string, value: JSONValue): Promise<void> {
    throwIfClosed(this);
    assertNotUndefined(this._transaction);
    assertNotUndefined(this._lc);
    await embed.put(this._transaction, this._lc, key, value);
  }

  async del(key: string): Promise<boolean> {
    throwIfClosed(this);
    assertNotUndefined(this._transaction);
    assertNotUndefined(this._lc);
    return await embed.del(this._transaction, this._lc, key);
  }

  async commit(
    generateChangedKeys: boolean,
  ): Promise<CommitTransactionResponse> {
    this._closed = true;
    assertNotUndefined(this._transaction);
    assertNotUndefined(this._lc);
    return await embed.commitTransaction(
      this._transaction,
      this._lc,
      generateChangedKeys,
    );
  }

  async open(): Promise<void> {
    await this._openResponse;
    const {id, txn} = await embed.openWriteTransaction(
      this._dbName,
      this._name,
      this._args,
      this._rebaseOpts,
      this._lc,
    );
    this._transactionId = id;
    this._transaction = txn;
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
  extends ReadTransactionImpl<ReadonlyJSONValue>
  implements IndexTransaction
{
  protected _transaction: db.Write | undefined = undefined;

  constructor(dbName: string, openResponse: Promise<unknown>, lc: LogContext) {
    super(dbName, openResponse, lc, 'openIndexTransaction');
  }

  async createIndex(options: CreateIndexDefinition): Promise<void> {
    throwIfClosed(this);
    assertNotUndefined(this._transaction);
    assertNotUndefined(this._lc);
    await embed.createIndex(
      this._transaction,
      this._lc,
      options.name,
      options.prefix ?? options.keyPrefix ?? '',
      options.jsonPointer,
    );
  }

  async dropIndex(name: string): Promise<void> {
    throwIfClosed(this);
    assertNotUndefined(this._transaction);
    assertNotUndefined(this._lc);
    await embed.dropIndex(this._transaction, this._lc, name);
  }

  async commit(): Promise<CommitTransactionResponse> {
    this._closed = true;
    assertNotUndefined(this._transaction);
    assertNotUndefined(this._lc);
    return await embed.commitTransaction(this._transaction, this._lc, false);
  }

  async open(): Promise<void> {
    await this._openResponse;
    const {id, txn} = await embed.openIndexTransaction(this._dbName, this._lc);
    this._transactionId = id;
    this._transaction = txn;
  }
}
