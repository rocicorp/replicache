import type {ScanOptionsRPC} from './scan-options.js';
import type {ScanItem} from './scan-item.js';
import type {JSONValue} from './json.js';
import type {InitInput} from './repm-wasm-invoker.js';

/**
 * @deprecated - use the wasmModule parameter to {@link Replicache.constructor} instead.
 */
export type Invoker = {
  readonly invoke: REPMInvoke;
};

export interface Invoke {
  <RPC extends keyof InvokeMap>(rpc: RPC, args: InvokeMap[RPC][0]): Promise<
    InvokeMap[RPC][1]
  >;
}

export interface REPMInvoke {
  <RPC extends keyof InvokeMap>(
    dbName: string,
    rpc: RPC,
    args?: InvokeMap[RPC][0],
  ): Promise<InvokeMap[RPC][1]>;
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

export type ScanRequestRPC = Omit<ScanRequest, 'receiver'>;
export type ScanResponseRPC = ScanItem<JSONValue>[];

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

type OpenResponse = '';
type CloseResponse = '';

type GetRootResponse = {
  root: string;
};

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

  beginSync: [args: BeginSyncRequest, response: BeginSyncResponse];
  maybeEndSync: [args: MaybeEndSyncRequest, response: MaybeEndSyncResponse];
  setLogLevel: [args: SetLogLevelRequest, response: SetLogLevelResponse];

  createIndex: [CreateIndexRequest, CreateIndexResponse];
  dropIndex: [DropIndexRequest, DropIndexResponse];

  open: [undefined, OpenResponse];
  close: [undefined, CloseResponse];
  getRoot: [undefined, GetRootResponse];
};

export type InvokeMapRPC = Omit<InvokeMap, 'scan'> & {
  scan: [ScanRequestRPC, ScanResponseRPC];
  initWorker: [InitInput | undefined, null];
};
