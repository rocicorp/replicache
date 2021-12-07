import {Hash, isTempHash} from '../hash';
import type * as kv from '../kv/mod';
import { RWLock } from '../rw-lock';
import type {Chunk, ChunkHasher} from './chunk';
import type {Store, Read, Write} from './store'
import {getSizeOfValue as defaultGetSizeOfValue} from '../get-size-of-value';

export class LazyStore implements Store {
  private readonly _rwLock = new RWLock();
  private readonly _heads: Map<string, Hash> = new Map();
  private readonly _tempChunks: Map<Hash, Chunk> = new Map();
  private readonly _sourceChunksCache: ChunksCache;
  private readonly _sourceStore: Store;
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
    return new ReadImpl(this._heads, this._tempChunks, this._sourceChunksCache, this._sourceStore, this._assertValidHash, release);
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
    return new Write(
      await this._kv.write(),
      this._chunkHasher,
      this._assertValidHash,
    );
  }

  async withWrite<R>(fn: (Write: Write) => R | Promise<R>): Promise<R> {
    return this._kv.withWrite(kvw =>
      fn(new Write(kvw, this._chunkHasher, this._assertValidHash)),
    );
  }

  async close(): Promise<void> {
    await this._kv.close();
  }
}

export class ReadImpl implements Read {
  private readonly _heads: Map<string, Hash> = new Map();
  private readonly _tempChunks: Map<Hash, Chunk> = new Map();
  private readonly _sourceChunksCache: ChunksCache;
  private readonly _sourceStore: Store;
  readonly assertValidHash: (hash: Hash) => void;
  private readonly _release: () => void;
  private _closed = false;

  constructor(heads: Map<string, Hash>, tempChunks: Map<Hash, Chunk>, sourceChunksCache: ChunksCache, sourceStore: Store, assertValidHash: (hash: Hash) => void, release: () => void) {
    this._heads = heads;
    this._tempChunks = tempChunks;
    this._sourceChunksCache = sourceChunksCache;
    this._sourceStore = sourceStore;
    this.assertValidHash = assertValidHash;
    this._release = release;
  }

  async hasChunk(hash: Hash): Promise<boolean> {
    return await (await this.getChunk(hash)) !== undefined
  }

  async getChunk(hash: Hash): Promise<Chunk | undefined> {
    if (isTempHash(hash)) {
      return this._tempChunks.get(hash);
    }


    let v = this._cache.get(key);
    if (v === undefined) {
      v = await (await this._getBaseRead()).get(key);
      if (v !== undefined) {
        this._cache.set(key, v);
      }
    }
    return v;


    const data = await this._tx.get(chunkDataKey(hash));
    if (data === undefined) {
      return undefined;
    }

    const refsVal = await this._tx.get(chunkMetaKey(hash));
    let refs: readonly Hash[];
    if (refsVal !== undefined) {
      assertMeta(refsVal);
      refs = refsVal;
    } else {
      refs = [];
    }
    return createChunkWithHash(hash, data, refs);
  }

  async getHead(name: string): Promise<Hash | undefined> {
    return this._heads.get(name);
  }

  close(): void {
    if (!this._closed) {
      this._release();
      this._closed = true;
    }
  }

  get closed(): boolean {
    return this._closed;
  }
}

type CacheEntry = {
  chunk: Chunk;
  size: number;
};

class ChunksCache {
  private readonly _cacheSizeLimit: number;
  private readonly _getSizeOfValue: (v: Value) => number;
  private readonly _cacheEntries = new Map<Hash, CacheEntry>();
  private _size = 0;

  constructor(
    cacheSizeLimit: number,
    getSizeOfValue: (v: kv.Value) => number,
  ) {
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