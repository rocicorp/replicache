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

    if (this._txState !== WriteState.COMMITTED) {
      throw new Error('Transaction aborted');
    }
  }

  async rollback(): Promise<void> {
    switch (this._txState) {
      case WriteState.OPEN:
        break;
      case WriteState.COMMITTED:
      case WriteState.ABORTED:
        return;
    }

    this._tx.abort();
    await this._onTxEnd;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore TS does not know that _txState may change between the check
    // above and here.
    if (this._txState !== WriteState.ABORTED) {
      throw new Error('Transaction abort failed');
    }
  }

  release(): void {
    if (this._txState === WriteState.OPEN && this._pending.size !== 0) {
      throw new Error(
        'IDBStore Write transaction is still open with pending writes',
      );
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
