import {assertNumber, assertObject, assertString} from '../asserts';
import * as kv from '../kv/mod';

const IDB_NAME = 'replicache-dbs';
const KEY = 'dbs';

// TODO: make an opaque type
export type IndexDBName = string;

export type IndexedDBDatabase = {
  name: IndexDBName;
  replicacheFormatVersion: number;
  schemaVersion: string;
};

export type IndexedDBDatabaseRecord = Record<IndexDBName, IndexedDBDatabase>;

function assertIndexedDBDatabaseRecord(
  value: unknown,
): asserts value is IndexedDBDatabaseRecord {
  assertObject(value);
  for (const [name, db] of Object.entries(value)) {
    assertString(name);
    assertIndexedDBDatabase(db);
  }
}

function assertIndexedDBDatabase(
  value: unknown,
): asserts value is IndexedDBDatabase {
  assertObject(value);
  assertString(value.name);
  assertNumber(value.replicacheFormatVersion);
  assertString(value.schemaVersion);
}

export class IDBDatabasesStore {
  private readonly _kvStore: kv.Store;

  constructor(
    createKVStore: (name: string) => kv.Store = name => new kv.IDBStore(name),
  ) {
    this._kvStore = createKVStore(IDB_NAME);
  }

  putDatabase(db: IndexedDBDatabase): Promise<IndexedDBDatabaseRecord> {
    return this._kvStore.withWrite(async write => {
      const dbRecord = await this._getDatabases(write);
      dbRecord[db.name] = db;
      await write.put(KEY, dbRecord);
      await write.commit();
      return dbRecord;
    });
  }

  getDatabases(): Promise<IndexedDBDatabaseRecord> {
    return this._kvStore.withRead(async read => {
      return this._getDatabases(read);
    });
  }

  close(): Promise<void> {
    return this._kvStore.close();
  }

  private async _getDatabases(read: kv.Read): Promise<IndexedDBDatabaseRecord> {
    let dbRecord = await read.get(KEY);
    if (!dbRecord) {
      dbRecord = {};
    }
    assertIndexedDBDatabaseRecord(dbRecord);
    return dbRecord;
  }
}
