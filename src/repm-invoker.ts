import type {JSONValue, ToJSON} from './json.js';
import type {ScanItem} from './scan-item.js';
import type {ScanOptions} from './scan-options.js';
import type {DatabaseInfo} from './database-info.js';

import init, {dispatch} from './wasm/release/replicache_client.js';

// TODO(repc-switchover): isWasm can go away, but so can this whole
// type and all the machinery connected to it. Look at the commit
// that introduced this to unwind it.
export type Invoker = {
  readonly invoke: REPMInvoke;
  readonly isWasm: boolean;
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

export class REPMWasmInvoker {
  private readonly _inited: Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  private _dispatch?: (dbName: string, rpc: string, args: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
  public readonly isWasm = true;
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  constructor(wasm_module?: any) {
    this._inited = (async () => {
      // TODO: Have to import dynamically to hide this from Jest.
      // Jest cannot parse the es6 behind this import, I don't know why.
      // TODO: We need to have some way to switch between debug and release.
      // const {default: init, dispatch} = await import(
      //   './wasm/debug/replicache_client.js'
      // );
      this._dispatch = dispatch;
      return init(wasm_module);
    })();
  }

  invoke: REPMInvoke = async (
    dbName: string,
    rpc: string,
    args: JSONValue | ToJSON = {},
  ): Promise<JSONValue> => {
    console.debug('>', dbName, rpc, args);
    await this._inited;
    const json = await this._dispatch!(dbName, rpc, JSON.stringify(args)); // eslint-disable-line @typescript-eslint/no-non-null-assertion
    const ret = json == '' ? null : JSON.parse(json);
    console.debug('<', dbName, rpc, ret);
    return ret;
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
    opts?: ScanOptions;
  };
export type ScanResponse =
  | ScanItem[]
  | {
      items: ScanItem[];
    };

type PutRequest = TransactionRequest & {
  key: string;
  value: JSONValue | ToJSON;
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
