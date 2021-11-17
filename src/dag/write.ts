import type * as kv from '../kv/mod';
import {chunkDataKey, chunkMetaKey, headKey, chunkRefCountKey} from './key';
import {Read} from './read';
import {assertMeta, Chunk, ChunkHasher} from './chunk';
import {assertNumber} from '../asserts';
import type {Hash} from '../hash';

type HeadChange = {
  new: Hash | undefined;
  old: Hash | undefined;
};

export class Write extends Read {
  protected declare readonly _kvr: kv.Write;

  private readonly _newChunks = new Set<Hash>();
  private readonly _changedHeads = new Map<string, HeadChange>();

  constructor(
    kvw: kv.Write,
    chunkHasher: ChunkHasher,
    assertValidHash: (hash: Hash) => void,
  ) {
    super(kvw, chunkHasher, assertValidHash);
  }

  get kvWrite(): kv.Write {
    return this._kvr as kv.Write;
  }

  async putChunk(c: Chunk): Promise<void> {
    const {hash, data, meta} = c;
    // We never want to write temp hashes to the underlying store.
    this.assertValidHash(hash);
    const key = chunkDataKey(hash);
    const p1 = this._kvr.put(key, data);
    let p2;
    if (meta.length > 0) {
      for (const h of meta) {
        this.assertValidHash(h);
      }
      p2 = this._kvr.put(chunkMetaKey(hash), meta);
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
      p1 = this._kvr.del(hk);
    } else {
      p1 = this._kvr.put(hk, hash);
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
    await this.collectGarbage();
    await this._kvr.commit();
  }

  async collectGarbage(): Promise<void> {
    // We increment all the ref counts before we do all the decrements. This
    // is so that we do not remove an item that goes from 1 -> 0 -> 1
    const newHeads: (Hash | undefined)[] = [];
    const oldHeads: (Hash | undefined)[] = [];
    for (const changedHead of this._changedHeads.values()) {
      oldHeads.push(changedHead.old);
      newHeads.push(changedHead.new);
    }

    for (const n of newHeads) {
      if (n !== undefined) {
        await this.changeRefCount(n, 1);
      }
    }

    for (const o of oldHeads) {
      if (o !== undefined) {
        await this.changeRefCount(o, -1);
      }
    }

    // Now we go through the mutated chunks to see if any of them are still orphaned.
    const ps = [];
    for (const hash of this._newChunks) {
      const count = await this.getRefCount(hash);
      if (count === 0) {
        ps.push(this.removeAllRelatedKeys(hash, false));
      }
    }
    await Promise.all(ps);
  }

  async changeRefCount(hash: Hash, delta: number): Promise<void> {
    const oldCount = await this.getRefCount(hash);
    const newCount = oldCount + delta;

    if ((oldCount === 0 && delta === 1) || (oldCount === 1 && delta === -1)) {
      const meta = await this._kvr.get(chunkMetaKey(hash));
      if (meta !== undefined) {
        assertMeta(meta);
        const ps = meta.map(ref => this.changeRefCount(ref, delta));
        await Promise.all(ps);
      }
    }

    if (newCount === 0) {
      await this.removeAllRelatedKeys(hash, true);
    } else {
      await this.setRefCount(hash, newCount);
    }
  }

  async setRefCount(hash: Hash, count: number): Promise<void> {
    const refCountKey = chunkRefCountKey(hash);
    if (count === 0) {
      await this._kvr.del(refCountKey);
    } else {
      await this._kvr.put(refCountKey, count);
    }
  }

  async getRefCount(hash: Hash): Promise<number> {
    const value = await this._kvr.get(chunkRefCountKey(hash));
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

  async removeAllRelatedKeys(
    hash: Hash,
    updateMutatedChunks: boolean,
  ): Promise<void> {
    await Promise.all([
      this._kvr.del(chunkDataKey(hash)),
      this._kvr.del(chunkMetaKey(hash)),
      this._kvr.del(chunkRefCountKey(hash)),
    ]);

    if (updateMutatedChunks) {
      this._newChunks.delete(hash);
    }
  }

  close(): void {
    this._kvr.release();
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
