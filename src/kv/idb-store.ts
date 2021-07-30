import {deleteSentinel, WriteImplBase} from './write-impl-base.js';
import type {Read, Store, Write} from './store.js';

const RELAXED = {durability: 'relaxed'};
const OBJECT_STORE = 'chunks';

const enum WriteState {
  OPEN,
  COMMITTED,
  ABORTED,
}

export class IDBStore implements Store {
  private readonly _db: Promise<IDBDatabase>;

  constructor(name: string) {
    this._db = openDatabase(name);
  }

  async read(): Promise<Read> {
    const db = await this._db;
    const tx = db.transaction(OBJECT_STORE, 'readonly');
    return new ReadImpl(tx);
  }

  async write(): Promise<Write> {
    const db = await this._db;
    // TS does not have type defs for the third options argument yet.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Expected 1-2 arguments, but got 3.ts(2554)
    const tx = db.transaction(OBJECT_STORE, 'readwrite', RELAXED);
    return new WriteImpl(tx);
  }

  async close(): Promise<void> {
    (await this._db).close();
  }
}

class ReadImpl {
  private readonly _tx: IDBTransaction;

  constructor(tx: IDBTransaction) {
    this._tx = tx;
  }

  async has(key: string): Promise<boolean> {
    return (await wrap(objectStore(this._tx).count(key))) > 0;
  }

  async get(key: string): Promise<Uint8Array | undefined> {
    return wrap(objectStore(this._tx).get(key));
  }
}

class WriteImpl extends WriteImplBase {
  private readonly _tx: IDBTransaction;
  private _txState: Promise<WriteState> | undefined = undefined;

  constructor(tx: IDBTransaction) {
    super(new ReadImpl(tx));
    this._tx = tx;
  }

  private _registerTransaction(): void {
    const tx = this._tx;

    if (this._txState) {
      throw new Error('invalid state');
    }

    const p = new Promise((resolve, reject) => {
      tx.onabort = () => resolve(WriteState.ABORTED);
      tx.oncomplete = () => resolve(WriteState.COMMITTED);
      tx.onerror = () => reject(tx.error);
    });
    this._txState = p as Promise<WriteState>;
  }

  private _transactionState(): Promise<WriteState> {
    return this._txState || Promise.resolve(WriteState.OPEN);
  }

  async commit(): Promise<void> {
    if (this._pending.size === 0) {
      return;
    }

    const tx = this._tx;

    this._registerTransaction();
    const store = objectStore(tx);
    const ps = Array.from(this._pending, ([key, val]) => {
      if (val === deleteSentinel) {
        return wrap(store.delete(key));
      }
      return wrap(store.put(val, key));
    });
    await Promise.all(ps);
    const state = await this._transactionState();

    if (state !== WriteState.COMMITTED) {
      throw new Error('Transaction aborted');
    }
  }

  async rollback(): Promise<void> {
    if (this._pending.size === 0) {
      return;
    }

    switch (await this._transactionState()) {
      case WriteState.OPEN:
        break;
      case WriteState.COMMITTED:
      case WriteState.ABORTED:
        return;
    }

    const tx = this._tx;
    this._registerTransaction();
    tx.abort();
    const state = await this._transactionState();

    if (state !== WriteState.ABORTED) {
      throw new Error('Transaction abort failed');
    }
  }
}

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

function wrap<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
