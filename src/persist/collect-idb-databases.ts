import * as kv from '../kv/mod';
import * as dag from '../dag/mod';
import {ClientMap, getClients} from './clients.js';
import {assertNotTempHash} from '../hash.js';
import {dropStore} from '../kv/idb-store.js';
import type {IDBDatabasesStore, IndexedDBDatabase} from './idb-databases-store';
import {initBgIntervalProcess} from './bg-interval.js';
import type {LogContext} from '@rocicorp/logger';
import {sleep} from '../sleep.js';
import {AbortError} from '../abort-error.js';
import {REPLICACHE_FORMAT_VERSION} from '../replicache.js';

// How frequently to try to collect
const COLLECT_INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours

// If an IDB database is older than MAX_AGE, then it can be collected.
const MAX_AGE = 3 * 30 * 24 * 60 * 60 * 1000; // 3 months

// We delay the initial collection to prevent doing it at startup.
const COLLECT_DELAY = 5 * 60 * 1000; // 5 minutes

export function initCollectIDBDatabases(
  idbDatabasesStore: IDBDatabasesStore,
  lc: LogContext,
  signal: AbortSignal,
): void {
  void sleepFiveAndCollect(idbDatabasesStore, signal);

  initBgIntervalProcess(
    'CollectIDBDatabases',
    async () => {
      await collectIDBDatabases(
        idbDatabasesStore,
        signal,
        Date.now(),
        MAX_AGE,
        undefined,
      );
    },
    COLLECT_INTERVAL_MS,
    lc,
    signal,
  );
}

async function sleepFiveAndCollect(
  idbDatabasesStore: IDBDatabasesStore,
  signal: AbortSignal,
) {
  try {
    await sleep(COLLECT_DELAY, signal);

    await collectIDBDatabases(
      idbDatabasesStore,
      signal,
      Date.now(),
      MAX_AGE,
      defaultNewDagStore,
    );
  } catch (e) {
    if (e instanceof AbortError) {
      return;
    }
    throw e;
  }
}

export async function collectIDBDatabases(
  idbDatabasesStore: IDBDatabasesStore,
  signal: AbortSignal,
  now: number,
  maxAge: number,
  newDagStore = defaultNewDagStore,
): Promise<void> {
  const databases = await idbDatabasesStore.getDatabases();

  const dbs = Object.values(databases) as IndexedDBDatabase[];
  const canCollectResults = await Promise.all(
    dbs.map(
      async db =>
        [
          db.name,
          await canCollectDatabase(db, now, maxAge, newDagStore),
        ] as const,
    ),
  );

  const namesToRemove = canCollectResults
    .filter(result => result[1])
    .map(result => result[0]);

  // Try to remove the databases in parallel. Don't let a single reject fail the
  // other ones. We will check for failures afterwards.
  const dropStoreResults = await Promise.allSettled(
    namesToRemove.map(async name => {
      await dropStore(name);
      return name;
    }),
  );

  const idbRemovedNames: string[] = [];
  const errors: unknown[] = [];
  for (const result of dropStoreResults) {
    if (result.status === 'fulfilled') {
      idbRemovedNames.push(result.value);
    } else {
      errors.push(result.reason);
    }
  }

  if (idbRemovedNames.length && !signal.aborted) {
    // Remove the database name from the meta table.
    await idbDatabasesStore.deleteDatabases(idbRemovedNames);
  }

  if (errors.length) {
    throw errors[0];
  }
}

function defaultNewDagStore(name: string): dag.Store {
  const perKvStore = new kv.IDBStore(name);
  return new dag.StoreImpl(perKvStore, dag.throwChunkHasher, assertNotTempHash);
}

async function canCollectDatabase(
  db: IndexedDBDatabase,
  now: number,
  maxAge: number,
  newDagStore: typeof defaultNewDagStore,
): Promise<boolean> {
  if (db.replicacheFormatVersion > REPLICACHE_FORMAT_VERSION) {
    return false;
  }

  // 0 is used in testing
  if (db.lastOpenedTimestampMS !== undefined) {
    return now - db.lastOpenedTimestampMS >= maxAge;
  }

  // For legacy databases we do not have a lastOpenedTimestampMS so we check the
  // time stamps of the clients
  const perdag = newDagStore(db.name);
  const clientMap = await perdag.withRead(getClients);
  await perdag.close();

  return allClientsOlderThan(clientMap, now, maxAge);
}

function allClientsOlderThan(
  clients: ClientMap,
  now: number,
  maxAge: number,
): boolean {
  for (const client of clients.values()) {
    if (now - client.heartbeatTimestampMs < maxAge) {
      return false;
    }
  }
  return true;
}
