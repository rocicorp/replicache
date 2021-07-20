import {RWLock} from './rw-lock.js';
import type {Read, Release, Store, Write} from './store.js';

export class IDBStore implements Store {
  private readonly _rwLock: RWLock = new RWLock();
  private readonly _db: Promise<IDBDatabase>;

  constructor(name: string) {
    this._db = openDatabase(name);
  }

  async read(): Promise<Read & Release> {
    const release = await this._rwLock.read();
    const db = await this._db;
    const tx = await readTransaction(db);
    return new ReadImpl(tx, release);
  }

  async write(): Promise<Write & Release> {
    const release = await this._rwLock.write();
    const db = await this._db;
    const tx = await writeTransaction(db);
    return new WriteImpl(tx, release);
  }

  async close(): Promise<void> {
    (await this._db).close();
  }

  static async dropStore(name: string): Promise<void> {
    await dropStore(name);
  }
}

class ReadImpl {
  private readonly _tx: IDBTransaction;
  private readonly _release: () => void;

  constructor(tx: IDBTransaction, release: () => void) {
    this._tx = tx;
    this._release = release;
  }

  release(): void {
    this._release();
  }

  async has(key: string): Promise<boolean> {
    return dbHas(this._tx, key);
  }

  async get(key: string): Promise<Uint8Array | undefined> {
    return dbGet(this._tx, key) as Promise<Uint8Array | undefined>;
  }
}

const deleteSentinel = null;
type DeleteSentinel = typeof deleteSentinel;

class WriteImpl {
  private readonly _tx: IDBTransaction;
  private readonly _pending: Map<string, Uint8Array | DeleteSentinel> =
    new Map();
  private readonly _release: () => void;

  constructor(tx: IDBTransaction, release: () => void) {
    this._tx = tx;
    this._release = release;
  }

  release(): void {
    this._release();
  }

  async has(key: string): Promise<boolean> {
    switch (this._pending.get(key)) {
      case undefined:
        return await dbHas(this._tx, key);
      case deleteSentinel:
        return false;
      default:
        return true;
    }
  }

  async get(key: string): Promise<Uint8Array | undefined> {
    const v = this._pending.get(key);
    switch (v) {
      case deleteSentinel:
        return undefined;
      case undefined:
        return (await dbGet(this._tx, key)) as Promise<Uint8Array | undefined>;
      default:
        return v as Uint8Array;
    }
  }

  asRead(): Read {
    return this;
  }

  async put(key: string, value: Uint8Array): Promise<void> {
    this._pending.set(key, value);
  }

  async del(key: string): Promise<void> {
    this._pending.set(key, deleteSentinel);
  }

  async commit(): Promise<void> {
    if (this._pending.size === 0) {
      return;
    }

    const tx = this._tx;

    registerTransaction(tx);
    const store = objectStore(tx);
    const ps = Array.from(this._pending, ([key, val]) => {
      if (val === null) {
        return wrap(store.delete(key));
      }
      return wrap(store.put(val, key));
    });
    await Promise.all(ps);
    const state = await transactionState(tx);

    if (state !== COMMITTED) {
      throw new Error('Transaction aborted');
    }
  }

  async rollback(): Promise<void> {
    if (this._pending.size === 0) {
      return;
    }

    switch (await transactionState(this._tx)) {
      case OPEN:
        break;
      case COMMITTED:
      case ABORTED:
        return;
    }

    const state = await abort(this._tx);
    if (state !== ABORTED) {
      throw new Error('Transaction abort failed');
    }
  }
}

/////////////////////

const RELAXED = {durability: 'relaxed'};
const OBJECT_STORE = 'chunks';

function readTransaction(idb: IDBDatabase): IDBTransaction {
  return idb.transaction(OBJECT_STORE, 'readonly');
}

function writeTransaction(idb: IDBDatabase): IDBTransaction {
  // TS does not have type defs for the third options argument yet.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore Expected 1-2 arguments, but got 3.ts(2554)
  return idb.transaction(OBJECT_STORE, 'readwrite', RELAXED);
}

function objectStore(tx: IDBTransaction): IDBObjectStore {
  return tx.objectStore(OBJECT_STORE);
}

function createObjectStore(idb: IDBDatabase): IDBObjectStore {
  return idb.createObjectStore(OBJECT_STORE);
}

async function openDatabase(name: string): Promise<IDBDatabase> {
  const req = indexedDB.open(name);
  req.onupgradeneeded = () => {
    const db = req.result;
    createObjectStore(db);
    db.onversionchange = () => db.close();
  };
  return wrap(req);
}

function dbGet(
  tx: IDBTransaction,
  key: IDBValidKey | IDBKeyRange,
): Promise<unknown> {
  return wrap(objectStore(tx).get(key));
}

async function dbHas(tx: IDBTransaction, key: string): Promise<boolean> {
  const c = await wrap(objectStore(tx).count(key));
  return c > 0;
}

function dropStore(name: string): Promise<IDBDatabase> {
  return wrap(indexedDB.deleteDatabase(name));
}

async function abort(tx: IDBTransaction): Promise<WriteState> {
  registerTransaction(tx);
  tx.abort();
  return await transactionState(tx);
}

function wrap<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const txStateMap: WeakMap<IDBTransaction, Promise<WriteState>> = new WeakMap();

const OPEN = 0;
const COMMITTED = 1;
const ABORTED = 2;

type WriteState = typeof OPEN | typeof COMMITTED | typeof ABORTED;

function registerTransaction(tx: IDBTransaction): IDBTransaction {
  if (txStateMap.has(tx)) {
    throw new Error('invalid state');
  }

  const p = new Promise((resolve, reject) => {
    tx.onabort = () => resolve(ABORTED);
    tx.oncomplete = () => resolve(COMMITTED);
    tx.onerror = () => reject(tx.error);
  });
  txStateMap.set(tx, p as Promise<WriteState>);
  return tx;
}

function transactionState(tx: IDBTransaction): Promise<WriteState> {
  return txStateMap.get(tx) || Promise.resolve(OPEN);
}
