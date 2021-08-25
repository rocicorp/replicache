import type * as kv from '../kv/mod';
import * as dag from '../dag/mod';
import * as db from '../db/mod';
import * as sync from '../sync/mod';
import * as utf8 from '../utf8.js';
import type {
  BeginTryPullRequest,
  BeginTryPullResponse,
  CommitTransactionResponse,
  HTTPRequestInfo,
  MaybeEndTryPullResponse,
  RebaseOpts,
  TryPushRequest,
} from '../repm-invoker';
import type {JSONValue} from '../json';

type ConnectionMap = Map<string, {store: dag.Store; clientID: string}>;

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
type TransactionsMap = Map<number, Transaction>;
const transactionsMap: TransactionsMap = new Map();

function getTransaction(
  transactionID: number,
  map: TransactionsMap,
): Transaction {
  const txn = map.get(transactionID);
  if (!txn) {
    throw new Error(`Transaction ${transactionID} is not open`);
  }
  return txn;
}

function getWriteTransaction(
  transactionID: number,
  map: TransactionsMap,
): db.Write {
  const txn = getTransaction(transactionID, map);
  if (txn instanceof db.Read) {
    throw new Error('Transaction is read-only');
  }
  return txn;
}

export async function open(dbName: string, kvStore: kv.Store): Promise<string> {
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

  connections.set(dbName, {store, clientID});
  return clientID;
}

export async function close(dbName: string): Promise<void> {
  const connection = connections.get(dbName);
  if (!connection) {
    return;
  }

  const {store} = connection;
  await store.close();
  connections.delete(dbName);
}

async function init(store: dag.Store): Promise<void> {
  await store.withWrite(async dagWrite => {
    const head = dagWrite.read().getHead(db.DEFAULT_HEAD_NAME);
    if (!head) {
      await db.initDB(dagWrite, db.DEFAULT_HEAD_NAME);
    }
  });
}

export async function openTransaction(
  dbName: string,
  name: string | undefined,
  args: string | undefined,
  rebaseOpts: RebaseOpts | undefined,
): Promise<number> {
  const {store} = getConnection(dbName);
  return openTransactionImpl(store, transactionsMap, name, args, rebaseOpts);
}

