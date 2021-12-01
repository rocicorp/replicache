import {RWLock} from '../rw-lock';
import type {Read, Store, Value, Write} from './store';
import {deleteSentinel, WriteImplBase} from './write-impl-base';

export class MemStore implements Store {
  // protected to allow test sub class to use it.
  protected readonly _map: Map<string, Value> = new Map();
  private readonly _rwLock = new RWLock();
  private _closed = false;

  async read(): Promise<Read> {
    const release = await this._rwLock.read();
    return new ReadImpl(this._map, release);
  }

  async withRead<R>(fn: (read: Read) => R | Promise<R>): Promise<R> {
    const read = await this.read();
    try {
      return await fn(read);
    } finally {
      read.release();
    }
  }

  async write(): Promise<Write> {
    const release = await this._rwLock.write();
    return new WriteImpl(this._map, release);
  }

  async withWrite<R>(fn: (write: Write) => R | Promise<R>): Promise<R> {
    const write = await this.write();
    try {
      return await fn(write);
    } finally {
      write.release();
    }
  }

  async close(): Promise<void> {
    this._closed = true;
  }

  get closed(): boolean {
    return this._closed;
  }
}

class ReadImpl implements Read {
  private readonly _map: Map<string, Value>;
  private readonly _release: () => void;
  private _closed = false;

  constructor(map: Map<string, Value>, release: () => void) {
    this._map = map;
    this._release = release;
  }

  release() {
    this._release();
    this._closed = true;
  }

  get closed(): boolean {
    return this._closed;
  }

  async has(key: string): Promise<boolean> {
    return this._map.has(key);
  }

  async get(key: string): Promise<Value | undefined> {
    return this._map.get(key);
  }
}

class WriteImpl extends WriteImplBase implements Write {
  private readonly _map: Map<string, Value>;

  constructor(map: Map<string, Value>, release: () => void) {
    super(new ReadImpl(map, release));
    this._map = map;
  }

  async commit(): Promise<void> {
    // HOT. Do not allocate entry tuple and destructure.
    this._pending.forEach((value, key) => {
      if (value === deleteSentinel) {
        this._map.delete(key);
      } else {
        this._map.set(key, value);
      }
    });
    this._pending.clear();
    this.release();
  }
}
