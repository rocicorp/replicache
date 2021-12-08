import {Hash, isTempHash} from '../hash';
import type * as kv from '../kv/mod';
import {RWLock} from '../rw-lock';
import {Chunk, ChunkHasher, createChunk} from './chunk';
import type {Store, Read, Write} from './store';
import {getSizeOfValue as defaultGetSizeOfValue} from '../get-size-of-value';
import type {ReadonlyJSONValue} from '../mod';
import {GarbargeCollector, HeadChange} from './gc';

export class LazyStore implements Store {
  private readonly _rwLock = new RWLock();
  private readonly _heads = new Map<string, Hash>();
  private readonly _tempChunks = new Map<Hash, Chunk>();
  private readonly _sourceChunksCache: ChunksCache;
  private readonly _sourceStore: Store;
  private readonly _refCounts = new Map<Hash, number>();
  // TODO I don't think chunkHasher and assertValidHash are quite right, need to think those through
  private readonly _chunkHasher: ChunkHasher;
  private readonly _assertValidHash: (hash: Hash) => void;

  constructor(
    sourceStore: Store,
    cacheSizeLimit: number,
    chunkHasher: ChunkHasher,
    assertValidHash: (hash: Hash) => void,
    getSizeOfValue = defaultGetSizeOfValue,
  ) {
    this._sourceChunksCache = new ChunksCache(cacheSizeLimit, getSizeOfValue);
    this._sourceStore = sourceStore;
    this._chunkHasher = chunkHasher;
    this._assertValidHash = assertValidHash;
  }

  async read(): Promise<Read> {
    const release = await this._rwLock.read();
    return new LazyRead(
      this._heads,
      this._tempChunks,
      this._sourceChunksCache,
      this._sourceStore,
      release,
      this._assertValidHash,
    );
  }

  async withRead<R>(fn: (read: Read) => R | Promise<R>): Promise<R> {
    const read = await this.read();
    try {
      return await fn(read);
    } finally {
      read.close();
    }
  }

  async write(): Promise<Write> {
    const release = await this._rwLock.write();
    return new LazyWrite(
      this._heads,
      this._tempChunks,
      this._sourceChunksCache,
      this._sourceStore,
      this._refCounts,
      release,
      this._chunkHasher,
      this._assertValidHash,
    );
  }

  async withWrite<R>(fn: (Write: Write) => R | Promise<R>): Promise<R> {
    const write = await this.write();
    try {
      return await fn(write);
    } finally {
      write.close();
    }
  }

  async close(): Promise<void> {
    return;
  }
}

export class LazyRead implements Read {
  protected readonly _heads: Map<string, Hash> = new Map();
  protected readonly _tempChunks: Map<Hash, Chunk> = new Map();
  protected readonly _sourceChunksCache: ChunksCache;
  protected readonly _sourceStore: Store;
  private _sourceRead: Promise<Read> | undefined = undefined;
  private readonly _release: () => void;
  private _closed = false;
  readonly assertValidHash: (hash: Hash) => void;

  constructor(
    heads: Map<string, Hash>,
    tempChunks: Map<Hash, Chunk>,
    sourceChunksCache: ChunksCache,
    sourceStore: Store,
    release: () => void,
    assertValidHash: (hash: Hash) => void,
  ) {
    this._heads = heads;
    this._tempChunks = tempChunks;
    this._sourceChunksCache = sourceChunksCache;
    this._sourceStore = sourceStore;
    this._release = release;
    this.assertValidHash = assertValidHash;
  }

  async hasChunk(hash: Hash): Promise<boolean> {
    return (await this.getChunk(hash)) !== undefined;
  }

  async getChunk(hash: Hash): Promise<Chunk | undefined> {
    if (isTempHash(hash)) {
      return this._tempChunks.get(hash);
    }
    let chunk = this._sourceChunksCache.get(hash);
    if (chunk === undefined) {
      chunk = await (await this._getSourceRead()).getChunk(hash);
      if (chunk !== undefined) {
        this._sourceChunksCache.put(chunk);
      }
    }
    return chunk;
  }

  async getHead(name: string): Promise<Hash | undefined> {
    return this._heads.get(name);
  }

  close(): void {
    if (!this._closed) {
      this._release();
      this._sourceRead?.then(read => read.close());
      this._closed = true;
    }
  }

  get closed(): boolean {
    return this._closed;
  }

  private async _getSourceRead(): Promise<Read> {
    if (!this._sourceRead) {
      this._sourceRead = this._sourceStore.read();
    }
    return this._sourceRead;
  }
}

export class LazyWrite extends LazyRead implements Write {
  private readonly _refCounts: Map<Hash, number>;
  private readonly _chunkHasher: ChunkHasher;
  protected readonly _pendingHeadChanges = new Map<string, HeadChange>();
  protected readonly _pendingChunks = new Map<Hash, Chunk | undefined>();

