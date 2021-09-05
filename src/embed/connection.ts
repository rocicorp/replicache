import type * as kv from '../kv/mod';
import * as dag from '../dag/mod';
import * as db from '../db/mod';
import * as sync from '../sync/mod';
import type {
  BeginTryPullRequest,
  BeginTryPullResponse,
  CommitTransactionResponse,
  HTTPRequestInfo,
  MaybeEndTryPullResponse,
  RebaseOpts,
  TryPushRequest,
} from '../repm-invoker';
import {deepFreeze, ReadonlyJSONValue, JSONValue, deepThaw} from '../json';
import {LogContext} from '../logger';
import type {LogLevel} from '../logger';

// TODO(arv): Use esbuild --define:TESTING=false

let isTesting = false;

export function setIsTesting(b: boolean): void {
  isTesting = b;
}

export const testLog: {name: string; args: unknown[]}[] = [];

export function clearTestLog(): void {
  testLog.length = 0;
}

function logCall(name: string, ...args: unknown[]): void {
  testLog.push({name, args});
}

type ConnectionMap = Map<
  string,
  {store: dag.Store; clientID: string; lc: LogContext}
>;

const connections: ConnectionMap = new Map();

let transactionCounter = 0;

function getConnection(dbName: string) {
  const connection = connections.get(dbName);
  if (!connection) {
    throw new Error(`Database "${dbName}" is not open`);
  }
  return connection;
}

type Transaction = db.Write | db.Read;
type TransactionsMap = Map<number, {txn: Transaction; lc: LogContext}>;
const transactionsMap: TransactionsMap = new Map();

function getTransaction(
  transactionID: number,
  map: TransactionsMap,
): {txn: Transaction; lc: LogContext} {
  const val = map.get(transactionID);
  if (!val) {
    throw new Error(`Transaction ${transactionID} is not open`);
  }
  return val;
}

function getWriteTransaction(
  transactionID: number,
  map: TransactionsMap,
): {txn: db.Write; lc: LogContext} {
  const {txn, lc} = getTransaction(transactionID, map);
  if (txn instanceof db.Read) {
    throw new Error('Transaction is read-only');
  }
  return {txn, lc};
}

export async function open(
  dbName: string,
  kvStore: kv.Store,
  level: LogLevel,
): Promise<string> {
  const start = Date.now();
  isTesting && logCall('open', dbName);

  const lc = new LogContext(level).addContext('db', dbName);

  const lc2 = lc.addContext('rpc', 'open');
  lc2.debug?.('->', kvStore, level);

  if (dbName === '') {
    throw new Error('dbName must be non-empty');
  }
  if (connections.has(dbName)) {
    throw new Error(
      `Database "${dbName}" has already been opened. Please close it before opening it again`,
    );
  }

  const store = new dag.Store(kvStore);
  // TODO(arv): Maybe store the clientID as a promise instead to prevent race
  // conditions?
  const clientID = await sync.initClientID(kvStore);

  // Call concurrently with initClientID?
  await init(store);

  // TODO(arv): Maybe store an opened promise too and let all embed calls wait
  // for it.

  connections.set(dbName, {store, clientID, lc});
  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms, result=', clientID);
  return clientID;
}

export async function close(dbName: string): Promise<void> {
  const start = Date.now();
  isTesting && logCall('close', dbName);

  const connection = connections.get(dbName);
  if (!connection) {
    return;
  }
  const lc = connection.lc.addContext('rpc', 'close');
  lc.debug?.('->');
  const {store} = connection;
  await store.close();
  connections.delete(dbName);
  lc.debug?.('<- elapsed=', Date.now() - start, 'ms');
}

async function init(store: dag.Store): Promise<void> {
  await store.withWrite(async dagWrite => {
    const head = await dagWrite.read().getHead(db.DEFAULT_HEAD_NAME);
    if (!head) {
      await db.initDB(dagWrite, db.DEFAULT_HEAD_NAME);
    }
  });
}

export async function openTransaction(
  dbName: string,
  name: string | undefined,
  args: JSONValue | undefined,
  rebaseOpts: RebaseOpts | undefined,
): Promise<number> {
  isTesting && logCall('openTransaction', dbName, name, args, rebaseOpts);
  const {store, lc} = getConnection(dbName);
  return openTransactionImpl(
    lc,
    store,
    transactionsMap,
    name,
    args,
    rebaseOpts,
  );
}

