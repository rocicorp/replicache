import type {JSONValue} from './json.js';
import type {ScanOptionsRPC} from './scan-options.js';
import init, {dispatch} from './wasm/release/replicache_client.js';
import type {InitOutput} from './wasm/release/replicache_client.js';
import type {Puller} from './puller.js';
import type {Pusher} from './pusher.js';
import type {Store} from './store.js';

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
  <R extends keyof InvokeMapNoArgs>(dbName: string, rpc: R): Promise<
    InvokeMapNoArgs[R]
  >;
  <R extends keyof InvokeMap>(
    dbName: string,
    rpc: R,
    args: InvokeMap[R][0],
  ): Promise<InvokeMap[R][1]>;
  (dbName: string, rpc: RPC, args?: JSONValue): Promise<JSONValue>;
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
    rpc: RPC,
    args: JSONValue = {},
  ): Promise<JSONValue> => {
    await wasmModuleOutput;
    return await dispatch(dbName, rpc, args);
  };
}

type OpenRequest = {
  useMemstore: boolean;
  store?: Store;
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
export type CloseTransactionResponse = unknown;

type CommitTransactionRequest = TransactionRequest & {
  generateChangedKeys: boolean;
};

// The changed keys in different indexes. The key of the map is the index name.
// "" is used for the primary index.
export type ChangedKeysMap = Map<string, string[]>;

export type CommitTransactionResponse = {
  ref: string;
  changedKeys: ChangedKeysMap;
};

type BeginTryPullRequest = {
  pullURL: string;
  pullAuth: string;
  schemaVersion: string;
  puller: Puller;
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
  pusher: Pusher;
};

type TryPushResponse = {
  httpRequestInfo?: HTTPRequestInfo;
};

export type HTTPRequestInfo = {
  httpStatusCode: number;
  errorMessage: string;
};

type MaybeEndTryPullRequest = {
  requestID: string;
  syncHead: string;
};

/**
 * ReplayMutation is used int the RPC between EndPull so that we can replay
 * mutations ontop of the current state. It is never exposed to the public.
 */
type ReplayMutation = {
  id: number;
  name: string;
  args: string;
  original: string;
};

type MaybeEndTryPullResponse = {
  replayMutations?: ReplayMutation[];
  syncHead: string;
  changedKeys: ChangedKeysMap;
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
  [RPC.Open]: [OpenRequest, OpenResponse];
  [RPC.Get]: [GetRequest, GetResponse];
  [RPC.Has]: [HasRequest, HasResponse];
  [RPC.Scan]: [ScanRequest, ScanResponse];
  [RPC.Put]: [PutRequest, PutResponse];
  [RPC.Del]: [DelRequest, DelResponse];

  [RPC.OpenTransaction]: [OpenTransactionRequest, OpenTransactionResponse];
  [RPC.OpenIndexTransaction]: [
    OpenIndexTransactionRequest,
    OpenIndexTransactionResponse,
  ];
  [RPC.CloseTransaction]: [CloseTransactionRequest, CloseTransactionResponse];
  [RPC.CommitTransaction]: [
    CommitTransactionRequest,
    CommitTransactionResponse,
  ];

  [RPC.BeginTryPull]: [BeginTryPullRequest, BeginTryPullResponse];
  [RPC.MaybeEndTryPull]: [MaybeEndTryPullRequest, MaybeEndTryPullResponse];
  [RPC.TryPush]: [TryPushRequest, TryPushResponse];

  [RPC.SetLogLevel]: [SetLogLevelRequest, SetLogLevelResponse];

  [RPC.CreateIndex]: [CreateIndexRequest, CreateIndexResponse];
  [RPC.DropIndex]: [DropIndexRequest, DropIndexResponse];
};

type CloseResponse = '';

type GetRootResponse = {
  root: string;
};

export type InvokeMapNoArgs = {
  [RPC.Close]: CloseResponse;
  [RPC.GetRoot]: GetRootResponse;
};

export enum RPC {
  BeginTryPull = 1,
  Close,
  CloseTransaction,
  CommitTransaction,
  CreateIndex,
  Debug,
  Del,
  DropIndex,
  Get,
  GetRoot,
  Has,
  MaybeEndTryPull,
  Open,
  OpenIndexTransaction,
  OpenTransaction,
  Put,
  Scan,
  SetLogLevel,
  TryPush,
}
