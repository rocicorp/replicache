import type {ScanItem} from './scan-item.js';
import type {ScanBound} from './scan-bound.js';
import type {Invoke} from './repm-invoker.js';
import type {JSONValue} from './json.js';
import {throwIfClosed} from './transactions.js';

const defaultScanSize = 500;
export let scanPageSize = defaultScanSize;

export function setScanPageSizeForTesting(n: number): void {
  scanPageSize = n;
}

export function restoreScanPageSizeForTesting(): void {
  scanPageSize = defaultScanSize;
}

interface IdCloser {
  close(): void;
  closed: boolean;
  id: number;
}

export type ScanIterableKind = 'key' | 'value' | 'entry';

/**
 * An async iterator that is used with {@link ReadTransaction.scan}.
 */
export class ScanIterator<V> implements AsyncIterableIterator<V> {
  private readonly _isWASM: boolean;
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
    isWASM: boolean,
    kind: ScanIterableKind,
    prefix: string,
    start: ScanBound | undefined,
    invoke: Invoke,
    getTransaction: () => Promise<IdCloser> | IdCloser,
    shouldCloseTranscation: boolean,
  ) {
    this._isWASM = isWASM;
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

  private async _ensureTransaction(): Promise<IdCloser> {
    if (!this._transaction) {
      this._transaction = await this._getTransaction();
    }
    return this._transaction;
  }

  async next(): Promise<IteratorResult<V>> {
    throwIfClosed(await this._ensureTransaction());

    // Preload if we have less than half a page left.
    if (this._current + scanPageSize / 2 >= this._scanItems.length) {
      if (this._moreItemsToLoad) {
        // no await
        this._loadPromise = this._load();
      }
    }
    if (this._current >= this._scanItems.length) {
      if (!this._moreItemsToLoad) {
        return this.return();
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
    if (this._transaction) {
      throwIfClosed(this._transaction);
      if (this._shouldCloseTransaction) {
        this._transaction.close();
      }
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

    const opts = {
      prefix: this._prefix,
      start,
      limit: scanPageSize,
    };
    const args = {
      transactionId: this._transaction.id,
      ...(this._isWASM ? {opts} : opts),
    };
    const response = await this._invoke('scan', args);
    // TODO(repc-switchover): only the !array path is needed for repc.
    const scanItems = Array.isArray(response) ? response : response.items;
    if (scanItems.length !== scanPageSize) {
      this._moreItemsToLoad = false;
    }
    if (this._isWASM) {
      for (const item of scanItems) {
        // Temporarily circument the readonly-ness of item.value to parse.
        (item as any).value = JSON.parse(item.value as string); // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    }
    this._scanItems.push(...scanItems);
  }
}

export class ScanResult implements AsyncIterable<JSONValue> {
  private readonly _isWASM: boolean;
  private readonly _args: [
    string,
    ScanBound | undefined,
    Invoke,
    () => Promise<IdCloser> | IdCloser,
    boolean,
  ];

  constructor(
    isWASM: boolean,
    ...args: [
      string,
      ScanBound | undefined,
      Invoke,
      () => Promise<IdCloser> | IdCloser,
      boolean,
    ]
  ) {
    this._isWASM = isWASM;
    this._args = args;
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<JSONValue> {
    return this.values();
  }

  values(): AsyncIterableIterator<JSONValue> {
    return this._newIterator(this._isWASM, 'value');
  }

  keys(): AsyncIterableIterator<string> {
    return this._newIterator(this._isWASM, 'key');
  }

  entries(): AsyncIterableIterator<[string, JSONValue]> {
    return this._newIterator(this._isWASM, 'entry');
  }

  private _newIterator<V>(isWASM: boolean, kind: ScanIterableKind): AsyncIterableIterator<V> {
    return new ScanIterator<V>(isWASM, kind, ...this._args);
  }
}
