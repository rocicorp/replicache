import type * as kv from '../kv/mod';
import * as dag from '../dag/mod';
import * as db from '../db/mod';
import * as sync from '../sync/mod';
import type {
  BeginPullRequest,
  BeginPullResponse,
  CommitTransactionResponse,
  HTTPRequestInfo,
  MaybeEndPullResponse,
  OpenResponse,
  RebaseOpts,
  TryPushRequest,
} from '../repm-invoker';
import {ReadonlyJSONValue, JSONValue, deepClone} from '../json';
import type {LogContext} from '../logger';
import {migrate} from '../migrate/migrate';

type Transaction = db.Write | db.Read;

export async function open(
  dbName: string,
  kvStore: kv.Store,
  lc: LogContext,
): Promise<OpenResponse> {
  const start = Date.now();

  const lc2 = lc.addContext('rpc', 'open');
  lc2.debug?.('->', kvStore);

  if (dbName === '') {
    throw new Error('dbName must be non-empty');
  }

  await migrate(kvStore);

  const dagStore = new dag.Store(kvStore);
  // TODO(arv): Maybe store the clientID as a promise instead to prevent race
  // conditions?
  const clientID = await sync.initClientID(kvStore);

  // Call concurrently with initClientID?
  await init(dagStore);

  // TODO(arv): Maybe store an opened promise too and let all embed calls wait
  // for it.

  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms, result=', clientID);
  return {clientID, store: dagStore};
}

export async function close(store: dag.Store, lc: LogContext): Promise<void> {
  const start = Date.now();

  lc = lc.addContext('rpc', 'close');
  lc.debug?.('->');
  await store.close();
  lc.debug?.('<- elapsed=', Date.now() - start, 'ms');
}

async function init(dagStore: dag.Store): Promise<void> {
  await dagStore.withWrite(async dagWrite => {
    const head = await dagWrite.getHead(db.DEFAULT_HEAD_NAME);
    if (!head) {
      await db.initDB(dagWrite, db.DEFAULT_HEAD_NAME);
    }
  });
}

export async function openReadTransaction(
  store: dag.Store,
  lc: LogContext,
): Promise<db.Read> {
  const start = Date.now();
  lc.debug?.('->', store);

  const dagRead = await store.read();
  const txn = await db.fromWhence(db.whenceHead(db.DEFAULT_HEAD_NAME), dagRead);

  lc.debug?.('<- elapsed=', Date.now() - start, 'ms, result=', txn);
  return txn;
}

export async function openWriteTransaction(
  name: string,
  args: ReadonlyJSONValue,
  rebaseOpts: RebaseOpts | undefined,
  store: dag.Store,
  lc: LogContext,
): Promise<db.Write> {
  const start = Date.now();
  lc.debug?.('->', store, name, args, rebaseOpts);
  let dbWrite: db.Write;

  const lockStart = Date.now();
  lc.debug?.('Waiting for write lock...');

  const dagWrite = await store.write();
  lc.debug?.('...Write lock acquired in', Date.now() - lockStart, 'ms');
  let ok = false;
  try {
    let whence: db.Whence | undefined;
    let originalHash: string | null = null;
    if (rebaseOpts === undefined) {
      whence = db.whenceHead(db.DEFAULT_HEAD_NAME);
    } else {
      await validateRebase(rebaseOpts, dagWrite, name, args);
      whence = db.whenceHash(rebaseOpts.basis);
      originalHash = rebaseOpts.original;
    }

    dbWrite = await db.Write.newLocal(
      whence,
      name,
      args,
      originalHash,
      dagWrite,
    );
    ok = true;
  } finally {
    if (!ok) {
      dagWrite.close();
    }
  }

  lc.debug?.('<- elapsed=', Date.now() - start, 'ms, result=', dbWrite);
  return dbWrite;
}

