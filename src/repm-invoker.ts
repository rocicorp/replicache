import type {JsonType} from './json.js';
import type {ScanItem} from './scan-item.js';
import type {ScanOptions} from './scan-options.js';
import type {DatabaseInfo} from './database-info.js';

export interface Invoke {
  <Rpc extends keyof InvokeMapNoArgs>(rpc: Rpc): Promise<InvokeMapNoArgs[Rpc]>;
  <Rpc extends keyof InvokeMap>(rpc: Rpc, args: InvokeMap[Rpc][0]): Promise<
    InvokeMap[Rpc][1]
  >;
  (rpc: string, args?: JsonType): Promise<JsonType>;
}

export interface FullInvoke {
  <Rpc extends keyof InvokeMapNoArgs>(dbName: string, rpc: Rpc): Promise<
    InvokeMapNoArgs[Rpc]
  >;
  <Rpc extends keyof InvokeMap>(
    dbName: string,
    rpc: Rpc,
    args: InvokeMap[Rpc][0],
  ): Promise<InvokeMap[Rpc][1]>;
  (dbName: string, rpc: string, args?: JsonType): Promise<JsonType>;
}

interface RepmInvoker {
  invoke<Rpc extends keyof InvokeMapNoArgs>(
    dbName: string,
    rpc: Rpc,
  ): Promise<InvokeMapNoArgs[Rpc]>;
  invoke<Rpc extends keyof InvokeMap>(
    dbName: string,
    rpc: Rpc,
    args: InvokeMap[Rpc][0],
  ): Promise<InvokeMap[Rpc][1]>;
  invoke(dbName: string, rpc: string, args?: JsonType): Promise<JsonType>;
}

export class RepmHttpInvoker implements RepmInvoker {
  private readonly _url: string;
  constructor(url: string) {
    this._url = url;
  }

  invoke<Rpc extends keyof InvokeMapNoArgs>(
    dbName: string,
    rpc: Rpc,
  ): Promise<InvokeMapNoArgs[Rpc]>;
  invoke<Rpc extends keyof InvokeMap>(
    dbName: string,
    rpc: Rpc,
    args: InvokeMap[Rpc][0],
  ): Promise<InvokeMap[Rpc][1]>;
  async invoke(
    dbName: string,
    rpc: string,
    args: JsonType = {},
  ): Promise<JsonType> {
    const resp = await fetch(`${this._url}/?dbname=${dbName}&rpc=${rpc}`, {
      method: 'POST',
      body: JSON.stringify(args),
    });
    if (resp.status === 200) {
      if (resp.headers.get('content-length') === '0') {
        return '';
      }
      return await resp.json();
    }
    throw new Error(
      `Test server failed: ${resp.status} ${
        resp.statusText
      }: ${await resp.text()}`,
    );
  }
}

type GetRequest = TransactionRequest & {
  key: string;
};
type GetResponse = {
  has?: boolean;
  value: JsonType;
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

export type ScanRequest = TransactionRequest & ScanOptions;
type ScanResponse = ScanItem[];

type PutRequest = TransactionRequest & {
  key: string;
  value: JsonType;
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
  args?: JsonType;
  rebaseOpts?: RebaseOpts;
};
type OpenTransactionResponse = {
  transactionId: number;
};

type CloseTransactionRequest = TransactionRequest;
type CloseTransactionResponse = unknown;

type CommitTransactionRequest = TransactionRequest;
type CommitTransactionResponse =
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

type BeginSyncResponse = {
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
  args: JsonType;
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
type ListRespones = {databases: DatabaseInfo[]};
type DropResponse = '';

type GetRootResponse = {
  root: string;
};

export type InvokeMapNoArgs = {
  open: OpenResponse;
  close: CloseResponse;
  list: ListRespones;
  drop: DropResponse;
  getRoot: GetRootResponse;
};
