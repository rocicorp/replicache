import type {InvokeMapRPC} from './repm-invoker.js';
import type {Result} from './worker-util.js';

export type RPCRequest<K extends keyof InvokeMapRPC> = [
  dbName: string,
  rpc: K,
  args: InvokeMapRPC[K][0],
];

export type RPCResponse<K extends keyof InvokeMapRPC> = Result<
  InvokeMapRPC[K][1]
>;
