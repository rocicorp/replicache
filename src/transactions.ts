import type {LogContext} from '@rocicorp/logger';
import {deepClone, JSONValue, ReadonlyJSONValue} from './json';
import {
  isScanIndexOptions,
  KeyTypeForScanOptions,
  ScanOptions,
} from './scan-options';
import type {ScanResult} from './scan-result';
import {
  createScanResultFromScanReaderWithOnLimitKey as makeScanResultWithOnLimitKey,
  noopOnLimitKey,
  ScanKey,
  ScanReader,
  ScanReaderForIndex,
} from './scan-reader';
import {throwIfClosed} from './transaction-closed-error';
import * as db from './db/mod';
import * as sync from './sync/mod';
import type {Hash} from './hash';
import type {ScanSubscriptionInfo} from './subscriptions';
import type {ScanIndexOptions} from './scan-options.js';

/**
 * ReadTransactions are used with [[Replicache.query]] and
 * [[Replicache.subscribe]] and allows read operations on the
 * database.
 */
export interface ReadTransaction {
  readonly clientID: string;

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

let transactionIDCounter = 0;

export class ReadTransactionImpl<Value extends ReadonlyJSONValue>
  implements ReadTransaction
{
  readonly clientID: string;
  protected readonly _dbtx: db.Read;
  protected readonly _lc: LogContext;

  constructor(
    clientID: string,
    dbRead: db.Read,
    lc: LogContext,
    rpcName = 'openReadTransaction',
  ) {
    this.clientID = clientID;
    this._dbtx = dbRead;
    this._lc = lc
      .addContext(rpcName)
      .addContext('txid', transactionIDCounter++);
  }

  async get(key: string): Promise<Value | undefined> {
    throwIfClosed(this._dbtx);
    const rv = await this._dbtx.get(key);
    if (this._dbtx instanceof db.Write) {
      return (rv && deepClone(rv)) as Value | undefined;
    }
    return rv as Value | undefined;
  }

  async has(key: string): Promise<boolean> {
    throwIfClosed(this._dbtx);
    return this._dbtx.has(key);
  }

  async isEmpty(): Promise<boolean> {
    throwIfClosed(this._dbtx);
    return this._dbtx.isEmpty();
  }

  scan<Options extends ScanOptions, Key extends KeyTypeForScanOptions<Options>>(
    options?: Options,
  ): ScanResult<Key, Value> {
    return scan(this._dbtx, options, noopOnLimitKey);
  }
}

function scan<
  Options extends ScanOptions,
  Key extends KeyTypeForScanOptions<Options>,
  Value,
>(
  dbRead: db.Read,
  options: Options | undefined,
  onLimitKey: (inclusiveLimitKey: string) => void,
): ScanResult<Key, Value> {
  const scanReader = getScanReader(dbRead, options);
  return makeScanResultWithOnLimitKey(
    scanReader,
    options ?? ({} as Options),
    onLimitKey,
  ) as ScanResult<Key, Value>;
}

class GuardedScanReader<Key extends ScanKey> implements ScanReader<Key> {
  private readonly _readerPromise: Promise<ScanReader<Key>>;
  private readonly _dbRead: {closed: boolean};

  constructor(
    readerPromise: Promise<ScanReader<Key>>,
    dbRead: {closed: boolean},
  ) {
    this._readerPromise = readerPromise;
    this._dbRead = dbRead;
  }

  async seek(key: Key): Promise<void> {
    throwIfClosed(this._dbRead);
    return (await this._readerPromise).seek(key);
  }

  async next(): Promise<
    readonly [key: Key, value: ReadonlyJSONValue] | undefined
  > {
    throwIfClosed(this._dbRead);
    return (await this._readerPromise).next();
  }
}

async function getScanReaderForIndexMap(
  dbRead: db.Read,
  options: ScanIndexOptions,
): Promise<ScanReader<db.IndexKey>> {
  const map = await dbRead.getMapForIndex(options.indexName);
  return new ScanReaderForIndex(await map.scanReader());
}

function getScanReader<
  Options extends ScanOptions,
  Key extends KeyTypeForScanOptions<Options>,
>(dbRead: db.Read, options: Options | undefined): ScanReader<Key> {
  if (options && isScanIndexOptions(options)) {
    return new GuardedScanReader(
      getScanReaderForIndexMap(dbRead, options) as Promise<ScanReader<Key>>,
      dbRead,
    );
  }
  return new GuardedScanReader(
    dbRead.map.scanReader() as Promise<ScanReader<Key>>,
    dbRead,
  );
}

// An implementation of ReadTransaction that keeps track of `keys` and `scans`
// for use with Subscriptions.
export class SubscriptionTransactionWrapper extends ReadTransactionImpl<ReadonlyJSONValue> {
  private readonly _keys: Set<string> = new Set();
  private readonly _scans: ScanSubscriptionInfo[] = [];

  isEmpty(): Promise<boolean> {
    // Any change to the subscription requires rerunning it.
    this._scans.push({options: {}});
    return super.isEmpty();
  }

  get(key: string): Promise<ReadonlyJSONValue | undefined> {
    this._keys.add(key);
    return super.get(key);
  }

  has(key: string): Promise<boolean> {
    this._keys.add(key);
    return super.has(key);
  }

  scan<Options extends ScanOptions, Key extends KeyTypeForScanOptions<Options>>(
    options?: Options,
  ): ScanResult<Key, ReadonlyJSONValue> {
    const scanInfo: ScanSubscriptionInfo = {
      options,
      inclusiveLimitKey: undefined,
    };
    this._scans.push(scanInfo);
    return scan(this._dbtx, options, inclusiveLimitKey => {
      scanInfo.inclusiveLimitKey = inclusiveLimitKey;
    });
  }

  get keys(): ReadonlySet<string> {
    return this._keys;
  }

  get scans(): ScanSubscriptionInfo[] {
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
  // use `declare` to specialize the type.
  protected declare readonly _dbtx: db.Write;

  constructor(
    clientID: string,
    dbWrite: db.Write,
    lc: LogContext,
    rpcName = 'openWriteTransaction',
  ) {
    super(clientID, dbWrite, lc, rpcName);
  }

  async put(key: string, value: JSONValue): Promise<void> {
    throwIfClosed(this._dbtx);
    await this._dbtx.put(this._lc, key, deepClone(value));
  }

  async del(key: string): Promise<boolean> {
    throwIfClosed(this._dbtx);
    return await this._dbtx.del(this._lc, key);
  }

  async commit(
    generateChangedKeys: boolean,
  ): Promise<[Hash, sync.ChangedKeysMap]> {
    const txn = this._dbtx;
    throwIfClosed(txn);

    const headName = txn.isRebase()
      ? sync.SYNC_HEAD_NAME
      : db.DEFAULT_HEAD_NAME;
    return await txn.commitWithChangedKeys(headName, generateChangedKeys);
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
  extends WriteTransactionImpl
  implements IndexTransaction
{
  constructor(clientID: string, dbWrite: db.Write, lc: LogContext) {
    super(clientID, dbWrite, lc, 'openIndexTransaction');
  }

  async createIndex(options: CreateIndexDefinition): Promise<void> {
    throwIfClosed(this._dbtx);
    await this._dbtx.createIndex(
      this._lc,
      options.name,
      options.prefix ?? '',
      options.jsonPointer,
    );
  }

  async dropIndex(name: string): Promise<void> {
    throwIfClosed(this._dbtx);
    await this._dbtx.dropIndex(name);
  }

  async commit(): Promise<[Hash, sync.ChangedKeysMap]> {
    return super.commit(false);
  }
}
