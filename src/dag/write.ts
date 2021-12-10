import type * as kv from '../kv/mod';
import {chunkDataKey, chunkMetaKey, headKey, chunkRefCountKey} from './key';
import {Read} from './read';
import {assertMeta, Chunk, ChunkHasher, createChunk} from './chunk';
import {assertNumber} from '../asserts';
import type {Hash} from '../hash';
import type {ReadonlyJSONValue} from '../json';
import {Lock} from '../rw-lock';

type HeadChange = {
  new: Hash | undefined;
  old: Hash | undefined;
};

export class Write extends Read {
  protected declare readonly _tx: kv.Write;
  private readonly _chunkHasher: ChunkHasher;

  private readonly _newChunks = new Set<Hash>();
  private readonly _changedHeads = new Map<string, HeadChange>();
  private _changeRefCountLocks: Map<Hash, Lock> = new Map();

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

    for (const n of newHeads) {
      await this._changeRefCount(n, 1);
    }

    for (const o of oldHeads) {
      await this._changeRefCount(o, -1);
    }

    // Now we go through the mutated chunks to see if any of them are still orphaned.
    const ps = [];
    for (const hash of this._newChunks) {
      const count = await this._getRefCount(hash);
      if (count === 0) {
        ps.push(this._removeAllRelatedKeys(hash, false));
      }
    }
    await Promise.all(ps);
  }

  private async _changeRefCount(hash: Hash, delta: number): Promise<void> {
    let lock = this._changeRefCountLocks.get(hash);
    if (lock === undefined) {
      lock = new Lock();
      this._changeRefCountLocks.set(hash, lock);
    }
    await lock.withLock(async () => {
      const oldCount = await this._getRefCount(hash);
      const newCount = oldCount + delta;

      if ((oldCount === 0 && delta === 1) || (oldCount === 1 && delta === -1)) {
        const meta = await this._tx.get(chunkMetaKey(hash));
        if (meta !== undefined) {
          assertMeta(meta);
          const ps = meta.map(ref => this._changeRefCount(ref, delta));
          await Promise.all(ps);
        }
      }

      if (newCount === 0) {
        await this._removeAllRelatedKeys(hash, true);
      } else {
        await this._setRefCount(hash, newCount);
      }
    });
  }

  private async _setRefCount(hash: Hash, count: number): Promise<void> {
    const refCountKey = chunkRefCountKey(hash);
    if (count === 0) {
      await this._tx.del(refCountKey);
    } else {
      await this._tx.put(refCountKey, count);
    }
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

  private async _removeAllRelatedKeys(
    hash: Hash,
    updateMutatedChunks: boolean,
  ): Promise<void> {
    await Promise.all([
      this._tx.del(chunkDataKey(hash)),
      this._tx.del(chunkMetaKey(hash)),
      this._tx.del(chunkRefCountKey(hash)),
    ]);

    if (updateMutatedChunks) {
      this._newChunks.delete(hash);
    }
  }

  close(): void {
    this._tx.release();
  }
}

export function toLittleEndian(count: number): Uint8Array {
  if (count < 0 || count > 0xffff) {
    throw new Error('Ref count out of range');
  }
  const buf = new Uint8Array(2);
  buf[0] = count & 0xff;
  buf[1] = (count >> 8) & 0xff;
  return buf;
}

export function fromLittleEndian(buf: Uint8Array): number {
  if (buf.length !== 2) {
    throw new Error('Ref count must be 2 bytes');
  }
  return buf[0] | (buf[1] << 8);
}
