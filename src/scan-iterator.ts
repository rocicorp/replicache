import type {Invoke, ScanRequestRPC, ScanResponseRPC} from './repm-invoker.js';
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
    return this._newIterator(VALUE);
  }

  keys(): AsyncIterableIterator<K> {
    return this._newIterator(KEY);
  }

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
  shouldCloseTranscation: boolean,
): AsyncGenerator<V> {
  const transaction = await getTransaction();
  throwIfClosed(transaction);

  let controller!: ReadableStreamDefaultController<V>;
  const stream = new ReadableStream({
    start(c: ReadableStreamDefaultController<V>) {
      controller = c;
    },
  });
  const reader: ReadableStreamDefaultReader<V> = stream.getReader();

  // No await. We want the loading to happen in the background. load
  // communicates with this function using controller.
  load(kind, options, transaction.id, controller, invoke);

  try {
    while (true) {
      const res = await reader.read();
      if (res.done) {
        break;
      }
      yield res.value;
    }
  } finally {
    if (shouldCloseTranscation && !transaction.closed) {
      transaction.close();
    }
  }
}

async function load<V>(
  kind: ScanIterableKind,
  options: ScanOptions | undefined,
  transactionID: number,
  controller: ReadableStreamDefaultController<V>,
  invoke: Invoke,
) {
  type MaybeIndexName = {indexName?: string};
  const key = (primaryKey: string, secondaryKey: string | null) =>
    (options as MaybeIndexName)?.indexName !== undefined
      ? [secondaryKey, primaryKey]
      : primaryKey;

  const receiver = (
    primaryKey: string,
    secondaryKey: string | null,
    value: JSONValue,
  ) => {
    switch (kind) {
      case VALUE:
        controller.enqueue((value as unknown) as V);
        return;
      case KEY:
        controller.enqueue((key(primaryKey, secondaryKey) as unknown) as V);
        return;
      case ENTRY:
        controller.enqueue(([
          key(primaryKey, secondaryKey),
          value,
        ] as unknown) as V);
    }
  };

  const args: ScanRequestRPC = {
    transactionId: transactionID,
    opts: toRPC(options),
  };
  try {
    const res = ((await invoke(
      'scan',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args as any,
    )) as unknown) as ScanResponseRPC;
    for (const item of res) {
      receiver(item.primaryKey, item.secondaryKey, item.value);
    }
  } catch (ex) {
    // Signal erros to the reader read loop.
    controller.error(ex);
    return;
  }

  controller.close();
}
