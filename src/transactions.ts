import type {JSONValue, ToJSON} from './json.js';
import type {
  Invoke,
  OpenTransactionRequest,
  CommitTransactionResponse,
} from './repm-invoker.js';
import type {KeyTypeForScanOptions, ScanOptions} from './scan-options.js';
import {ScanResult} from './scan-iterator.js';
import {throwIfClosed} from './transaction-closed-error.js';

/**
 * ReadTransactions are used with `Replicache.query` and allows read operations
 * on the database.
 */
export interface ReadTransaction {
  /**
   * Get a single value from the database. If the key is not present this
   * returns `undefined`.
   */
  get(key: string): Promise<JSONValue | undefined>;

  /**
   * Determines if a single key is present in the database.
   */
  has(key: string): Promise<boolean>;

  /**
   * Gets many values from the database. This returns a `ScanResult` which
   * implements `AsyncIterable`. It also has methods to iterate over the `keys`
   * and `entries`.
   *
   * If `options` has an `indexName`, then this does a scan over an index with
   * that name. A scan over an index uses a tuple for the key consisting of
   * `[secondary: string, primary: string]`.
   *
   * If the `ScanResult` is used after the `ReadTransaction` has been closed it
   * will throw a {@link TransactionClosedError}.
   */
  scan<O extends ScanOptions, K extends KeyTypeForScanOptions<O>>(
    options?: O,
  ): ScanResult<K>;

  /**
   * Convenience form of `scan()` which returns all the entries as an array.
   */
  scanAll<O extends ScanOptions, K extends KeyTypeForScanOptions<O>>(
    options?: O,
  ): Promise<[K, JSONValue][]>;
}

export class ReadTransactionImpl implements ReadTransaction {
  private _transactionId = -1;
  protected readonly _invoke: Invoke;
  protected _closed = false;
  protected readonly _openTransactionName:
    | 'openTransaction'
    | 'openIndexTransaction' = 'openTransaction';

  constructor(invoke: Invoke) {
    this._invoke = invoke;
  }

  async get(key: string): Promise<JSONValue | undefined> {
    throwIfClosed(this);
    const result = await this._invoke('get', {
      transactionId: this._transactionId,
      key,
    });
    if (!result.has) {
      return undefined;
    }
    return JSON.parse(result.value);
  }

  async has(key: string): Promise<boolean> {
    throwIfClosed(this);
    const result = await this._invoke('has', {
      transactionId: this._transactionId,
      key,
    });
    return result['has'];
  }

  scan<O extends ScanOptions, K extends KeyTypeForScanOptions<O>>(
    options?: O,
  ): ScanResult<K> {
    const {prefix = '', startKey, startKeyExclusive, limit, indexName} =
      options || {};
    return new ScanResult(
      prefix,
      startKey,
      startKeyExclusive,
      limit,
      indexName,
      this._invoke,
      () => this,
      false,
    );
  }

  async scanAll<O extends ScanOptions, K extends KeyTypeForScanOptions<O>>(
    options?: O,
  ): Promise<[K, JSONValue][]> {
    type E = [K, JSONValue];
    const it = this.scan(options).entries();
    const result: E[] = [];
    for await (const pair of it) {
      result.push(pair as E);
    }
    return result;
  }

  get id(): number {
    return this._transactionId;
  }

  get closed(): boolean {
    return this._closed;
  }

  async open(args: OpenTransactionRequest): Promise<void> {
    const {transactionId} = await this._invoke(this._openTransactionName, args);
    this._transactionId = transactionId;
  }

  async close(): Promise<void> {
    try {
      this._closed = true;
      await this._invoke('closeTransaction', {
        transactionId: this._transactionId,
      });
    } catch (ex) {
      console.error('Failed to close transaction', ex);
    }
  }
}

/**
 * WriteTransactions are used with `Replicache.register` and allows read and
 * write operations on the database.
 */
export interface WriteTransaction extends ReadTransaction {
  /**
   * Sets a single value in the database. The `value` will be encoded using
   * `JSON.stringify`.
   */
  put(key: string, value: JSONValue | ToJSON): Promise<void>;

  /**
   * Removes a key and its value from the database. Returns true if there was a
   * key to remove.
   */
  del(key: string): Promise<boolean>;
}

export class WriteTransactionImpl
  extends ReadTransactionImpl
  implements WriteTransaction {
  async put(key: string, value: JSONValue | ToJSON): Promise<void> {
    throwIfClosed(this);
    await this._invoke('put', {
      transactionId: this.id,
      key,
      value: JSON.stringify(value),
    });
  }

  async del(key: string): Promise<boolean> {
    throwIfClosed(this);
    const result = await this._invoke('del', {
      transactionId: this.id,
      key,
    });
    return result.ok;
  }

  async commit(): Promise<CommitTransactionResponse> {
    this._closed = true;
    return await this._invoke('commitTransaction', {
      transactionId: this.id,
    });
  }
}

export interface IndexTransaction extends ReadTransaction {
  /**
   * Creates a persistent secondary index in Replicache which can be used with scan.
   *
   * If the named index already exists with the same definition this returns success
   * immediately. If the named index already exists, but with a different definition
   * an error is returned.
   */
  createIndex({
    name,
    keyPrefix,
    jsonPointer,
  }: CreateIndexOptions): Promise<void>;

  /**
   * Drops an index previously created with {@link createIndex}.
   */
  dropIndex(name: string): Promise<void>;
}

interface CreateIndexOptions {
  name: string;
  keyPrefix?: string;
  jsonPointer: string;
}

export class IndexTransactionImpl
  extends ReadTransactionImpl
  implements IndexTransaction {
  protected readonly _openTransactionName = 'openIndexTransaction';

  async createIndex(options: CreateIndexOptions): Promise<void> {
    throwIfClosed(this);
    await this._invoke('createIndex', {
      transactionId: this.id,
      name: options.name,
      keyPrefix: options.keyPrefix || '',
      jsonPointer: options.jsonPointer,
    });
  }

  async dropIndex(name: string): Promise<void> {
    throwIfClosed(this);
    await this._invoke('dropIndex', {
      transactionId: this.id,
      name,
    });
  }

  async commit(): Promise<CommitTransactionResponse> {
    this._closed = true;
    return await this._invoke('commitTransaction', {
      transactionId: this.id,
    });
  }
}
