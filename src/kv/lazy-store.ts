import {RWLock} from '../rw-lock';
import type {Read, Store, Value, Write} from './store';
import {deleteSentinel, WriteImplBase} from './write-impl-base';
import {getSizeOfValue} from '../get-size-of-value';

export class LazyStore implements Store {
  private readonly _cache: Cache;
  private readonly _rwLock = new RWLock();
  private readonly _base: Store;

  constructor(
    base: Store,
    cacheSizeLimit: number,
    shouldBePinned: (key: string) => boolean,
  ) {
    this._base = base;
    this._cache = new Cache(cacheSizeLimit, shouldBePinned);
  }

  async read(): Promise<Read> {
    const release = await this._rwLock.read();
    return new ReadImpl(this._cache, this._base, release);
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
    return new WriteImpl(
      this._cache,
      new ReadImpl(this._cache, this._base, release),
    );
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
  private readonly _cache: Cache;
  private readonly _release: () => void;
  private readonly _base: Store;
  private _baseRead: Read | undefined;
  private _closed = false;

  constructor(cache: Cache, base: Store, release: () => void) {
    this._cache = cache;
    this._base = base;
    this._release = release;
  }

  release() {
    if (this._baseRead) {
      this._baseRead.release();
    }
    this._release();
    this._closed = true;
  }

  get closed(): boolean {
    return this._closed;
  }

  async has(key: string): Promise<boolean> {
    return this._cache.has(key) || (await this.getBaseRead()).has(key);
  }

  async get(key: string): Promise<Value | undefined> {
    let v = this._cache.get(key);
    if (v === undefined) {
      v = await (await this.getBaseRead()).get(key);
      if (v !== undefined) {
        this._cache.set(key, v);
      }
    }
    return v;
  }

  private async getBaseRead(): Promise<Read> {
    if (!this._baseRead) {
      this._baseRead = await this._base.read();
    }
    return this._baseRead;
  }
}

class WriteImpl extends WriteImplBase implements Write {
  private readonly _cache: Cache;

  constructor(cache: Cache, read: Read) {
    super(read);
    this._cache = cache;
  }

  async commit(): Promise<void> {
    // HOT. Do not allocate entry tuple and destructure.
    const ps: Promise<void>[] = [];
    this._pending.forEach((value, key) => {
      if (value === deleteSentinel) {
        this._cache.delete(key);
      } else {
        this._cache.set(key, value);
      }
    });
    await Promise.all(ps);
    this._pending.clear();
    this.release();
  }
}

type CacheEntry = {
  value: Value;
  size: number;
};

class Cache {
  private readonly _cacheSizeLimit: number;
  private readonly _shouldBePinned: (key: string) => boolean;
  private readonly _pinned = new Map<string, Value>();
  private readonly _cacheEntries = new Map<string, CacheEntry>();
  private _size = 0;

  constructor(
    cacheSizeLimit: number,
    shouldBePinned: (key: string) => boolean,
  ) {
    this._cacheSizeLimit = cacheSizeLimit;
    this._shouldBePinned = shouldBePinned;
  }

  has(key: string): boolean {
    return this._cacheEntries.has(key);
  }

  get(key: string): Value | undefined {
    if (this._shouldBePinned(key)) {
      return this._pinned.get(key);
    }
    const cacheEntry = this._cacheEntries.get(key);
    if (cacheEntry) {
      this._cacheEntries.delete(key);
      this._cacheEntries.set(key, cacheEntry);
    }
    return cacheEntry && cacheEntry.value;
  }

  set(key: string, value: Value): void {
    if (this._shouldBePinned(key)) {
      this._pinned.set(key, value);
      return;
    }
    const oldValue = this._cacheEntries.get(key);
    if (oldValue) {
      this._size -= getSizeOfValue(oldValue);
    }
    const valueSize = getSizeOfValue(value);
    this._size += valueSize;
    this._cacheEntries.delete(key);
    this._cacheEntries.set(key, {value, size: valueSize});

    let curr = this._cacheEntries.entries().next();
    while (this._size > this._cacheSizeLimit && !curr.done) {
      const [keyToEvict, cacheEntryToEvict] = curr.value;
      this._size -= cacheEntryToEvict.size;
      this._cacheEntries.delete(keyToEvict);
      curr = this._cacheEntries.entries().next();
    }
  }

  delete(key: string): void {
    if (this._shouldBePinned(key)) {
      this._pinned.delete(key);
      return;
    }
    const cacheEntryToDelete = this._cacheEntries.get(key);
    if (cacheEntryToDelete) {
      this._size -= cacheEntryToDelete.size;
    }
    this._cacheEntries.delete(key);
  }
}
