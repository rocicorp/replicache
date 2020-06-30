import {TransactionClosedError} from './transaction-closed-error.js';
import type {ScanItem} from './scan-item.js';
import type {ScanBound} from './scan-bound.js';
import type {Invoke} from './repm-invoker.js';
import type {JSONValue} from './json.js';

export let scanPageSize = 100;

export function setScanPageSizeForTesting(n: number): void {
  scanPageSize = n;
}

export function restoreScanPageSizeForTesting(): void {
  scanPageSize = 100;
}

interface IdCloser {
  close(): void;
  closed: boolean;
  id: number;
}

export type ScanIterableKind = 'key' | 'value' | 'entry';

export class ScanIterator<V> implements AsyncIterableIterator<V> {
  private readonly _scanItems: ScanItem[] = [];
  private _current = 0;
  private _moreItemsToLoad = true;
  private readonly _prefix: string;
  private readonly _kind: ScanIterableKind;
  private readonly _start?: ScanBound;
  private _loadPromise?: Promise<void> = undefined;
  private readonly _getTransaction: () => Promise<IdCloser> | IdCloser;
  private readonly _shouldCloseTransaction: boolean;
  private _transaction?: IdCloser = undefined;
  private readonly _invoke: Invoke;

  constructor(
    kind: ScanIterableKind,
    prefix: string,
    start: ScanBound | undefined,
    invoke: Invoke,
    getTransaction: () => Promise<IdCloser> | IdCloser,
    shouldCloseTranscation: boolean,
  ) {
    this._kind = kind;
    this._prefix = prefix;
    this._start = start;
    this._invoke = invoke;
    this._getTransaction = getTransaction;
    this._shouldCloseTransaction = shouldCloseTranscation;
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<V> {
    return this;
  }

  private async _isClosed(): Promise<boolean> {
    if (!this._transaction) {
      this._transaction = await this._getTransaction();
    }
    return this._transaction.closed;
  }

  async next(): Promise<IteratorResult<V>> {
    if (await this._isClosed()) {
      throw new TransactionClosedError();
    }

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
    if (await this._isClosed()) {
      throw new TransactionClosedError();
    }

    if (this._shouldCloseTransaction && this._transaction) {
      this._transaction.close();
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

    if (!this._transaction) {
      this._transaction = await this._getTransaction();
    }

    const scanItems = await this._invoke('scan', {
      transactionId: this._transaction.id,
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

export class ScanResult implements AsyncIterable<JSONValue> {
  private readonly _args: [
    string,
    ScanBound | undefined,
    Invoke,
    () => Promise<IdCloser> | IdCloser,
    boolean,
  ];

  constructor(
    ...args: [
      string,
      ScanBound | undefined,
      Invoke,
      () => Promise<IdCloser> | IdCloser,
      boolean,
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
