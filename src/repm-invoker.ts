import type {JSONValue, ToJSON} from './json.js';
import type {ScanOptionsRpc} from './scan-options.js';
import init, {dispatch} from './wasm/release/replicache_client.js';
import type {InitInput, InitOutput} from './wasm/release/replicache_client.js';

// TODO(repc-switchover): isWasm can go away, but so can this whole
// type and all the machinery connected to it. Look at the commit
// that introduced this to unwind it.
/**
 * @deprecated - use the wasmModule parameter to {@link Replicache.constructor} instead.
 */
export type Invoker = {
  readonly invoke: REPMInvoke;
};

export interface Invoke {
  <Rpc extends keyof InvokeMapNoArgs>(rpc: Rpc): Promise<InvokeMapNoArgs[Rpc]>;
  <Rpc extends keyof InvokeMap>(rpc: Rpc, args: InvokeMap[Rpc][0]): Promise<
    InvokeMap[Rpc][1]
  >;
  (rpc: string, args?: JSONValue | ToJSON): Promise<JSONValue>;
}

export interface REPMInvoke {
  <Rpc extends keyof InvokeMapNoArgs>(dbName: string, rpc: Rpc): Promise<
    InvokeMapNoArgs[Rpc]
  >;
  <Rpc extends keyof InvokeMap>(
    dbName: string,
    rpc: Rpc,
    args: InvokeMap[Rpc][0],
  ): Promise<InvokeMap[Rpc][1]>;
  (dbName: string, rpc: string, args?: JSONValue | ToJSON): Promise<JSONValue>;
}

let wasmModuleOutput: Promise<InitOutput> | undefined;

/**
 * @deprecated - use the wasmModule parameter to {@link Replicache.constructor} instead.
 */
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
    args: JSONValue | ToJSON = {},
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
  opts?: ScanOptionsRpc;
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

type CloseTransactionRequest = TransactionRequest;
type CloseTransactionResponse = unknown;

type CommitTransactionRequest = TransactionRequest;
export type CommitTransactionResponse =
  | {
      retryCommit: false;
      ref: string;
    }
  | {
      retryCommit: true;
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

export type InvokeMap = {
  get: [GetRequest, GetResponse];
  has: [HasRequest, HasResponse];
  scan: [ScanRequest, ScanResponse];
  put: [PutRequest, PutResponse];
  del: [DelRequest, DelResponse];

  openTransaction: [OpenTransactionRequest, OpenTransactionResponse];
  closeTransaction: [CloseTransactionRequest, CloseTransactionResponse];
  commitTransaction: [CommitTransactionRequest, CommitTransactionResponse];

  beginSync: [BeginSyncRequest, BeginSyncResponse];
  maybeEndSync: [MaybeEndSyncRequest, MaybeEndSyncResponse];
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
