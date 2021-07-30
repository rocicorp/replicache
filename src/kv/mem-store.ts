import type {Read, Store, Write} from './store.js';
import {deleteSentinel, WriteImplBase} from './write-impl-base.js';

export class MemStore implements Store {
  private readonly _map: Map<string, Uint8Array> = new Map();

  async read(): Promise<Read> {
    return new ReadImpl(this._map);
  }

  async write(): Promise<Write> {
    return new WriteImpl(this._map);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async close(): Promise<void> {}
}

class ReadImpl {
  private readonly _map: Map<string, Uint8Array>;

  constructor(map: Map<string, Uint8Array>) {
    this._map = map;
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

  constructor(map: Map<string, Uint8Array>) {
    super(new ReadImpl(map));
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
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async rollback(): Promise<void> {}
}
