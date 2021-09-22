import type * as kv from '../kv/mod';
import * as dag from '../dag/mod';
import * as db from '../db/mod';
import * as sync from '../sync/mod';
import type {
  BeginPullRequest,
  BeginPullResponse,
  HTTPRequestInfo,
  MaybeEndPullResponse,
  OpenResponse,
  TryPushRequest,
} from '../repm-invoker';
import type {LogContext} from '../logger';
import {migrate} from '../migrate/migrate';

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

async function init(dagStore: dag.Store): Promise<void> {
  await dagStore.withWrite(async dagWrite => {
    const head = await dagWrite.getHead(db.DEFAULT_HEAD_NAME);
    if (!head) {
      await db.initDB(dagWrite, db.DEFAULT_HEAD_NAME);
    }
  });
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
