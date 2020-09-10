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
  scan(options?: ScanOptions): ScanResult;
}

export function throwIfClosed(tx: {closed: boolean}): void {
  if (tx.closed) {
    throw new TransactionClosedError();
  }
}

export class ReadTransactionImpl implements ReadTransaction {
  private _transactionId = -1;
  protected readonly _isWASM: boolean;
  protected readonly _invoke: Invoke;
  protected _closed = false;

  constructor(isWASM: boolean, invoke: Invoke) {
    this._isWASM = isWASM;
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
    return this._isWASM ? JSON.parse(result.value as string) : result.value;
  }

  async has(key: string): Promise<boolean> {
    throwIfClosed(this);
    const result = await this._invoke('has', {
      transactionId: this._transactionId,
      key,
    });
    return result['has'];
  }

  scan({prefix = '', start}: ScanOptions = {}): ScanResult {
    return new ScanResult(
      this._isWASM,
      prefix,
      start,
      this._invoke,
      () => this,
      false,
    );
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
}

export class WriteTransactionImpl extends ReadTransactionImpl
  implements WriteTransaction {
  async put(key: string, value: JSONValue | ToJSON): Promise<void> {
    throwIfClosed(this);
    await this._invoke('put', {
      transactionId: this.id,
      key,
      value: this._isWASM ? JSON.stringify(value) : value,
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
    const commitRes = await this._invoke('commitTransaction', {
      transactionId: this.id,
    });
    return commitRes;
  }
}
