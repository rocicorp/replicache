import type {Puller} from './puller';
import type {Pusher} from './pusher';
import type * as db from './db/mod';
import type {JSONValue} from './json';

export type OpenResponse = string;

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

export type RebaseOpts = {
  basis: string;
  original: string;
};

export type OpenTransactionRequest = {
  name?: string;
  args?: JSONValue;
  rebaseOpts?: RebaseOpts;
};

export type CloseTransactionResponse = unknown;

// The changed keys in different indexes. The key of the map is the index name.
// "" is used for the primary index.
export type ChangedKeysMap = Map<string, string[]>;

export type CommitTransactionResponse = {
  ref: string;
  changedKeys: ChangedKeysMap;
};

export type BeginPullRequest = {
  pullURL: string;
  pullAuth: string;
  schemaVersion: string;
  puller: Puller;
};

export type BeginPullResponse = {
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

export type MaybeEndPullRequest = {
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

export type MaybeEndPullResponse = {
  replayMutations?: ReplayMutation[];
  syncHead: string;
  changedKeys: ChangedKeysMap;
};
