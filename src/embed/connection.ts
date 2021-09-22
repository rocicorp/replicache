import type * as kv from '../kv/mod';
import type * as dag from '../dag/mod';
import * as db from '../db/mod';
import * as sync from '../sync/mod';
import type {OpenResponse} from '../repm-invoker';
import type {LogContext} from '../logger';
import {migrate} from '../migrate/migrate';

export async function open(
  dbName: string,
  kvStore: kv.Store,
  dagStore: dag.Store,
  lc: LogContext,
): Promise<OpenResponse> {
  const start = Date.now();

  const lc2 = lc.addContext('rpc', 'open');
  lc2.debug?.('->', kvStore);

  if (dbName === '') {
    throw new Error('dbName must be non-empty');
  }

  await migrate(kvStore);

  // TODO(arv): Maybe store the clientID as a promise instead to prevent race
  // conditions?
  const clientID = await sync.initClientID(kvStore);

  // Call concurrently with initClientID?
  await init(dagStore);

  // TODO(arv): Maybe store an opened promise too and let all embed calls wait
  // for it.

  lc2.debug?.('<- elapsed=', Date.now() - start, 'ms, result=', clientID);
  return {clientID};
}

async function init(dagStore: dag.Store): Promise<void> {
  await dagStore.withWrite(async dagWrite => {
    const head = await dagWrite.getHead(db.DEFAULT_HEAD_NAME);
    if (!head) {
      await db.initDB(dagWrite, db.DEFAULT_HEAD_NAME);
    }
  });
}