export async function openTransactionImpl(
  lc: LogContext,
  store: dag.Store,
  transactions: Map<number, {txn: Transaction; lc: LogContext}>,
  name: string | undefined,
  args: ReadonlyJSONValue | undefined,
  rebaseOpts: RebaseOpts | undefined,
): Promise<number> {
  const start = Date.now();
  lc = lc.addContext('rpc', 'openTransaction');
  lc.debug?.('->', store, transactions, name, args, rebaseOpts);
  let txn: Transaction;

  if (name !== undefined) {
    const mutatorName = name;
    if (args === undefined) {
      throw new Error('args are required');
    }

    const lockStart = Date.now();
    lc.debug?.('Waiting for write lock...');

    const dagWrite = await store.write();
    lc.debug?.('...Write lock acquired in', Date.now() - lockStart, 'ms');
    let ok = false;
    try {
      let whence: db.Whence | undefined;
      let originalHash: string | undefined;
      if (rebaseOpts === undefined) {
        whence = db.whenceHead(db.DEFAULT_HEAD_NAME);
      } else {
        await validateRebase(rebaseOpts, dagWrite.read(), mutatorName, args);
        whence = db.whenceHash(rebaseOpts.basis);
        originalHash = rebaseOpts.original;
      }

      txn = await db.Write.newLocal(
        whence,
        mutatorName,
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
  } else {
    const dagRead = await store.read();
    txn = await db.fromWhence(db.whenceHead(db.DEFAULT_HEAD_NAME), dagRead);
  }

  const transactionID = transactionCounter++;
  transactions.set(transactionID, {txn, lc});
  lc.debug?.('<- elapsed=', Date.now() - start, 'ms, result=', transactionID);
  return transactionID;
}

export async function openIndexTransaction(dbName: string): Promise<number> {
  const start = Date.now();
  isTesting && logCall('openIndexTransaction', dbName);

  const transactionID = transactionCounter++;
  const connection = getConnection(dbName);

  const lc = connection.lc
    .addContext('rpc', 'openIndexTransaction')
    .addContext('txid', transactionID);
  lc.debug?.('->');
  const {store} = connection;

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
  transactionsMap.set(transactionID, {txn, lc});
  lc.debug?.('<- elapsed=', Date.now() - start, 'ms, result=', transactionID);
  return transactionID;
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
  if (original.meta().isLocal()) {
    const lm = original.meta().typed() as db.LocalMeta;
    if (lm.mutatorName() !== mutatorName) {
      throw new Error(
        `Inconsistent mutator: original: ${lm.mutatorName()}, request: ${mutatorName}`,
      );
    }
  } else {
    throw new Error('Internal programmer error: Commit is not a local commit');
  }

  // Ensure rebase and original commit mutation ids names match.
  const [, basis] = await db.readCommit(db.whenceHash(opts.basis), dagRead);
  if (basis.nextMutationID() !== original.mutationID()) {
    throw new Error(
      `Inconsistent mutation ID: original: ${original.mutationID()}, next: ${basis.nextMutationID()}`,
    );
  }

  // TODO: temporarily skipping check that args are the same.
  // https://github.com/rocicorp/repc/issues/151
}

export async function commitTransaction(
  transactionID: number,
  generateChangedKeys: boolean,
): Promise<CommitTransactionResponse> {
  isTesting && logCall('commitTransaction', transactionID, generateChangedKeys);
  return commitImpl(transactionsMap, transactionID, generateChangedKeys);
}

export async function commitImpl(
  transactionsMap: TransactionsMap,
  transactionID: number,
  generateChangedKeys: boolean,
): Promise<CommitTransactionResponse> {
  const start = Date.now();
  const {txn, lc} = getWriteTransaction(transactionID, transactionsMap);
  const lc2 = lc.addContext('rpc', 'commitTransaction');
  lc2.debug?.('->', generateChangedKeys);
  transactionsMap.delete(transactionID);

  if (txn instanceof db.Read) {
    throw new Error('Transaction is read-only');
  }

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

export async function closeTransaction(transactionID: number): Promise<void> {
  const start = Date.now();
  isTesting && logCall('closeTransaction', transactionID);

  const {txn, lc} = getTransaction(transactionID, transactionsMap);
  const lc2 = lc.addContext('rpc', 'closeTransaction');
  lc2.debug?.('->');
  txn.close();
  transactionsMap.delete(transactionID);
  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms');
}

export async function getRoot(
  dbName: string,
  headName: string = db.DEFAULT_HEAD_NAME,
): Promise<string> {
  const start = Date.now();
  isTesting && logCall('getRoot', dbName, headName);

  // TODO(arv): I don't think we ever call this with a headName.
  const {store, lc} = getConnection(dbName);
  const lc2 = lc.addContext('rpc', 'getRoot');
  lc2.debug?.('->', headName);
  const result = await db.getRoot(store, headName);
  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms, result=', result);
  return result;
}

export function has(transactionID: number, key: string): boolean {
  const start = Date.now();
  isTesting && logCall('has', transactionID, key);

  const {txn, lc} = getTransaction(transactionID, transactionsMap);
  const lc2 = lc.addContext('rpc', 'has');
  lc2.debug?.('->', key);
  const result = txn.asRead().has(key);
  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms, result=', result);
  return result;
}

export function get(transactionID: number, key: string): JSONValue | undefined {
  const start = Date.now();
  isTesting && logCall('get', transactionID, key);

  const {txn, lc} = getTransaction(transactionID, transactionsMap);
  const lc2 = lc.addContext('rpc', 'get');
  lc2.debug?.('->', key);
  const value = txn.asRead().get(key);
  const thawed = value && deepThaw(value);
  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms, result=', thawed);
  return thawed;
}

export async function scan(
  transactionID: number,
  scanOptions: db.ScanOptions,
  receiver: (
    primaryKey: string,
    secondaryKey: string | null,
    value: JSONValue,
  ) => void,
): Promise<void> {
  const start = Date.now();
  isTesting && logCall('scan', transactionID, scanOptions, receiver);

  const {txn, lc} = getTransaction(transactionID, transactionsMap);
  const lc2 = lc.addContext('rpc', 'scan');
  lc2.debug?.('->', scanOptions);
  await txn.asRead().scan(scanOptions, sr => {
    if (sr.type === db.ScanResultType.Error) {
      // repc didn't throw here, It just did error logging.
      throw sr.error;
    }
    const {val, key, secondaryKey} = sr.item;
    receiver(key, secondaryKey, deepThaw(val));
  });
  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms');
}

export async function put(
  transactionID: number,
  key: string,
  value: JSONValue,
): Promise<void> {
  const start = Date.now();
  isTesting && logCall('put', transactionID, key, value);

  const {txn, lc} = getWriteTransaction(transactionID, transactionsMap);
  const lc2 = lc.addContext('rpc', 'put');
  lc2.debug?.('->', key, value);
  await txn.put(lc2, key, deepFreeze(value));
  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms');
}

export async function del(
  transactionID: number,
  key: string,
): Promise<boolean> {
  const start = Date.now();
  isTesting && logCall('del', transactionID, key);

  const {txn, lc} = getWriteTransaction(transactionID, transactionsMap);
  const lc2 = lc.addContext('rpc', 'del');
  lc2.debug?.('->', key);
  const had = await txn.asRead().has(key);
  await txn.del(lc, key);
  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms, result=', had);
  return had;
}

export async function createIndex(
  transactionID: number,
  name: string,
  keyPrefix: string,
  jsonPointer: string,
): Promise<void> {
  const start = Date.now();
  isTesting &&
    logCall('createIndex', transactionID, name, keyPrefix, jsonPointer);
  const {txn, lc} = getWriteTransaction(transactionID, transactionsMap);
  const lc2 = lc.addContext('rpc', 'createIndex');
  lc2.debug?.('->', name, keyPrefix, jsonPointer);
  await txn.createIndex(lc, name, keyPrefix, jsonPointer);
  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms');
}

export async function dropIndex(
  transactionID: number,
  name: string,
): Promise<void> {
  const start = Date.now();
  isTesting && logCall('dropIndex', transactionID, name);

  const {txn, lc} = getWriteTransaction(transactionID, transactionsMap);
  const lc2 = lc.addContext('rpc', 'dropIndex');
  lc2.debug?.('->', name);
  await txn.dropIndex(name);
  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms');
}

export async function maybeEndTryPull(
  dbName: string,
  requestID: string,
  syncHead: string,
): Promise<MaybeEndTryPullResponse> {
  const start = Date.now();
  isTesting && logCall('maybeEndTryPull', dbName, requestID, syncHead);

  const connection = getConnection(dbName);
  const {store, lc} = connection;
  const lc2 = lc
    .addContext('rpc', 'maybeEndTryPull')
    .addContext('request_id', requestID);
  lc2.debug?.('->', syncHead);
  const result = await sync.maybeEndTryPull(store, lc2, {requestID, syncHead});
  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms, result=', result);
  return result;
}

export async function tryPush(
  dbName: string,
  req: TryPushRequest,
): Promise<HTTPRequestInfo | undefined> {
  const start = Date.now();
  isTesting && logCall('tryPush', dbName, req);

  const connection = getConnection(dbName);
  const {clientID, store, lc} = connection;
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

export async function beginTryPull(
  dbName: string,
  req: BeginTryPullRequest,
): Promise<BeginTryPullResponse> {
  const start = Date.now();
  isTesting && logCall('beginTryPull', dbName, req);

  const connection = getConnection(dbName);
  const {clientID, store, lc} = connection;
  const requestID = sync.newRequestID(clientID);
  const lc2 = lc
    .addContext('rpc', 'beginTryPull')
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