export async function openIndexTransaction(
  store: dag.Store,
  lc: LogContext,
): Promise<db.Write> {
  const start = Date.now();

  lc.debug?.('->');

  let txn;
  const lockStart = Date.now();
  lc.debug?.('Waiting for write lock...');
  const dagWrite = await store.write();
  lc.debug?.('...Write lock acquired in', Date.now() - lockStart, 'ms');
  let ok = false;
  try {
    txn = await db.Write.newIndexChange(
      db.whenceHead(db.DEFAULT_HEAD_NAME),
      dagWrite,
    );

    ok = true;
  } finally {
    if (!ok) {
      dagWrite.close();
    }
  }
  lc.debug?.('<- elapsed=', Date.now() - start, 'ms');
  return txn;
}

async function validateRebase(
  opts: RebaseOpts,
  dagRead: dag.Read,
  mutatorName: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _args: ReadonlyJSONValue,
) {
  // Ensure the rebase commit is going on top of the current sync head.
  const syncHeadHash = await dagRead.getHead(sync.SYNC_HEAD_NAME);
  if (syncHeadHash !== opts.basis) {
    throw new Error(
      `WrongSyncHeadJSLogInfo: sync head is ${syncHeadHash}, transaction basis is ${opts.basis}`,
    );
  }

  // Ensure rebase and original commit mutator names match.
  const [, original] = await db.readCommit(
    db.whenceHash(opts.original),
    dagRead,
  );
  if (original.isLocal()) {
    const lm = original.meta;
    if (lm.mutatorName !== mutatorName) {
      throw new Error(
        `Inconsistent mutator: original: ${lm.mutatorName}, request: ${mutatorName}`,
      );
    }
  } else {
    throw new Error('Internal programmer error: Commit is not a local commit');
  }

  // Ensure rebase and original commit mutation ids names match.
  const [, basis] = await db.readCommit(db.whenceHash(opts.basis), dagRead);
  if (basis.nextMutationID !== original.mutationID) {
    throw new Error(
      `Inconsistent mutation ID: original: ${original.mutationID}, next: ${basis.nextMutationID}`,
    );
  }

  // TODO: temporarily skipping check that args are the same.
  // https://github.com/rocicorp/repc/issues/151
}

export async function commitTransaction(
  txn: db.Write,
  lc: LogContext,
  generateChangedKeys: boolean,
): Promise<CommitTransactionResponse> {
  const start = Date.now();
  // const {txn, lc} = getWriteTransaction(transactionID, transactionsMap);
  const lc2 = lc.addContext('rpc', 'commitTransaction');
  lc2.debug?.('->', generateChangedKeys);

  const headName = txn.isRebase() ? sync.SYNC_HEAD_NAME : db.DEFAULT_HEAD_NAME;
  const [hash, changedKeys] = await txn.commitWithChangedKeys(
    headName,
    generateChangedKeys,
  );
  lc2.debug?.(
    '<- elapsed=',
    Date.now() - start,
    'ms, result.ref=',
    hash,
    ', result.changedKeys=',
    changedKeys,
  );
  return {ref: hash, changedKeys};
}

export async function closeTransaction(
  txn: db.Read | db.Write,
  lc: LogContext,
): Promise<void> {
  const start = Date.now();

  // const {txn, lc} = getTransaction(transactionID, transactionsMap);
  const lc2 = lc.addContext('rpc', 'closeTransaction');
  lc2.debug?.('->');
  txn.close();
  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms');
}

export async function getRoot(
  store: dag.Store,
  lc: LogContext,
): Promise<string> {
  const start = Date.now();

  const headName = db.DEFAULT_HEAD_NAME;

  const lc2 = lc.addContext('rpc', 'getRoot');
  lc2.debug?.('->', headName);
  const result = await db.getRoot(store, headName);
  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms, result=', result);
  return result;
}

export function has(txn: Transaction, lc: LogContext, key: string): boolean {
  const start = Date.now();

  const lc2 = lc.addContext('rpc', 'has');
  lc2.debug?.('->', key);
  const result = txn.has(key);
  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms, result=', result);
  return result;
}

export function get(
  txn: Transaction,
  lc: LogContext,
  key: string,
  shouldClone: boolean,
): ReadonlyJSONValue | JSONValue | undefined {
  const start = Date.now();

  const lc2 = lc.addContext('rpc', 'get');
  lc2.debug?.('->', key);
  const value = txn.get(key);

  const result = value && (shouldClone ? deepClone(value) : value);
  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms, result=', result);
  return result;
}

