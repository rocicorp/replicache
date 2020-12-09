import type {JSONValue} from './json.js';
import type {
  InvokeMapRPC,
  ScanRequest,
  ScanRequestRPC,
  ScanResponseRPC,
} from './repm-invoker.js';
import {REPMWasmInvoker} from './repm-wasm-invoker.js';
import type {ScanItem} from './scan-item.js';
import type {RPCRequest, RPCResponse} from './worker-rpc.js';

/* eslint-env serviceworker */

let wasmInvoker: REPMWasmInvoker | undefined;

function isReplicacheRPCMessage(
  e: MessageEvent<unknown>,
): e is MessageEvent<RPCRequest<never>> {
  const {data} = e;
  return (
    Array.isArray(data) &&
    data.length === 3 &&
    typeof data[0] === 'string' &&
    typeof data[1] === 'string'
  );
}

async function onMessage<K extends keyof InvokeMapRPC>(
  e: MessageEvent<unknown>,
) {
  if (!isReplicacheRPCMessage(e)) {
    return;
  }

  let response: RPCResponse<K>;
  try {
    const result = await onMessageInner<K>(e);
    response = [1, result];
  } catch (err) {
    response = [0, String(err)];
  }
  e.ports[0].postMessage(response);
}

const DB_NAME = 0;
const RPC = 1;
const ARGS = 2;

async function onMessageInner<K extends keyof InvokeMapRPC>(
  e: MessageEvent<RPCRequest<K>>,
): Promise<JSONValue | ScanItem<Uint8Array>[]> {
  const {data} = e;
  if (data[RPC] === 'initWorker') {
    if (!wasmInvoker) {
      wasmInvoker = new REPMWasmInvoker(
        (data as RPCRequest<'initWorker'>)[ARGS],
      );
    }
    return Promise.resolve(null);
  }

  if (!wasmInvoker) {
    return Promise.reject('not initialized');
  }

  const dbName = data[DB_NAME];
  const rpc = data[RPC];
  const args = data[ARGS];

  if (rpc === 'scan') {
    const responseItems: ScanResponseRPC = [];

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

    const wasmArgs: ScanRequest = {
      transactionId: (args as ScanRequestRPC).transactionId,
      opts: (args as ScanRequestRPC).opts,
      receiver,
    };

    await wasmInvoker.invoke(dbName, rpc as 'scan', wasmArgs);
    return responseItems;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return wasmInvoker.invoke(dbName, rpc as any, args as any);
}

const swGlobal = (self as unknown) as ServiceWorkerGlobalScope;

swGlobal.oninstall = e => {
  e.waitUntil(swGlobal.skipWaiting()); // Activate worker immediately
};

swGlobal.onactivate = e => {
  e.waitUntil(swGlobal.clients.claim()); // Become available to all pages
};

self.onmessage = onMessage;
