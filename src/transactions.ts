import type {JSONValue, ToJSON} from './json.js';
import type {ScanItem} from './scan-item.js';
import type {ScanOptions} from './scan-options.js';
import type {Invoke, ScanRequest} from './repm-invoker.js';

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
   * Gets many values from the database.
   */
  scan(options?: ScanOptions): AsyncIterable<ScanItem>;
}

export class ReadTransactionImpl implements ReadTransaction {
  protected readonly _transactionId: number;
  protected readonly _invoke: Invoke;

  constructor(invoke: Invoke, transactionId: number) {
    this._invoke = invoke;
    this._transactionId = transactionId;
  }

  async get(key: string): Promise<JSONValue | undefined> {
    const result = await this._invoke('get', {
      transactionId: this._transactionId,
      key: key,
    });
    if (!result.has) {
      return undefined;
    }
    return result.value;
  }

  async has(key: string): Promise<boolean> {
    const result = await this._invoke('has', {
      transactionId: this._transactionId,
      key: key,
    });
    return result['has'];
  }

  async *scan({
    prefix = '',
    start,
    limit = 50,
  }: ScanOptions = {}): AsyncIterable<ScanItem> {
    const args: ScanRequest = {
      transactionId: this._transactionId,
      limit: limit,
    };
    if (prefix !== undefined) {
      args.prefix = prefix;
    }
    if (start !== undefined) {
      args.start = start;
    }
    const scanItems = await this._invoke('scan', args);
    for (const scanItem of scanItems) {
      yield scanItem;
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
    await this._invoke('put', {
      transactionId: this._transactionId,
      key: key,
      value: value,
    });
  }

  async del(key: string): Promise<boolean> {
    const result = await this._invoke('del', {
      transactionId: this._transactionId,
      key: key,
    });
    return result['ok'];
  }
}
