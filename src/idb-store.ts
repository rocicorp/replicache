import {RWLock} from './rw-lock.js';
import type {Read, Release, Store, Write} from './store.js';

const RELAXED = {durability: 'relaxed'};
const OBJECT_STORE = 'chunks';

const OPEN = 0;
const COMMITTED = 1;
const ABORTED = 2;

type WriteState = typeof OPEN | typeof COMMITTED | typeof ABORTED;

export class IDBStore implements Store {
  private readonly _rwLock: RWLock = new RWLock();
  private readonly _db: Promise<IDBDatabase>;

  constructor(name: string) {
    this._db = openDatabase(name);
  }

  async read(): Promise<Read & Release> {
    const release = await this._rwLock.read();
    const db = await this._db;
    const tx = db.transaction(OBJECT_STORE, 'readonly');
    return new ReadImpl(tx, release);
  }

  async write(): Promise<Write & Release> {
    const release = await this._rwLock.write();
    const db = await this._db;
    // TS does not have type defs for the third options argument yet.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Expected 1-2 arguments, but got 3.ts(2554)
    const tx = db.transaction(OBJECT_STORE, 'readwrite', RELAXED);
    return new WriteImpl(tx, release);
  }

  async close(): Promise<void> {
    (await this._db).close();
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
    return hasImpl(this._tx, key);
  }

  async get(key: string): Promise<Uint8Array | undefined> {
    return getImpl(this._tx, key);
  }
}

const deleteSentinel = null;
type DeleteSentinel = typeof deleteSentinel;

class WriteImpl {
  private readonly _tx: IDBTransaction;
  private readonly _pending: Map<string, Uint8Array | DeleteSentinel> =
    new Map();
  private readonly _release: () => void;
  private _txState: Promise<WriteState> | undefined = undefined;

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
        return await hasImpl(this._tx, key);
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
        return await getImpl(this._tx, key);
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

  private _registerTransaction(): void {
    const tx = this._tx;

    if (this._txState) {
      throw new Error('invalid state');
    }

    const p = new Promise((resolve, reject) => {
      tx.onabort = () => resolve(ABORTED);
      tx.oncomplete = () => resolve(COMMITTED);
      tx.onerror = () => reject(tx.error);
    });
    this._txState = p as Promise<WriteState>;
  }

  private _transactionState(): Promise<WriteState> {
    return this._txState || Promise.resolve(OPEN);
  }

  async commit(): Promise<void> {
    if (this._pending.size === 0) {
      return;
    }

    const tx = this._tx;

    this._registerTransaction();
    const store = objectStore(tx);
    const ps = Array.from(this._pending, ([key, val]) => {
      if (val === null) {
        return wrap(store.delete(key));
      }
      return wrap(store.put(val, key));
    });
    await Promise.all(ps);
    const state = await this._transactionState();

    if (state !== COMMITTED) {
      throw new Error('Transaction aborted');
    }
  }

  async rollback(): Promise<void> {
    if (this._pending.size === 0) {
      return;
    }

    switch (await this._transactionState()) {
      case OPEN:
        break;
      case COMMITTED:
      case ABORTED:
        return;
    }

    // const state = await abort(this._tx);

    const tx = this._tx;
    this._registerTransaction();
    tx.abort();
    const state = await this._transactionState();

    if (state !== ABORTED) {
      throw new Error('Transaction abort failed');
    }
  }
}

/////////////////////

function objectStore(tx: IDBTransaction): IDBObjectStore {
  return tx.objectStore(OBJECT_STORE);
}

async function openDatabase(name: string): Promise<IDBDatabase> {
  const req = indexedDB.open(name);
  req.onupgradeneeded = () => {
    const db = req.result;
    db.createObjectStore(OBJECT_STORE);
    db.onversionchange = () => db.close();
  };
  return wrap(req);
}

function getImpl(
  tx: IDBTransaction,
  key: IDBValidKey | IDBKeyRange,
): Promise<Uint8Array | undefined> {
  return wrap(objectStore(tx).get(key));
}

async function hasImpl(tx: IDBTransaction, key: string): Promise<boolean> {
  return (await wrap(objectStore(tx).count(key))) > 0;
}

function wrap<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
