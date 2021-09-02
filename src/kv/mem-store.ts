import {RWLock} from '../rw-lock';
import type {Read, Store, Value, Write} from './store';
import {deleteSentinel, WriteImplBase} from './write-impl-base';

export class MemStore implements Store {
  private readonly _map: Map<string, Value> = new Map();
  private readonly _rwLock = new RWLock();

  async read(): Promise<Read> {
    const release = await this._rwLock.read();
    return new ReadImpl(this._map, release);
  }

  async withRead<R>(fn: (read: Read) => R | Promise<R>): Promise<R> {
    let read;
    try {
      read = await this.read();
      return await fn(read);
    } finally {
      read?.release();
    }
  }

  async write(): Promise<Write> {
    const release = await this._rwLock.write();
    return new WriteImpl(this._map, release);
  }

  async withWrite<R>(fn: (write: Write) => R | Promise<R>): Promise<R> {
    let write;
    try {
      write = await this.write();
      return await fn(write);
    } finally {
      write?.release();
    }
  }

  async close(): Promise<void> {
    // No-op.
  }
}

class ReadImpl {
  private readonly _map: Map<string, Value>;
  readonly release: () => void;

  constructor(map: Map<string, Value>, relase: () => void) {
    this._map = map;
    this.release = relase;
  }

  async has(key: string): Promise<boolean> {
    return this._map.has(key);
  }

  async get(key: string): Promise<Value | undefined> {
    return this._map.get(key);
  }
}

class WriteImpl extends WriteImplBase {
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