  constructor(
    heads: Map<string, Hash>,
    tempChunks: Map<Hash, Chunk>,
    sourceChunksCache: ChunksCache,
    sourceStore: Store,
    refCounts: Map<Hash, number>,
    release: () => void,
    chunkHasher: ChunkHasher,
    assertValidHash: (hash: Hash) => void,
  ) {
    super(
      heads,
      tempChunks,
      sourceChunksCache,
      sourceStore,
      release,
      assertValidHash,
    );
    this._refCounts = refCounts;
    this._chunkHasher = chunkHasher;
  }
  createChunk = <V extends ReadonlyJSONValue>(
    data: V,
    refs: readonly Hash[],
  ): Chunk<V> => createChunk(data, refs, this._chunkHasher);

  async putChunk(c: Chunk): Promise<void> {
    const {hash, meta} = c;
    // TODO not sure this is really needed in this store
    this.assertValidHash(hash);
    if (meta.length > 0) {
      for (const h of meta) {
        this.assertValidHash(h);
      }
    }
    this._pendingChunks.set(hash, c);
  }
  async setHead(name: string, hash: Hash): Promise<void> {
    await this._setHead(name, hash);
  }
  async removeHead(name: string): Promise<void> {
    await this._setHead(name, undefined);
  }

  private async _setHead(name: string, hash: Hash | undefined): Promise<void> {
    const oldHash = await this.getHead(name);
    const v = this._pendingHeadChanges.get(name);
    if (v === undefined) {
      this._pendingHeadChanges.set(name, {new: hash, old: oldHash});
    } else {
      // Keep old if existing
      v.new = hash;
    }
  }

  override async hasChunk(hash: Hash): Promise<boolean> {
    return this._pendingChunks.get(hash) !== undefined || super.hasChunk(hash);
  }

  async getChunk(hash: Hash): Promise<Chunk | undefined> {
    if (this._pendingChunks.has(hash)) {
      return this._pendingChunks.get(hash);
    }
    return super.getChunk(hash);
  }

  async getHead(name: string): Promise<Hash | undefined> {
    const headChange = this._pendingHeadChanges.get(name);
    if (headChange) {
      return headChange.new;
    }
    return super.getHead(name);
  }

  async commit(): Promise<void> {
    const pendingRefCountUpdates = new Map<Hash, number | undefined>();
    const garbargeCollector = new GarbargeCollector(
      async (hash, count) => {
        pendingRefCountUpdates.set(hash, count);
      },
      async hash => {
        return (
          (pendingRefCountUpdates.has(hash)
            ? pendingRefCountUpdates.get(hash)
            : this._refCounts.get(hash)) || 0
        );
      },
      async hash => {
        this._pendingChunks.set(hash, undefined);
        pendingRefCountUpdates.set(hash, undefined);
      },
      async hash => {
        return (await this.getChunk(hash))?.meta;
      },
    );
    await garbargeCollector.collect(
      this._pendingHeadChanges.values(),
      new Set(this._pendingChunks.keys()),
    );

    this._pendingChunks.forEach((chunk, hash) => {
      if (isTempHash(hash)) {
        if (chunk) {
          this._tempChunks.set(hash, chunk);
        } else {
          this._tempChunks.delete(hash);
        }
      } else {
        if (chunk) {
          this._sourceChunksCache.put(chunk);
        } else {
          this._sourceChunksCache.delete(hash);
        }
      }
    });
    this._pendingHeadChanges.forEach((headChange, name) => {
      if (headChange.new) {
        this._heads.set(name, headChange.new);
      } else {
        this._heads.delete(name);
      }
    });
    pendingRefCountUpdates.forEach((count, hash) => {
      if (count) {
        this._refCounts.set(hash, count);
      } else {
        this._refCounts.delete(hash);
      }
    });
  }
}

type CacheEntry = {
  chunk: Chunk;
  size: number;
};

class ChunksCache {
  private readonly _cacheSizeLimit: number;
  private readonly _getSizeOfValue: (v: kv.Value) => number;
  private readonly _cacheEntries = new Map<Hash, CacheEntry>();
  private _size = 0;

  constructor(cacheSizeLimit: number, getSizeOfValue: (v: kv.Value) => number) {
    this._cacheSizeLimit = cacheSizeLimit;
    this._getSizeOfValue = getSizeOfValue;
  }

  get(hash: Hash): Chunk | undefined {
    const cacheEntry = this._cacheEntries.get(hash);
    if (cacheEntry) {
      this._cacheEntries.delete(hash);
      this._cacheEntries.set(hash, cacheEntry);
    }
    return cacheEntry?.chunk;
  }

  put(chunk: Chunk): void {
    const {hash} = chunk;
    const oldCacheEntry = this._cacheEntries.get(hash);
    if (oldCacheEntry) {
      this._size -= oldCacheEntry.size;
      this._cacheEntries.delete(hash);
    }
    const valueSize = this._getSizeOfValue(chunk.data);
    if (valueSize > this._cacheSizeLimit) {
      // this value cannot be cached due to its size
      // don't evict other entries to try to make room for it
      return;
    }
    this._size += valueSize;
    this._cacheEntries.set(hash, {chunk, size: valueSize});

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

  delete(hash: Hash): void {
    const cacheEntryToDelete = this._cacheEntries.get(hash);
    if (cacheEntryToDelete) {
      this._size -= cacheEntryToDelete.size;
    }
    this._cacheEntries.delete(hash);
  }
}
