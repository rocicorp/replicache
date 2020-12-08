import type {Invoke, ScanRequest} from './repm-invoker.js';
import type {JSONValue} from './json.js';
import {throwIfClosed} from './transaction-closed-error.js';
import {ScanOptions, toRPC} from './scan-options.js';

interface IdCloser {
  close(): void;
  closed: boolean;
  id: number;
}

type ScanIterableKind = 'key' | 'value' | 'entry';

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
    return this._newIterator('value');
  }

  keys(): AsyncIterableIterator<K> {
    return this._newIterator('key');
  }

  entries(): AsyncIterableIterator<[K, JSONValue]> {
    return this._newIterator('entry');
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
    start: c => {
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
      case 'value':
        controller.enqueue(parse(value));
        return;
      case 'key':
        controller.enqueue((key(primaryKey, secondaryKey) as unknown) as V);
        return;
      case 'entry':
        controller.enqueue(([
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
  try {
    await invoke('scan', args);
  } catch (ex) {
    // Scan can fail if no such index (for example). We still need to close the stream.
    controller.error(ex);
    return;
  }

  controller.close();
}
