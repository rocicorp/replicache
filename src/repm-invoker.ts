import type { JSONValue, ToJSON } from './json.js';
import type { ScanItem } from './scan-item.js';
import type { ScanOptions } from './scan-options.js';
import type { DatabaseInfo } from './database-info.js';
import init, { dispatch } from './wasm/replicache_client.js';

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

export class REPMHTTPInvoker {
  private readonly _url: string;
  constructor(url: string) {
    this._url = url;
  }

  invoke: REPMInvoke = async (
    dbName: string,
    rpc: string,
    args: JSONValue | ToJSON = {},
  ): Promise<JSONValue> => {
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
  };
}

export class REPMWASMInvoker {
  private readonly _inited: Promise<any>;
  constructor() {
    this._inited = init();
  }

  invoke: REPMInvoke = async (
    dbName: string,
    rpc: string,
    args: JSONValue | ToJSON = {},
  ): Promise<JSONValue> => {
    await this._inited;
    return await dispatch(dbName, rpc, JSON.stringify(args));
  };
}

type GetRequest = TransactionRequest & {
  key: string;
};
type GetResponse = {
  has?: boolean;
  value: JSONValue;
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

export type ScanRequest = TransactionRequest &
  ScanOptions & {
    limit?: number;
  };
export type ScanResponse = ScanItem[];

type PutRequest = TransactionRequest & {
  key: string;
  value: JSONValue | ToJSON;
};
type PutResponse = unknown;

type DelRequest = TransactionRequest & { key: string };
type DelResponse = { ok: boolean };

type RebaseOpts =
  | Record<string, unknown>
  | {
    basis: string;
    original: string;
  };

export type OpenTransactionRequest = {
  name?: string;
  args?: JSONValue | ToJSON;
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
  args: JSONValue;
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
type ListRespones = { databases: DatabaseInfo[] };
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
