import type {ScanItem} from './scan-item.js';
import type {Invoke, ScanRequest} from './repm-invoker.js';
import type {JSONValue} from './json.js';
import {throwIfClosed} from './transaction-closed-error.js';

interface IdCloser {
  close(): void;
  closed: boolean;
  id: number;
}

type ScanIterableKind = 'key' | 'value' | 'entry';

/**
 * An async iterator that is used with {@link ReadTransaction.scan}.
 */
class ScanIterator<V> implements AsyncIterableIterator<V> {
  private readonly _scanItems: ScanItem[] = [];
  private _current = 0;
  private readonly _prefix: string;
  private readonly _kind: ScanIterableKind;
  private readonly _startKey?: string;
  private readonly _startKeyExclusive?: boolean;
  private readonly _limit?: number;
  private readonly _indexName?: string;
  private _loadPromise?: Promise<unknown> = undefined;
  private readonly _getTransaction: () => Promise<IdCloser> | IdCloser;
  private readonly _shouldCloseTransaction: boolean;
  private _transaction?: IdCloser = undefined;
  private readonly _invoke: Invoke;

  constructor(
    kind: ScanIterableKind,
    prefix: string,
    startKey: string | undefined,
    startKeyExclusive: boolean | undefined,
    limit: number | undefined,
    indexName: string | undefined,
    invoke: Invoke,
    getTransaction: () => Promise<IdCloser> | IdCloser,
    shouldCloseTranscation: boolean,
  ) {
    this._kind = kind;
    this._prefix = prefix;
    this._startKey = startKey;
    this._startKeyExclusive = startKeyExclusive;
    this._limit = limit;
    this._indexName = indexName;
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

    await this._load();

    if (this._current >= this._scanItems.length) {
      return this.return();
    }

    const entry = this._scanItems[this._current++];
    if (this._kind === 'value') {
      return {value: entry.value} as IteratorResult<V>;
    }
    const key =
      this._indexName !== undefined
        ? [entry.secondaryKey, entry.primaryKey]
        : entry.primaryKey;
    switch (this._kind) {
      case 'key':
        return {value: key} as IteratorResult<V>;
      case 'entry':
        return {value: [key, entry.value]} as IteratorResult<V>;
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
      await this._loadPromise;
      return;
    }

    if (!this._transaction) {
      this._transaction = await this._getTransaction();
    }

    const responseItems: ScanItem[] = [];
    const decoder = new TextDecoder();
    const receiver = (
      primaryKey: string,
      secondaryKey: string | null,
      value: Uint8Array,
    ) => {
      const text = decoder.decode(value);
      responseItems.push({
        primaryKey,
        secondaryKey,
        value: JSON.parse(text),
      });
    };
    const args: ScanRequest = {
      transactionId: this._transaction.id,
      opts: {
        prefix: this._prefix,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        start_key: this._startKey,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        start_key_exclusive: this._startKeyExclusive,
        limit: this._limit,
        indexName: this._indexName,
      },
      receiver,
    };
    this._loadPromise = this._invoke('scan', args);
    await this._loadPromise;

    this._scanItems.push(...responseItems);
  }
}

type Args = [
  prefix: string,
  startKey: string | undefined,
  startKeyExclusive: boolean | undefined,
  limit: number | undefined,
  indexName: string | undefined,
  invoke: Invoke,
  getTransaction: () => Promise<IdCloser> | IdCloser,
  shouldCloseTranscation: boolean,
];

export class ScanResult<K> implements AsyncIterable<JSONValue> {
  private readonly _args: Args;

  constructor(...args: Args) {
    this._args = args;
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<JSONValue> {
    return this.values();
  }

  values(): AsyncIterableIterator<JSONValue> {
    return this._newIterator('value');
  }

  keys(): AsyncIterableIterator<K> {
    return this._newIterator('key');
  }

  entries(): AsyncIterableIterator<[K, JSONValue]> {
    return this._newIterator('entry');
  }

  private _newIterator<V>(kind: ScanIterableKind): AsyncIterableIterator<V> {
    return new ScanIterator<V>(kind, ...this._args);
  }
}
