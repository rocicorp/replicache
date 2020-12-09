import init, {dispatch} from './wasm/release/replicache_client.js';
import type {InvokeMap, REPMInvoke} from './repm-invoker';

let wasmModuleOutput: Promise<unknown> | undefined;

export type InitInput =
  | RequestInfo
  | URL
  | Response
  | BufferSource
  | WebAssembly.Module;

export class REPMWasmInvoker {
  constructor(wasmModuleOrPath?: InitInput) {
    if (!wasmModuleOutput) {
      if (!wasmModuleOrPath) {
        // This lives on the worker thread and we expect this file to be located
        // next to the wasm file.
        wasmModuleOrPath = new URL('./replicache.wasm', location.href);
      }
      wasmModuleOutput = init(wasmModuleOrPath);
    }
  }

  invoke: REPMInvoke = async <K extends keyof InvokeMap>(
    dbName: string,
    rpc: K,
    args: InvokeMap[K][0] = {},
  ): Promise<InvokeMap[K][1]> => {
    await wasmModuleOutput;
    return dispatch(dbName, rpc, args);
  };
}
