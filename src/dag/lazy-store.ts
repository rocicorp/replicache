import {Hash, isTempHash} from '../hash';
import type * as kv from '../kv/mod';
import {RWLock} from '../rw-lock';
import {Chunk, ChunkHasher, createChunk} from './chunk';
import type {Store, Read, Write} from './store';
import {getSizeOfValue as defaultGetSizeOfValue} from '../json';
import type {ReadonlyJSONValue} from '../mod';
import {
  computeRefCountUpdates,
  GarbageCollectionDelegate,
  HeadChange,
} from './gc';
import {assert, assertNotUndefined} from '../asserts';

/**
 * DAG Store which lazily loads values from a source store and then caches
 * them in an LRU cache.  The memory cache for chunks from the source store
 * size is limited to `sourceCacheSizeLimit` bytes, and values are evicted in an LRU
 * fashion.  The purpose of this store is to avoid holding the entire client view
 * (i.e. the source store's content) in each tab's JavaScript heap.
 *
 * This store's heads are independent from the heads of source store, and are only
 * stored in memory.
 *
 * Chunks which are put with a temp hash (see #isTempHash) are assumed to not be
 * persisted to the source store and thus are cached seperatly from the source store
 * chunks.  These temp chunks cannot be evicited, and their sizes are not counted
 * towards the source chunk cache size.  A temp chunk will be deleted if it is no longer
 * reachable from one of this store's heads.
 *
 * Writes only manipulate the in memory state of this store and do not alter the source
 * store.  Thus values must be written to the source store through a separate process.
 *
 * Intended use:
 * 1. source store is the 'perdag', a slower persistent store (i.e. dag.StoreImpl using a kv.IDBStore)
 * 2. this store's 'main' head is initialized to the hash of a chunk containing a snapshot commit
 *    in the 'perdag'
 * 3. reads from this store lazily read chunks from the source store and cache them
 * 3. writes are initially made to this store using temp hashes (i.e. temp chunks)
 * 4. writes are asynchornously persisted to the perdag through a seperate process
 *    See {@link persist}}. This process gathers all temp chunks from this dag, computes
 *    real hashes for them and then writes them to the perdag.  It then replaces in this dag
 *    all the temp chunks written to the perdag with chunks with permanent hashes.  This
 *    results in the temp chunks being deleted from this dag and the chunks with permanent
 *    hashes being placed in this dag's LRU cache of source chunks.
 *
 * @param sourceStore Store to lazy load and cache values from.
 * @param sourceCacheSizeLimit Size limit in bytes for cache of chunks loaded from `sourceStore`.
 * Size of values is determined using `getSizeOfValue`.  Keys do not count towards cache size.
 * Chunks with temp hashes do not count towards cache size.
 * @param getSizeOfValue Function for measure the size in bytes of a value
 */
export class LazyStore implements Store {
  /**
   * This lock is used to ensure correct isolation of Reads and Writes.  Multiple Reads
   * are allowed in parallel but only a single Write.  Reads and Writes see a isolated
   * view of the store (corresponding to the Serializable level of transaction isolation
   * defined in the SQL standard).
   *
   * To ensure these semantics the read lock must be acquired when a Read is created
   * and held til it is closed, and a Write lock must be acquired when a Write is
   * created and held til it is commited.
   *
   * Code must have a read or write lock to
   * - read `heads`
   * - read `tempChunks`
   * - read `_sourceStore`
   * - read and write `_sourceChunksCache`
   * - read and write `_refCounts`
   * and must have a write lock to
   * - write `heads`
   * - write `tempChunks`
   */
  private readonly _rwLock = new RWLock();
  private readonly _heads = new Map<string, Hash>();
  private readonly _tempChunks = new Map<Hash, Chunk>();
  private readonly _sourceChunksCache: ChunksCache;
  private readonly _sourceStore: Store;
  private readonly _refCounts = new Map<Hash, number>();
  private readonly _chunkHasher: ChunkHasher;
  private readonly _assertValidHash: (hash: Hash) => void;

