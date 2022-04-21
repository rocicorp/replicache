export {Replicache, makeIDBName} from './replicache';
export {TransactionClosedError} from './transaction-closed-error';
export {consoleLogSink} from '@rocicorp/logger';

export type {
  MaybePromise,
  MutatorDefs,
  Poke,
  RequestOptions,
  ClientStateNotFoundReason,
} from './replicache';
export type {ReplicacheOptions} from './replicache-options';
export type {
  CreateIndexDefinition,
  ReadTransaction,
  WriteTransaction,
} from './transactions';
export type {
  GetScanIterator,
  GetIndexScanIterator,
  ScanResult,
  AsyncIterableIteratorToArrayWrapper,
} from './scan-iterator';
export {makeScanResult} from './scan-iterator';
export type {LogSink, LogLevel} from '@rocicorp/logger';
export type {
  JSONObject,
  JSONValue,
  ReadonlyJSONValue,
  ReadonlyJSONObject,
} from './json';
export type {
  KeyTypeForScanOptions,
  ScanIndexOptions,
  ScanNoIndexOptions,
  ScanOptionIndexedStartKey,
  ScanOptions,
} from './scan-options';
export {isScanIndexOptions} from './scan-options';
export type {HTTPRequestInfo} from './http-request-info';
export type {
  PatchOperation,
  Puller,
  PullResponse,
  PullResponseOK,
  ClientStateNotFoundResponse,
  PullerResult,
  PullError,
} from './puller';
export type {Pusher, PushError} from './pusher';

export type {
  Store as ExperimentalKVStore,
  Read as ExperimentalKVRead,
  Write as ExperimentalKVWrite,
} from './kv/store';

export type {PullRequest} from './sync/pull';
export type {PushRequest} from './sync/push';

export {TEST_LICENSE_KEY} from '@rocicorp/licensing/src/client';

export type {IndexKey} from './db/index';

export type {Diff, DiffOperation} from './btree/node';
export type {WatchCallback, WatchOptions} from './watcher';
