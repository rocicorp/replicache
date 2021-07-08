import {RWLock} from './rw-lock.js';
import type {Read, Store, Write} from './store.js';

interface Release {
  release(): void;
}

export class MemStore implements Store {
  private readonly _map: Map<string, Uint8Array> = new Map();
  private readonly _rwLock: RWLock = new RWLock();

  async read(): Promise<Read & Release> {
    const release = await this._rwLock.read();
    return new ReadImpl(this._map, release);
  }

  async write(): Promise<Write & Release> {
    const release = await this._rwLock.write();
    return new WriteImpl(this._map, release);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async close(): Promise<void> {}
}

class ReadImpl {
  private readonly _map: Map<string, Uint8Array>;
  private readonly _release: () => void;

  constructor(map: Map<string, Uint8Array>, release: () => void) {
    this._map = map;
    this._release = release;
  }

  release(): void {
    this._release();
  }

  async has(key: string): Promise<boolean> {
    return this._map.has(key);
  }

  async get(key: string): Promise<Uint8Array | undefined> {
    return this._map.get(key);
  }
}

const deleteSentinel = null;
type DeleteSentinel = typeof deleteSentinel;

class WriteImpl {
  private readonly _map: Map<string, Uint8Array>;
  private readonly _pending: Map<string, Uint8Array | DeleteSentinel> =
    new Map();
  private readonly _release: () => void;

  constructor(map: Map<string, Uint8Array>, release: () => void) {
    this._map = map;
    this._release = release;
  }

  release(): void {
    this._release();
  }

  async has(key: string): Promise<boolean> {
    switch (this._pending.get(key)) {
      case undefined:
        return this._map.has(key);
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
        return this._map.get(key);
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
