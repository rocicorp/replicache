import type * as kv from '../kv/mod';
import {chunkDataKey, chunkMetaKey, headKey, chunkRefCountKey} from './key';
import {Read} from './read';
import {assertMeta, Chunk, ChunkHasher, createChunk} from './chunk';
import {assertNumber} from '../asserts';
import type {Hash} from '../hash';
import type {ReadonlyJSONValue} from '../json';

type HeadChange = {
  new: Hash | undefined;
  old: Hash | undefined;
};

export class Write extends Read {
  protected declare readonly _tx: kv.Write;
  private readonly _chunkHasher: ChunkHasher;

  private readonly _newChunks = new Set<Hash>();
  private readonly _changedHeads = new Map<string, HeadChange>();

  /**
   * This map is used to ensure we do not load the ref count key more than once.
   * Once it is loaded we only operate on a cache of the ref counts.
   */
  private readonly _refCountLoadingPromises = new Map<Hash, Promise<void>>();

  constructor(
    kvw: kv.Write,
    chunkHasher: ChunkHasher,
    assertValidHash: (hash: Hash) => void,
  ) {
    super(kvw, assertValidHash);
    this._chunkHasher = chunkHasher;
  }

  createChunk = <V extends ReadonlyJSONValue>(
    data: V,
    refs: readonly Hash[],
  ): Chunk<V> => createChunk(data, refs, this._chunkHasher);

  get kvWrite(): kv.Write {
    return this._tx;
  }

  async putChunk(c: Chunk): Promise<void> {
    const {hash, data, meta} = c;
    // We never want to write temp hashes to the underlying store.
    this.assertValidHash(hash);
    const key = chunkDataKey(hash);
    const p1 = this._tx.put(key, data);
    let p2;
    if (meta.length > 0) {
      for (const h of meta) {
        this.assertValidHash(h);
      }
      p2 = this._tx.put(chunkMetaKey(hash), meta);
    }
    this._newChunks.add(hash);
    await p1;
    await p2;
  }

  setHead(name: string, hash: Hash): Promise<void> {
    return this._setHead(name, hash);
  }

  removeHead(name: string): Promise<void> {
    return this._setHead(name, undefined);
  }

  private async _setHead(name: string, hash: Hash | undefined): Promise<void> {
    const oldHash = await this.getHead(name);
    const hk = headKey(name);

    let p1: Promise<void>;
    if (hash === undefined) {
      p1 = this._tx.del(hk);
    } else {
      p1 = this._tx.put(hk, hash);
    }

    const v = this._changedHeads.get(name);
    if (v === undefined) {
      this._changedHeads.set(name, {new: hash, old: oldHash});
    } else {
      // Keep old if existing
      v.new = hash;
    }

    await p1;
  }

  async commit(): Promise<void> {
    await this._collectGarbage();
    await this._tx.commit();
  }

  private async _collectGarbage(): Promise<void> {
    // We increment all the ref counts before we do all the decrements. This
    // is so that we do not remove an item that goes from 1 -> 0 -> 1
    const newHeads: Hash[] = [];
    const oldHeads: Hash[] = [];
    for (const changedHead of this._changedHeads.values()) {
      changedHead.old && oldHeads.push(changedHead.old);
      changedHead.new && newHeads.push(changedHead.new);
    }

    const refCountCache: Map<Hash, number> = new Map();

    for (const n of newHeads) {
      await this._changeRefCount(n, 1, refCountCache);
    }

    for (const o of oldHeads) {
      await this._changeRefCount(o, -1, refCountCache);
    }

    await this._applyGatheredRefCountChanges(refCountCache);

    // Now we go through the mutated chunks to see if any of them are still orphaned.
    const ps = [];
    for (const hash of this._newChunks) {
      await this._ensureRefCountLoaded(hash, refCountCache);
      const count = refCountCache.get(hash);
      if (count === 0) {
        ps.push(this._removeAllRelatedKeys(hash));
      }
    }
    await Promise.all(ps);
  }

  private async _changeRefCount(
    hash: Hash,
    delta: number,
    refCountCache: Map<Hash, number>,
  ): Promise<void> {
    // First make sure that we have the ref count in the cache. This is async
    // because it might need to load the ref count from the store.
    //
    // Once we have loaded the ref count all the updates to it are sync to
    // prevent race conditions.
    await this._ensureRefCountLoaded(hash, refCountCache);

    if (updateRefCount(hash, delta, refCountCache)) {
      const meta = await this._tx.get(chunkMetaKey(hash));
      if (meta !== undefined) {
        assertMeta(meta);
        const ps = meta.map(ref =>
          this._changeRefCount(ref, delta, refCountCache),
        );
        await Promise.all(ps);
      }
    }
  }

  private _ensureRefCountLoaded(
    hash: Hash,
    refCountCache: Map<Hash, number>,
  ): Promise<void> {
    // Only get the ref count once.
    let p = this._refCountLoadingPromises.get(hash);
    if (p === undefined) {
      p = (async () => {
        const value = await this._getRefCount(hash);
        refCountCache.set(hash, value);
      })();
      this._refCountLoadingPromises.set(hash, p);
    }
    return p;
  }

  private async _getRefCount(hash: Hash): Promise<number> {
    const value = await this._tx.get(chunkRefCountKey(hash));
    if (value === undefined) {
      return 0;
    }
    assertNumber(value);
    if (value < 0 || value > 0xffff || value !== (value | 0)) {
      throw new Error(
        `Invalid ref count ${value}. We expect the value to be a Uint16`,
      );
    }
    return value;
  }

  private async _removeAllRelatedKeys(hash: Hash): Promise<void> {
    await Promise.all([
      this._tx.del(chunkDataKey(hash)),
      this._tx.del(chunkMetaKey(hash)),
      this._tx.del(chunkRefCountKey(hash)),
    ]);

    this._newChunks.delete(hash);
  }

  private async _applyGatheredRefCountChanges(
    refCountCache: Map<Hash, number>,
  ): Promise<void> {
    const ps: Promise<void>[] = [];
    refCountCache.forEach((count, hash) => {
      if (count === 0) {
        ps.push(this._removeAllRelatedKeys(hash));
      } else {
        const refCountKey = chunkRefCountKey(hash);
        ps.push(this._tx.put(refCountKey, count));
      }
    });
    await Promise.all(ps);
  }

  close(): void {
    this._tx.release();
  }
}

/**
 * Updates the ref count in the refCountCache.
 *
 * Returns true if the the node changed from reachable to unreachable and vice
 * versa.
 */
function updateRefCount(
  hash: Hash,
  delta: number,
  refCountCache: Map<Hash, number>,
): boolean {
  const oldCount = refCountCache.get(hash);
  assertNumber(oldCount);
  refCountCache.set(hash, oldCount + delta);
  return (oldCount === 0 && delta === 1) || (oldCount === 1 && delta === -1);
}
