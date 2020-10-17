import type {JSONValue, ToJSON} from './json.js';
import type {
  Invoke,
  OpenTransactionRequest,
  CommitTransactionResponse,
} from './repm-invoker.js';
import type {ScanOptions} from './scan-options.js';
import {ScanResult} from './scan-iterator.js';
import {TransactionClosedError} from './transaction-closed-error.js';

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
   * It the `ScanResult` is used after the `ReadTransaction` has been closed it
   * will throw a {@link TransactionClosedError}.
   */
  scan({prefix, start, limit, indexName}?: ScanOptions): ScanResult;

  /**
   * Convenience for scan() that reads all results into an array.
   */
  scanAll(options?: ScanOptions): Promise<[string, JSONValue][]>;
}

export function throwIfClosed(tx: {closed: boolean}): void {
  if (tx.closed) {
    throw new TransactionClosedError();
  }
}

export class ReadTransactionImpl implements ReadTransaction {
  private _transactionId = -1;
  protected readonly _invoke: Invoke;
  protected _closed = false;

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

  scan({prefix = '', start, indexName}: ScanOptions = {}): ScanResult {
    return new ScanResult(
      prefix,
      start,
      indexName,
      this._invoke,
      () => this,
      false,
    );
  }

  async scanAll(options: ScanOptions = {}): Promise<[string, JSONValue][]> {
    const it = this.scan(options).entries();
    const result = [];
    for await (const pair of it) {
      result.push(pair);
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
    const {transactionId} = await this._invoke('openTransaction', args);
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
   * @param name
   */
  dropIndex(name: string): Promise<void>;
}

interface CreateIndexOptions {
  name: string;
  keyPrefix?: string;
  jsonPointer: string;
}

export class WriteTransactionImpl extends ReadTransactionImpl
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
      name: name,
    });
  }

  async commit(): Promise<CommitTransactionResponse> {
    this._closed = true;
    const commitRes = await this._invoke('commitTransaction', {
      transactionId: this.id,
    });
    return commitRes;
  }
}
