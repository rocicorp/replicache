import {isChunkKey} from '../dag/mod';
import type {Read, Store, Value, Write} from './store';
import {deleteSentinel, WriteImplBase} from './write-impl-base';

function shouldCacheKey(key: string): boolean {
  return isChunkKey(key);
}

export class LazyStore implements Store {
  private readonly _cache: Cache<Value> = new Cache();
  private readonly _base: Store;

  constructor(cache: Store) {
    this._base = cache;
  }

  async read(): Promise<Read> {
    const baseRead = await this._base.read();
    return new ReadImpl(this._cache, baseRead);
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
    const baseWrite = await this._base.write();
    return new WriteImpl(this._cache, baseWrite);
  }

  async withWrite<R>(fn: (write: Write) => R | Promise<R>): Promise<R> {
    const write = await this.write();
    try {
      return await fn(write);
    } finally {
      write.release();
    }
  }

  close(): Promise<void> {
    return this._base.close();
  }

  get closed(): boolean {
    return this._base.closed;
  }
}

class ReadImpl implements Read {
  private readonly _cache: Cache<Value>;
  private readonly _baseRead: Read;

  constructor(cache: Cache<Value>, baseRead: Read) {
    this._cache = cache;
    this._baseRead = baseRead;
  }

  release() {
    this._baseRead.release();
  }

  get closed(): boolean {
    return this._baseRead.closed;
  }

  async has(key: string): Promise<boolean> {
    if (!shouldCacheKey(key)) {
      return this._baseRead.has(key);
    }

    const v = this._cache.get(key);
    if (v === undefined) {
      const v = await this._baseRead.get(key);
      if (v !== undefined) {
        this._cache.set(key, v);
        return true;
      }
      return false;
    }
    return true;
  }

  async get(key: string): Promise<Value | undefined> {
    if (!shouldCacheKey(key)) {
      return this._baseRead.get(key);
    }

    let v = this._cache.get(key);
    if (v === undefined) {
      v = await this._baseRead.get(key);
      if (v !== undefined) {
        this._cache.set(key, v);
      }
    }
    return v;
  }
}

class WriteImpl extends WriteImplBase implements Write {
  private readonly _cache: Cache<Value>;
  private readonly _baseWrite: Write;

  constructor(cache: Cache<Value>, baseWrite: Write) {
    super(new ReadImpl(cache, baseWrite));
    this._cache = cache;
    this._baseWrite = baseWrite;
  }

  async commit(): Promise<void> {
    // HOT. Do not allocate entry tuple and destructure.
    const ps: Promise<void>[] = [];
    this._pending.forEach((value, key) => {
      if (shouldCacheKey(key)) {
        if (value === deleteSentinel) {
          this._cache.delete(key);
        } else {
          this._cache.set(key, value);
        }
      }
      if (value === deleteSentinel) {
        ps.push(this._baseWrite.del(key));
      } else {
        ps.push(this._baseWrite.put(key, value));
      }
    });
    await Promise.all(ps);
    this._pending.clear();
    await this._baseWrite.commit();
  }
}

class Cache<V> {
  private readonly _map = new Map<string, V>();

  get(key: string): V | undefined {
    return this._map.get(key);
  }

  set(key: string, value: V): void {
    this._map.set(key, value);
  }

  delete(key: string): void {
    this._map.delete(key);
  }
}
