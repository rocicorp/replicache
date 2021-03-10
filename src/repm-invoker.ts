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

type OpenRequest = {
  useMemstore: boolean;
};
export type OpenResponse = string;

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

type BeginTryPullRequest = {
  pullURL: string;
  pullAuth: string;
  schemaVersion: string;
};

type BeginTryPullResponse = {
  httpRequestInfo: HTTPRequestInfo;
  syncHead: string;
  requestID: string;
};

type TryPushRequest = {
  pushURL: string;
  pushAuth: string;
  schemaVersion: string;
};

type TryPushResponse = {
  httpRequestInfo?: HTTPRequestInfo;
};

type HTTPRequestInfo = {
  httpStatusCode: number;
  errorMessage: string;
};

type MaybeEndTryPullRequest = {
  requestID: string;
  syncHead: string;
};

type Mutation = {
  id: number;
  name: string;
  args: string;
};

type ReplayMutation = Mutation & {
  original: string;
};

type MaybeEndTryPullResponse = {
  replayMutations?: ReplayMutation[];
  syncHead: string;
};

type SetLogLevelRequest = {level: 'debug' | 'info' | 'error'};

type SetLogLevelResponse = unknown;

type CreateIndexRequest = TransactionRequest & {
  name: string;
  keyPrefix: string;
  jsonPointer: string;
};

type CreateIndexResponse = unknown;

type DropIndexRequest = TransactionRequest & {
  name: string;
};

type DropIndexResponse = unknown;

export type InvokeMap = {
  open: [OpenRequest, OpenResponse];
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

  beginTryPull: [BeginTryPullRequest, BeginTryPullResponse];
  maybeEndTryPull: [MaybeEndTryPullRequest, MaybeEndTryPullResponse];
  tryPush: [TryPushRequest, TryPushResponse];

  setLogLevel: [SetLogLevelRequest, SetLogLevelResponse];

  createIndex: [CreateIndexRequest, CreateIndexResponse];
  dropIndex: [DropIndexRequest, DropIndexResponse];
};

type CloseResponse = '';

type GetRootResponse = {
  root: string;
};

export type InvokeMapNoArgs = {
  close: CloseResponse;
  getRoot: GetRootResponse;
};