  constructor(
    sourceStore: Store,
    sourceCacheSizeLimit: number,
    chunkHasher: ChunkHasher,
    assertValidHash: (hash: Hash) => void,
    getSizeOfValue = defaultGetSizeOfValue,
  ) {
    this._sourceChunksCache = new ChunksCache(
      sourceCacheSizeLimit,
      getSizeOfValue,
      this._refCounts,
    );
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

enum LoadFromSource {
  True,
  False,
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

  async getChunk(
    hash: Hash,
    loadFromSource: LoadFromSource = LoadFromSource.True,
  ): Promise<Chunk | undefined> {
    if (isTempHash(hash)) {
      return this._tempChunks.get(hash);
    }
    let chunk = this._sourceChunksCache.get(hash);
    if (chunk === undefined && loadFromSource === LoadFromSource.True) {
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

export class LazyWrite
  extends LazyRead
  implements Write, GarbageCollectionDelegate
{
  private readonly _refCounts: Map<Hash, number>;
  private readonly _chunkHasher: ChunkHasher;
  protected readonly _pendingHeadChanges = new Map<string, HeadChange>();
  protected readonly _pendingChunks = new Map<Hash, Chunk>();

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

  override async getChunk(
    hash: Hash,
    loadFromSource: LoadFromSource = LoadFromSource.True,
  ): Promise<Chunk | undefined> {
    return (
      this._pendingChunks.get(hash) || super.getChunk(hash, loadFromSource)
    );
  }

  override async getHead(name: string): Promise<Hash | undefined> {
    const headChange = this._pendingHeadChanges.get(name);
    if (headChange) {
      return headChange.new;
    }
    return super.getHead(name);
  }

  async commit(): Promise<void> {
    const refCountUpdates = await computeRefCountUpdates(
      this._pendingHeadChanges.values(),
      new Set(this._pendingChunks.keys()),
      this,
    );

    refCountUpdates.forEach((count, hash) => {
      if (count === 0) {
        this._pendingChunks.delete(hash);
        if (isTempHash(hash)) {
          this._tempChunks.delete(hash);
        } else {
          this._sourceChunksCache.deleteWithoutDecrementingRefCounts(hash);
        }
      } else {
        this._refCounts.set(hash, count);
      }
    });

    this._pendingChunks.forEach((chunk, hash) => {
      if (isTempHash(hash)) {
        this._tempChunks.set(hash, chunk);
      } else {
        this._sourceChunksCache.put(chunk);
      }
    });

    this._pendingHeadChanges.forEach((headChange, name) => {
      if (headChange.new) {
        this._heads.set(name, headChange.new);
      } else {
        this._heads.delete(name);
      }
    });
  }

  async getRefCount(hash: Hash): Promise<number | undefined> {
    return this._refCounts.get(hash);
  }

  async getRefs(hash: Hash): Promise<readonly Hash[] | undefined> {
    return (await this.getChunk(hash, LoadFromSource.False))?.meta;
  }
}

type CacheEntry = {
  chunk: Chunk;
  size: number;
};

class ChunksCache {
  private readonly _cacheSizeLimit: number;
  private readonly _getSizeOfValue: (v: kv.Value) => number;
  private readonly _refCounts: Map<Hash, number>;
  private readonly _cacheEntries = new Map<Hash, CacheEntry>();
  private _size = 0;

  constructor(
    cacheSizeLimit: number,
    getSizeOfValue: (v: kv.Value) => number,
    refCounts: Map<Hash, number>,
  ) {
    this._cacheSizeLimit = cacheSizeLimit;
    this._getSizeOfValue = getSizeOfValue;
    this._refCounts = refCounts;
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
    // If there is an existing cache entry then the cache value must be equivalent,
    // early return
    const oldCacheEntry = this._cacheEntries.get(hash);
    if (oldCacheEntry) {
      return;
    }

    // Only cache if there is a ref from a head to this chunk
    const refCount = this._refCounts.get(hash);
    if (refCount === undefined || refCount < 1) {
      return;
    }

    const valueSize = this._getSizeOfValue(chunk.data);
    if (valueSize > this._cacheSizeLimit) {
      // This value cannot be cached due to its size
      // don't evict other entries to try to make room for it.
      // This also prevents chunks only referenced by this chunk
      // from being cached, as they will never have a positive
      // ref count.
      return;
    }

    this._size += valueSize;
    this._cacheEntries.set(hash, {chunk, size: valueSize});
    chunk.meta.forEach(refHash => {
      this._refCounts.set(refHash, (this._refCounts.get(refHash) || 0) + 1);
    });

    if (this._size <= this._cacheSizeLimit) {
      return;
    }
    for (const entry of this._cacheEntries) {
      if (this._size <= this._cacheSizeLimit) {
        break;
      }
      const [keyToEvict, cacheEntryToEvict] = entry;
      this.deleteAndDecrementRefCounts(keyToEvict, cacheEntryToEvict);
    }
  }

  deleteWithoutDecrementingRefCounts(hash: Hash): void {
    const cacheEntryToDelete = this._cacheEntries.get(hash);
    if (cacheEntryToDelete) {
      this._size -= cacheEntryToDelete.size;
      this._cacheEntries.delete(hash);
    }
  }

  deleteAndDecrementRefCounts(hash: Hash, cacheEntry: CacheEntry): void {
    this._size -= cacheEntry.size;
    this._cacheEntries.delete(hash);
    cacheEntry.chunk.meta.forEach(refHash => {
      const oldCount = this._refCounts.get(refHash);
      assertNotUndefined(oldCount);
      assert(oldCount > 0);
      const newCount = oldCount - 1;
      if (newCount === 0) {
        this._refCounts.delete(hash);
        const refCacheEntry = this._cacheEntries.get(refHash);
        if (refCacheEntry) {
          this.deleteAndDecrementRefCounts(refHash, refCacheEntry);
        }
      } else {
        this._refCounts.set(refHash, newCount);
      }
    });
  }
}
