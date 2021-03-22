import {Invoke, RPC, ScanRequest} from './repm-invoker.js';
import type {JSONValue} from './json.js';
import {throwIfClosed} from './transaction-closed-error.js';
import {ScanOptions, toRPC} from './scan-options.js';

interface IdCloser {
  close(): void;
  closed: boolean;
  id: number;
}

const VALUE = 0;
const KEY = 1;
const ENTRY = 2;
type ScanIterableKind = typeof VALUE | typeof KEY | typeof ENTRY;

type Args = [
  options: ScanOptions | undefined,
  invoke: Invoke,
  getTransaction: () => Promise<IdCloser> | IdCloser,
  shouldCloseTransaction: boolean,
];

/**
 * This class is used for the results of [[ReadTransaction.scan|scan]]. It
 * implements `AsyncIterable<JSONValue>` which allows you to use it in a `for
 * await` loop. There are also methods to iterate over the [[keys]],
 * [[entries]] or [[values]].
 */
export class ScanResult<K> implements AsyncIterable<JSONValue> {
  private readonly _args: Args;

  /** @internal */
  constructor(...args: Args) {
    this._args = args;
  }

  /** The default AsyncIterable. This is the same as [[values]]. */
  [Symbol.asyncIterator](): AsyncIterableIterator<JSONValue> {
    return this.values();
  }

  /** Async iterator over the valus of the [[ReadTransaction.scan|scan]] call. */
  values(): AsyncIterableIterator<JSONValue> {
    return this._newIterator(VALUE);
  }

  /**
   * Async iterator over the keys of the [[ReadTransaction.scan|scan]]
   * call. If the [[ReadTransaction.scan|scan]] is over an index the key
   * is a tuple of `[secondaryKey: string, primaryKey]`
   */
  keys(): AsyncIterableIterator<K> {
    return this._newIterator(KEY);
  }

  /**
   * Async iterator over the entries of the [[ReadTransaction.scan|scan]]
   * call. An entry is a tuple of key values. If the
   * [[ReadTransaction.scan|scan]] is over an index the key is a tuple of
   * `[secondaryKey: string, primaryKey]`
   */
  entries(): AsyncIterableIterator<[K, JSONValue]> {
    return this._newIterator(ENTRY);
  }

  private _newIterator<V>(kind: ScanIterableKind): AsyncIterableIterator<V> {
    return scanIterator(kind, ...this._args);
  }
}

async function* scanIterator<V>(
  kind: ScanIterableKind,
  options: ScanOptions | undefined,
  invoke: Invoke,
  getTransaction: () => Promise<IdCloser> | IdCloser,
  shouldCloseTransaction: boolean,
): AsyncGenerator<V> {
  const transaction = await getTransaction();
  throwIfClosed(transaction);

  const items = await load<V>(kind, options, transaction.id, invoke);

  try {
    for (const item of items) {
      yield item;
    }
  } finally {
    if (shouldCloseTransaction && !transaction.closed) {
      transaction.close();
    }
  }
}

async function load<V>(
  kind: ScanIterableKind,
  options: ScanOptions | undefined,
  transactionID: number,
  invoke: Invoke,
): Promise<V[]> {
  const items: V[] = [];
  const decoder = new TextDecoder();
  const parse = (v: Uint8Array) => JSON.parse(decoder.decode(v));
  type MaybeIndexName = {indexName?: string};
  const key = (primaryKey: string, secondaryKey: string | null) =>
    (options as MaybeIndexName)?.indexName !== undefined
      ? [secondaryKey, primaryKey]
      : primaryKey;

  const receiver = (
    primaryKey: string,
    secondaryKey: string | null,
    value: Uint8Array,
  ) => {
    switch (kind) {
      case VALUE:
        items.push(parse(value));
        return;
      case KEY:
        items.push((key(primaryKey, secondaryKey) as unknown) as V);
        return;
      case ENTRY:
        items.push(([
          key(primaryKey, secondaryKey),
          parse(value),
        ] as unknown) as V);
    }
  };

  const args: ScanRequest = {
    transactionId: transactionID,
    opts: toRPC(options),
    receiver,
  };

  await invoke(RPC.Scan, args);

  return items;
}
