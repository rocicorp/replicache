import {RWLock} from '../rw-lock';
import type {Read, Store, Value, Write} from './store';
import {deleteSentinel, WriteImplBase} from './write-impl-base';
import {getSizeOfValue as defaultGetSizeOfValue} from '../get-size-of-value';
export class LazyStore implements Store {
  private readonly _cache: Cache;
  private readonly _rwLock = new RWLock();
  private readonly _baseStore: Store;

  /**
   * Store which lazily loads values from a base store and then caches them in memory.
   *
   * Writes only manipulate the in memory cache (thus values must be persisted to the
   * base store through a separate process).
   *
   * The memory caches size is limited to `cacheSizeLimit`, and values are evicted in an LRU
   * fashion.  `shouldBePinned` enables exempting some keys from eviction.  This mechanism
   * should be used to prevent values not persisted to the base store from being lost.
   * Values whose keys are pinned cannot be evicted, and their sizes are not included in the current
   * cache size. Once a value is persisted to the base store, its temp key for which `shouldBePinned`
   * is `true` can be deleted, and it can be re-put with a key for which `shouldBePinned` is false (making
   * it subject to cache eviction, which is safe since it is now persisted).
   *
   * @param baseStore Store to lazy load and cache values from.
   * @param cacheSizeLimit Limit in bytes.  Size of values is determined using `getSizeOfValue`.  Keys
   * do not count towards cache size.  Pinned values (`shouldBePinned`) do not count towards cache
   * size.
   * @param shouldBePinned A predicate for determining if a key should be pinned.  Keys
   * which are not persisted to the underlying base store should be pinned, as this store does
   * not write through to the base store (it assumes values are persisted to base store via
   * a separate process).
   * @param getSizeOfValue Function for measure the size in bytes of a value
   */
  constructor(
    baseStore: Store,
    cacheSizeLimit: number,
    shouldBePinned: (key: string) => boolean,
    getSizeOfValue = defaultGetSizeOfValue,
  ) {
    this._baseStore = baseStore;
    this._cache = new Cache(cacheSizeLimit, shouldBePinned, getSizeOfValue);
  }

  async read(): Promise<Read> {
    const release = await this._rwLock.read();
    return new ReadImpl(this._cache, this._baseStore, release);
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
      new ReadImpl(this._cache, this._baseStore, release),
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
    return this._baseStore.close();
  }

  get closed(): boolean {
    return this._baseStore.closed;
  }
}

class ReadImpl implements Read {
  private readonly _cache: Cache;
  private readonly _release: () => void;
  private readonly _base: Store;
  private _baseRead: Promise<Read> | undefined = undefined;
  private _closed = false;

  constructor(cache: Cache, base: Store, release: () => void) {
    this._cache = cache;
    this._base = base;
    this._release = release;
  }

  release() {
    if (this._baseRead) {
      void this._baseRead.then((read: Read) => read.release());
    }
    this._release();
    this._closed = true;
  }

  get closed(): boolean {
    return this._closed;
  }

  async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== undefined;
  }

  async get(key: string): Promise<Value | undefined> {
    let v = this._cache.get(key);
    if (v === undefined) {
      v = await (await this._getBaseRead()).get(key);
      if (v !== undefined) {
        this._cache.set(key, v);
      }
    }
    return v;
  }

  private async _getBaseRead(): Promise<Read> {
    if (!this._baseRead) {
      this._baseRead = this._base.read();
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
  private readonly _getSizeOfValue: (v: Value) => number;
  private readonly _pinned = new Map<string, Value>();
  private readonly _cacheEntries = new Map<string, CacheEntry>();
  private _size = 0;

  constructor(
    cacheSizeLimit: number,
    shouldBePinned: (key: string) => boolean,
    getSizeOfValue: (v: Value) => number,
  ) {
    this._cacheSizeLimit = cacheSizeLimit;
    this._shouldBePinned = shouldBePinned;
    this._getSizeOfValue = getSizeOfValue;
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
    return cacheEntry?.value;
  }

  set(key: string, value: Value): void {
    if (this._shouldBePinned(key)) {
      this._pinned.set(key, value);
      return;
    }
    const oldCacheEntry = this._cacheEntries.get(key);
    if (oldCacheEntry) {
      this._size -= oldCacheEntry.size;
      this._cacheEntries.delete(key);
    }
    const valueSize = this._getSizeOfValue(value);
    if (valueSize > this._cacheSizeLimit) {
      // this value cannot be cached due to its size
      // don't evict other entries to try to make room for it
      return;
    }
    this._size += valueSize;
    this._cacheEntries.set(key, {value, size: valueSize});

    if (this._size <= this._cacheSizeLimit) {
      return;
    }
    for (const entry of this._cacheEntries) {
      if (this._size <= this._cacheSizeLimit) {
        break;
      }
      const [keyToEvict, cacheEntryToEvict] = entry;
      this._size -= cacheEntryToEvict.size;
      this._cacheEntries.delete(keyToEvict);
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
