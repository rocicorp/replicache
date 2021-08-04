import {RWLock} from '../rw-lock.js';
import type {Read, Store, Write} from './store.js';
import {deleteSentinel, WriteImplBase} from './write-impl-base.js';

export class MemStore implements Store {
  private readonly _map: Map<string, Uint8Array> = new Map();
  private readonly _rwLock = new RWLock();

  async read(): Promise<Read> {
    const release = await this._rwLock.read();
    return new ReadImpl(this._map, release);
  }

  async write(): Promise<Write> {
    const release = await this._rwLock.write();
    return new WriteImpl(this._map, release);
  }

  async close(): Promise<void> {
    // No-op.
  }
}

class ReadImpl {
  private readonly _map: Map<string, Uint8Array>;
  readonly release: () => void;

  constructor(map: Map<string, Uint8Array>, relase: () => void) {
    this._map = map;
    this.release = relase;
  }

  async has(key: string): Promise<boolean> {
    return this._map.has(key);
  }

  async get(key: string): Promise<Uint8Array | undefined> {
    return this._map.get(key);
  }
}

class WriteImpl extends WriteImplBase {
  private readonly _map: Map<string, Uint8Array>;

  constructor(map: Map<string, Uint8Array>, release: () => void) {
    super(new ReadImpl(map, release));
    this._map = map;
  }

  async commit(): Promise<void> {
    for (const [k, v] of this._pending) {
      if (v === deleteSentinel) {
        this._map.delete(k);
      } else {
        this._map.set(k, v);
      }
    }
    this._pending.clear();
  }

  async rollback(): Promise<void> {
    this._pending.clear();
  }
}
