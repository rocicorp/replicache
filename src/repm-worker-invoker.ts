import {
  getWorker as getWorkerImpl,
  PostMessage,
  sendMessage,
} from './worker-util.js';
import type {InvokeMap, REPMInvoke} from './repm-invoker.js';
import type {RPCRequest} from './worker-rpc.js';
import type {InitInput} from './repm-wasm-invoker.js';

let worker: PostMessage | undefined;

async function getWorker(wasmModuleOrPath?: InitInput): Promise<PostMessage> {
  if (worker) {
    return worker;
  }

  worker = await getWorkerImpl();

  await sendMessage(worker, ['', 'initWorker', wasmModuleOrPath]);
  return worker;
}

export class REPMWorkerInvoker {
  private _serviceWorker: Promise<PostMessage>;

  constructor(wasmModuleOrPath?: InitInput) {
    this._serviceWorker = getWorker(wasmModuleOrPath);
  }

  invoke: REPMInvoke = async <K extends keyof InvokeMap>(
    dbName: string,
    rpc: K,
    args: InvokeMap[K][0] = {},
  ): Promise<InvokeMap[K][1]> => {
    const serviceWorker = await this._serviceWorker;
    return sendMessage(serviceWorker, [dbName, rpc, args] as RPCRequest<K>);
  };
}
