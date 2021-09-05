import {deleteSentinel, WriteImplBase} from './write-impl-base';
import type {Read, Store, Value, Write} from './store';
import {deepFreeze} from '../json';

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

  async withRead<R>(fn: (read: Read) => R | Promise<R>): Promise<R> {
    return fn(await this.read());
  }

  async write(): Promise<Write> {
    const db = await this._db;
    // TS does not have type defs for the third options argument yet.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Expected 1-2 arguments, but got 3.ts(2554)
    const tx = db.transaction(OBJECT_STORE, 'readwrite', RELAXED);
    return new WriteImpl(tx);
  }

  async withWrite<R>(fn: (write: Write) => R | Promise<R>): Promise<R> {
    return await fn(await this.write());
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

  async get(key: string): Promise<Value | undefined> {
    const v = await wrap(objectStore(this._tx).get(key));
    if (v instanceof Uint8Array) {
      return v;
    } else {
      return deepFreeze(v);
    }
  }

  release(): void {
    // Do nothing. We rely on IDB locking.
  }
}

class WriteImpl extends WriteImplBase {
  private readonly _tx: IDBTransaction;
  private readonly _onTxEnd: Promise<void>;
  private _txState = WriteState.OPEN;

  constructor(tx: IDBTransaction) {
    super(new ReadImpl(tx));
    this._tx = tx;
    this._onTxEnd = this._addTransactionListeners();
  }

  private async _addTransactionListeners(): Promise<void> {
    const tx = this._tx;
    const p: Promise<WriteState> = new Promise((resolve, reject) => {
      tx.onabort = () => resolve(WriteState.ABORTED);
      tx.oncomplete = () => resolve(WriteState.COMMITTED);
      tx.onerror = () => reject(tx.error);
    });

    // When the transaction completes/aborts, set the state.
    this._txState = await p;
  }

  async commit(): Promise<void> {
    if (this._pending.size === 0) {
      return;
    }

    const store = objectStore(this._tx);
    const ps = Array.from(this._pending, ([key, val]) => {
      if (val === deleteSentinel) {
        return wrap(store.delete(key));
      }
      return wrap(store.put(val, key));
    });
    await Promise.all(ps);
    await this._onTxEnd;

    if (this._txState === WriteState.ABORTED) {
      throw new Error('Transaction aborted');
    }
  }

  release(): void {
    // We rely on IDB locking so no need to do anything here.
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

export async function dropStore(name: string): Promise<void> {
  await wrap(indexedDB.deleteDatabase(name));
}
