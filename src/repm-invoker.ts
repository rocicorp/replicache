import type {JSONValue} from './json.js';
import type {ScanOptionsRPC} from './scan-options.js';
import init, {dispatch} from './wasm/release/replicache_client.js';
import type {InitOutput} from './wasm/release/replicache_client.js';

/**
 * This type is used for the [[ReplicacheOptions.wasmModule]] property.
 */
export type InitInput =
  | string
  | RequestInfo
  | URL
  | Response
  | BufferSource
  | WebAssembly.Module;

export type Invoker = {
  readonly invoke: REPMInvoke;
};

export interface Invoke {
  <RPC extends keyof InvokeMapNoArgs>(rpc: RPC): Promise<InvokeMapNoArgs[RPC]>;
  <RPC extends keyof InvokeMap>(rpc: RPC, args: InvokeMap[RPC][0]): Promise<
    InvokeMap[RPC][1]
  >;
  (rpc: string, args?: JSONValue): Promise<JSONValue>;
}

export interface REPMInvoke {
  <RPC extends keyof InvokeMapNoArgs>(dbName: string, rpc: RPC): Promise<
    InvokeMapNoArgs[RPC]
  >;
  <RPC extends keyof InvokeMap>(
    dbName: string,
    rpc: RPC,
    args: InvokeMap[RPC][0],
  ): Promise<InvokeMap[RPC][1]>;
  (dbName: string, rpc: string, args?: JSONValue): Promise<JSONValue>;
}

let wasmModuleOutput: Promise<InitOutput> | undefined;

export class REPMWasmInvoker {
  constructor(wasmModuleOrPath?: InitInput) {
    if (!wasmModuleOutput) {
      // Hack around Webpack invalid support for import.meta.url and wasm
      // loaders. We use the new URL pattern to tell Webpack to use a runtime
      // URL and not a compile time file: URL.
      if (!wasmModuleOrPath) {
        wasmModuleOrPath = new URL(
          './wasm/release/replicache_client_bg.wasm',
          import.meta.url,
        );
      }
      wasmModuleOutput = init(wasmModuleOrPath);
    }
  }

  invoke: REPMInvoke = async (
    dbName: string,
    rpc: string,
    args: JSONValue = {},
  ): Promise<JSONValue> => {
    await wasmModuleOutput;
    return await dispatch(dbName, rpc, args);
  };
}

type GetRequest = TransactionRequest & {
  key: string;
};
type GetResponse = {
  has?: boolean;
  value: string;
};

type HasRequest = TransactionRequest & {
  key: string;
};
type HasResponse = {
  has: boolean;
};

type TransactionRequest = {
  transactionId: number;
};

export type ScanRequest = TransactionRequest & {
  opts?: ScanOptionsRPC;
  receiver: (
    primaryKey: string,
    secondaryKey: string | null,
    value: Uint8Array,
  ) => void;
};
export type ScanResponse = unknown;

type PutRequest = TransactionRequest & {
  key: string;
  value: string;
};
type PutResponse = unknown;

type DelRequest = TransactionRequest & {key: string};
type DelResponse = {ok: boolean};

type RebaseOpts =
  | Record<string, unknown>
  | {
      basis: string;
      original: string;
    };

export type OpenTransactionRequest = {
  name?: string;
  args?: string;
  rebaseOpts?: RebaseOpts;
};
type OpenTransactionResponse = {
  transactionId: number;
};

type OpenIndexTransactionRequest = unknown;
type OpenIndexTransactionResponse = OpenTransactionResponse;

type CloseTransactionRequest = TransactionRequest;
type CloseTransactionResponse = unknown;

type CommitTransactionRequest = TransactionRequest;
export type CommitTransactionResponse = {
  ref: string;
};

type BeginSyncRequest = {
  batchPushURL: string;
  dataLayerAuth: string;
  diffServerURL: string;
  diffServerAuth: string;
};

type MutationInfo = {
  id: number;
  error: string;
};

type BatchPushResponse = {
  mutationInfos?: MutationInfo[];
};

type BatchPushInfo = {
  httpStatusCode: number;
  errorMessage: string;
  batchPushResponse: BatchPushResponse;
};

type ClientViewInfo = {
  httpStatusCode: number;
  errorMessage: string;
};

type SyncInfo = {
  syncID: string;
  batchPushInfo?: BatchPushInfo;
  clientViewInfo: ClientViewInfo;
};

export type BeginSyncResponse = {
  syncHead: string;
  syncInfo: SyncInfo;
};

type MaybeEndSyncRequest = {
  syncID?: string;
  syncHead?: string;
};

type Mutation = {
  id: number;
  name: string;
  args: string;
};

type ReplayMutation = Mutation & {
  original: string;
};

type MaybeEndSyncResponse = {
  replayMutations?: ReplayMutation[];
};

type SetLogLevelRequest = {level: 'debug' | 'info' | 'error'};

type SetLogLevelResponse = unknown;

export type InvokeMap = {
  get: [GetRequest, GetResponse];
  has: [HasRequest, HasResponse];
  scan: [ScanRequest, ScanResponse];
  put: [PutRequest, PutResponse];
  del: [DelRequest, DelResponse];

  openTransaction: [OpenTransactionRequest, OpenTransactionResponse];
  openIndexTransaction: [
    OpenIndexTransactionRequest,
    OpenIndexTransactionResponse,
  ];
  closeTransaction: [CloseTransactionRequest, CloseTransactionResponse];
  commitTransaction: [CommitTransactionRequest, CommitTransactionResponse];

  beginSync: [BeginSyncRequest, BeginSyncResponse];
  maybeEndSync: [MaybeEndSyncRequest, MaybeEndSyncResponse];

  setLogLevel: [SetLogLevelRequest, SetLogLevelResponse];
};

type OpenResponse = '';
type CloseResponse = '';

type GetRootResponse = {
  root: string;
};

export type InvokeMapNoArgs = {
  open: OpenResponse;
  close: CloseResponse;
  getRoot: GetRootResponse;
};
