import type {Puller} from './puller';
import type {Pusher} from './pusher';
import type * as kv from './kv/mod';
import type * as dag from './dag/mod';
import type * as db from './db/mod';
import type {JSONValue} from './json';

type OpenRequest = {
  useMemstore: boolean;
  store?: kv.Store;
  dag?: dag.Store;
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
  opts?: db.ScanOptions;
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

export type RebaseOpts = {
  basis: string;
  original: string;
};

export type OpenTransactionRequest = {
  name?: string;
  args?: JSONValue;
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

export type BeginTryPullRequest = {
  pullURL: string;
  pullAuth: string;
  schemaVersion: string;
  puller: Puller;
};

export type BeginTryPullResponse = {
  httpRequestInfo: HTTPRequestInfo;
  syncHead: string;
  requestID: string;
};

export type TryPushRequest = {
  pushURL: string;
  pushAuth: string;
  schemaVersion: string;
  pusher: Pusher;
};

type TryPushResponse = {
  httpRequestInfo?: HTTPRequestInfo;
};

export function assertHTTPRequestInfo(
  // eslint-disable-next-line
  v: any,
): asserts v is HTTPRequestInfo {
  if (
    typeof v !== 'object' ||
    v === null ||
    typeof v.httpStatusCode !== 'number' ||
    typeof v.errorMessage !== 'string'
  ) {
    throw new Error('Invalid HTTPRequestInfo');
  }
}

export type HTTPRequestInfo = {
  httpStatusCode: number;
  errorMessage: string;
};

export type MaybeEndTryPullRequest = {
  requestID: string;
  syncHead: string;
};

/**
 * ReplayMutation is used int the RPC between EndPull so that we can replay
 * mutations ontop of the current state. It is never exposed to the public.
 */
export type ReplayMutation = {
  id: number;
  name: string;
  args: JSONValue;
  original: string;
};

export type MaybeEndTryPullResponse = {
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
