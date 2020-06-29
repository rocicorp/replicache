import type {JSONValue, ToJSON} from './json.js';
import type {ScanItem} from './scan-item.js';
import type {Invoke} from './repm-invoker.js';
import type {ScanBound} from './scan-bound.js';
import type {ScanOptions} from './scan-options.js';

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
  scan(options?: ScanOptions): ScanResult;
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
      key,
    });
    if (!result.has) {
      return undefined;
    }
    return result.value;
  }

  async has(key: string): Promise<boolean> {
    const result = await this._invoke('has', {
      transactionId: this._transactionId,
      key,
    });
    return result['has'];
  }

  scan({prefix = '', start}: ScanOptions = {}): ScanResult {
    return new ScanResult(
      prefix,
      start,
      this._invoke,
      () => this._transactionId,
      undefined,
    );
  }
}

let scanPageSize = 100;

export function setScanPageSizeForTesting(n: number): void {
  scanPageSize = n;
}

export function restoreScanPageSizeForTesting(): void {
  scanPageSize = 100;
}

export class ScanResult implements AsyncIterable<JSONValue> {
  private readonly _args: [
    string,
    ScanBound | undefined,
    Invoke,
    () => Promise<number> | number,
    ((txId: number) => Promise<void>) | undefined,
  ];

  constructor(
    ...args: [
      string,
      ScanBound | undefined,
      Invoke,
      () => Promise<number> | number,
      ((txId: number) => Promise<void>) | undefined,
    ]
  ) {
    this._args = args;
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<JSONValue> {
    return this.values();
  }

  values(): AsyncIterableIterator<JSONValue> {
    return this._newIterator('value');
  }

  keys(): AsyncIterableIterator<string> {
    return this._newIterator('key');
  }

  entries(): AsyncIterableIterator<[string, JSONValue]> {
    return this._newIterator('entry');
  }

  private _newIterator<V>(kind: ScanIterableKind): AsyncIterableIterator<V> {
    return new ScanIterator<V>(kind, ...this._args);
  }
}

type ScanIterableKind = 'key' | 'value' | 'entry';

class ScanIterator<V> implements AsyncIterableIterator<V> {
  private readonly _scanItems: ScanItem[] = [];
  private _current = 0;
  private _moreItemsToLoad = true;
  private readonly _prefix: string;
  private readonly _kind: ScanIterableKind;
  private readonly _start?: ScanBound;
  private _loadPromise?: Promise<void> = undefined;
  private readonly _openTransaction: () => Promise<number> | number;
  private readonly _closeTransaction?: (txId: number) => Promise<void>;
  private _transactionId?: number = undefined;
  private readonly _invoke: Invoke;

  constructor(
    kind: ScanIterableKind,
    prefix: string,
    start: ScanBound | undefined,
    invoke: Invoke,
    openTransaction: () => Promise<number> | number,
    closeTransaction: ((txId: number) => Promise<void>) | undefined,
  ) {
    this._kind = kind;
    this._prefix = prefix;
    this._start = start;
    this._invoke = invoke;
    this._openTransaction = openTransaction;
    this._closeTransaction = closeTransaction;
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<V> {
    return this;
  }

  async next(): Promise<IteratorResult<V>> {
    // Preload if we have less than half a page left.
    if (this._current + scanPageSize / 2 >= this._scanItems.length) {
      if (this._moreItemsToLoad) {
        // no await
        this._loadPromise = this._load();
      }
    }
    if (this._current >= this._scanItems.length) {
      if (!this._moreItemsToLoad) {
        return {done: true, value: undefined};
      }
      this._loadPromise = this._load();
      await this._loadPromise;
      this._loadPromise = undefined;
      return this.next();
    }
    const value = this._scanItems[this._current++];

    switch (this._kind) {
      case 'value':
        return {value: value.value} as IteratorResult<V>;
      case 'key':
        return {value: value.key} as IteratorResult<V>;
      case 'entry':
        return {value: [value.key, value.value]} as IteratorResult<V>;
    }
  }

  async return(): Promise<IteratorResult<V>> {
    if (this._closeTransaction && this._transactionId !== undefined) {
      await this._closeTransaction(this._transactionId);
    }
    return {done: true, value: undefined};
  }

  private async _load(): Promise<void> {
    if (this._loadPromise) {
      return this._loadPromise;
    }

    if (!this._moreItemsToLoad) {
      throw new Error('No more items to load');
    }

    let start = this._start;
    if (this._scanItems.length > 0) {
      // We loaded some items already, so continue where we left off.
      start = {
        id: {
          value: this._scanItems[this._scanItems.length - 1].key,
          exclusive: true,
        },
      };
    }

    if (this._transactionId === undefined) {
      this._transactionId = await this._openTransaction();
    }

    const scanItems = await this._invoke('scan', {
      transactionId: this._transactionId,
      prefix: this._prefix,
      start,
      limit: scanPageSize,
    });
    if (scanItems.length !== scanPageSize) {
      this._moreItemsToLoad = false;
    }
    this._scanItems.push(...scanItems);
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
      key,
      value,
    });
  }

  async del(key: string): Promise<boolean> {
    const result = await this._invoke('del', {
      transactionId: this._transactionId,
      key,
    });
    return result.ok;
  }
}