export async function openTransactionImpl(
  store: dag.Store,
  transactions: Map<number, Transaction>,
  name: string | undefined,
  args: string | undefined,
  rebaseOpts: RebaseOpts | undefined,
): Promise<number> {
  let txn: Transaction;

  if (name !== undefined) {
    const mutatorName = name;
    if (args === undefined) {
      throw new Error('args are required');
    }
    // let lock_timer = rlog.Timer.new();
    // debug!(ctx.lc, "Waiting for write lock...");

    const dagWrite = await store.write();
    let ok = false;
    try {
      // txn = await store.withWrite(async dagWrite => {
      //   debug!(
      //     ctx.lc,
      //     "...Write lock acquired in {}ms",
      //     lock_timer.elapsed_ms()
      // );
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
  transactions.set(transactionID, txn);
  return transactionID;
}

export async function openIndexTransaction(dbName: string): Promise<number> {
  const connection = getConnection(dbName);
  const {store} = connection;

  // let lock_timer = rlog.Timer.new();
  // debug!(ctx.lc, "Waiting for write lock...");
  return await store.withWrite(async dagWrite => {
    // debug!(
    //     ctx.lc,
    //     "...Write lock acquired in {}ms",
    //     lock_timer.elapsed_ms()
    // );
    const write = await db.Write.newIndexChange(
      db.whenceHead(db.DEFAULT_HEAD_NAME),
      dagWrite,
    );
    const transactionID = transactionCounter++;
    transactionsMap.set(transactionID, write);
    return transactionID;
  });
}

async function validateRebase(
  opts: RebaseOpts,
  dagRead: dag.Read,
  mutatorName: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _args: string,
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

export async function commit(
  transactionID: number,
  generateChangedKeys: boolean,
): Promise<CommitTransactionResponse> {
  return commitImpl(transactionsMap, transactionID, generateChangedKeys);
}

export async function commitImpl(
  transactionsMap: TransactionsMap,
  transactionID: number,
  generateChangedKeys: boolean,
): Promise<CommitTransactionResponse> {
  const txn = getWriteTransaction(transactionID, transactionsMap);
  transactionsMap.delete(transactionID);

  if (txn instanceof db.Read) {
    throw new Error('Transaction is read-only');
  }

  const headName = txn.isRebase() ? sync.SYNC_HEAD_NAME : db.DEFAULT_HEAD_NAME;
  const [hash, changedKeys] = await txn.commitWithChangedKeys(
    headName,
    generateChangedKeys,
  );
  return {ref: hash, changedKeys};
}

export async function closeTransactio(transactionID: number): Promise<void> {
  const txn = getTransaction(transactionID, transactionsMap);
  txn.close();
  transactionsMap.delete(transactionID);
}

export async function getRoot(
  dbName: string,
  headName: string = db.DEFAULT_HEAD_NAME,
): Promise<string> {
  // TODO(arv): I don't think we ever call this with a headName.
  const connection = getConnection(dbName);
  return await db.getRoot(connection.store, headName);
}

export function has(transactionID: number, key: string): boolean {
  const txn = getTransaction(transactionID, transactionsMap);
  return txn.asRead().has(utf8.encode(key));
}

export function get(transactionID: number, key: string): JSONValue | undefined {
  const txn = getTransaction(transactionID, transactionsMap);
  const buf = txn.asRead().get(utf8.encode(key));
  if (buf === undefined) {
    return undefined;
  }
  const s = utf8.decode(buf);
  return JSON.parse(s);
}

export async function scan(
  transactionID: number,
  scanOptions: db.ScanOptions,
  receiver: (
    primaryKey: string,
    secondaryKey: string | null,
    value: Uint8Array,
  ) => void,
): Promise<void> {
  const txn = getTransaction(transactionID, transactionsMap);
  await txn.asRead().scan(scanOptions, sr => {
    if (sr.type === db.ScanResultType.Error) {
      throw sr.error;
    }
    const {val, key, secondaryKey} = sr.item;
    receiver(utf8.decode(key), utf8.decode(secondaryKey), val);
  });
}

export async function put(
  transactionID: number,
  key: string,
  value: string,
): Promise<void> {
  const txn = getWriteTransaction(transactionID, transactionsMap);
  await txn.put(utf8.encode(key), utf8.encode(JSON.stringify(value)));
}

export async function del(transactionID: number, key: string): Promise<void> {
  const txn = getWriteTransaction(transactionID, transactionsMap);
  await txn.del(utf8.encode(key));
}

export async function createIndex(
  transactionID: number,
  name: string,
  keyPrefix: string,
  jsonPointer: string,
): Promise<void> {
  const txn = getWriteTransaction(transactionID, transactionsMap);
  await txn.createIndex(name, utf8.encode(keyPrefix), jsonPointer);
}

export async function dropIndex(
  transactionID: number,
  name: string,
): Promise<void> {
  const txn = getWriteTransaction(transactionID, transactionsMap);
  await txn.dropIndex(name);
}

export async function maybeEndTryPull(
  dbName: string,
  requestID: string,
  syncHead: string,
): Promise<MaybeEndTryPullResponse> {
  const connection = getConnection(dbName);
  const {store} = connection;
  // ctx.lc.add_context("request_id", &req.request_id);
  return await sync.maybeEndTryPull(store, {requestID, syncHead});
}

export function setLogLevel(level: 'debug' | 'info' | 'error'): void {
  console.log('TODO set level', level);
  // TODO(arv): Implement me
}

export async function tryPush(
  dbName: string,
  req: TryPushRequest,
): Promise<HTTPRequestInfo | undefined> {
  const connection = getConnection(dbName);
  const {clientID, store} = connection;
  const jsPusher = new sync.JSPusher(req.pusher);
  const requestID = sync.newRequestID(clientID);
  // ctx.lc.add_context("request_id", &request_id);
  return await sync.push(requestID, store, clientID, jsPusher, req);
}

export async function beginTryPull(
  dbName: string,
  req: BeginTryPullRequest,
): Promise<BeginTryPullResponse> {
  const connection = getConnection(dbName);
  const {clientID, store} = connection;
  const jsPuller = new sync.JSPuller(req.puller);
  const requestID = sync.newRequestID(clientID);
  // ctx.lc.add_context("request_id", &request_id);
  return await sync.beginPull(clientID, req, jsPuller, requestID, store);
}