export async function scan(
  txn: db.Read,
  lc: LogContext,
  scanOptions: db.ScanOptions,
  receiver: (
    primaryKey: string,
    secondaryKey: string | null,
    value: JSONValue | ReadonlyJSONValue,
  ) => void,
  shouldClone: boolean,
): Promise<void> {
  const start = Date.now();

  const lc2 = lc.addContext('rpc', 'scan');
  lc2.debug?.('->', scanOptions);
  await txn.scan(scanOptions, sr => {
    if (sr.type === db.ScanResultType.Error) {
      // repc didn't throw here, It just did error logging.
      throw sr.error;
    }
    const {val, key, secondaryKey} = sr.item;
    receiver(key, secondaryKey, shouldClone ? deepClone(val) : val);
  });
  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms');
}

export async function put(
  txn: db.Write,
  lc: LogContext,
  key: string,
  value: JSONValue,
): Promise<void> {
  const start = Date.now();

  const lc2 = lc.addContext('rpc', 'put');
  lc2.debug?.('->', key, value);
  await txn.put(lc2, key, deepClone(value));
  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms');
}

export async function del(
  txn: db.Write,
  lc: LogContext,
  key: string,
): Promise<boolean> {
  const start = Date.now();

  const lc2 = lc.addContext('rpc', 'del');
  lc2.debug?.('->', key);
  const had = await txn.has(key);
  await txn.del(lc, key);
  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms, result=', had);
  return had;
}

export async function createIndex(
  txn: db.Write,
  lc: LogContext,
  name: string,
  keyPrefix: string,
  jsonPointer: string,
): Promise<void> {
  const start = Date.now();
  const lc2 = lc.addContext('rpc', 'createIndex');
  lc2.debug?.('->', name, keyPrefix, jsonPointer);
  await txn.createIndex(lc, name, keyPrefix, jsonPointer);
  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms');
}

export async function dropIndex(
  txn: db.Write,
  lc: LogContext,
  name: string,
): Promise<void> {
  const start = Date.now();

  const lc2 = lc.addContext('rpc', 'dropIndex');
  lc2.debug?.('->', name);
  await txn.dropIndex(name);
  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms');
}

export async function maybeEndPull(
  requestID: string,
  syncHead: string,
  store: dag.Store,
  lc: LogContext,
): Promise<MaybeEndPullResponse> {
  const start = Date.now();

  const lc2 = lc
    .addContext('rpc', 'maybeEndPull')
    .addContext('request_id', requestID);
  lc2.debug?.('->', syncHead);
  const result = await sync.maybeEndPull(store, lc2, {requestID, syncHead});
  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms, result=', result);
  return result;
}

export async function tryPush(
  clientID: string,
  req: TryPushRequest,
  store: dag.Store,
  lc: LogContext,
): Promise<HTTPRequestInfo | undefined> {
  const start = Date.now();

  const requestID = sync.newRequestID(clientID);
  const lc2 = lc
    .addContext('rpc', 'tryPush')
    .addContext('request_id', requestID);
  lc2.debug?.('->', req);
  const jsPusher = new sync.JSPusher(req.pusher);
  const result = await sync.push(
    requestID,
    store,
    lc2,
    clientID,
    jsPusher,
    req,
  );
  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms, result=', result);
  return result;
}

export async function beginPull(
  clientID: string,
  req: BeginPullRequest,
  store: dag.Store,
  lc: LogContext,
): Promise<BeginPullResponse> {
  const start = Date.now();

  const requestID = sync.newRequestID(clientID);
  const lc2 = lc
    .addContext('rpc', 'beginPull')
    .addContext('request_id', requestID);
  lc2.debug?.('->', req);
  const jsPuller = new sync.JSPuller(req.puller);
  const result = await sync.beginPull(
    clientID,
    req,
    jsPuller,
    requestID,
    store,
    lc2,
  );
  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms, result=', result);
  return result;
}
