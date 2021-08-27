import {getRootAsMeta} from './meta.js';
import type * as kv from '../kv/mod.js';
import {HeadChange, toLittleEndian, fromLittleEndian} from './dag.js';
import {chunkDataKey, chunkMetaKey, headKey, chunkRefCountKey} from './key.js';
import {Read} from './read.js';
import type {Chunk} from './chunk.js';
import * as utf8 from '../utf8.js';

export class Write {
  private readonly _kvw: kv.Write;
  private readonly _mutatedChunks = new Set<string>();
  private readonly _changedHeads = new Map<string, HeadChange>();

  constructor(kvw: kv.Write) {
    this._kvw = kvw;
  }

  read(): Read {
    return new Read(this._kvw);
  }

  async putChunk(c: Chunk): Promise<void> {
    const {hash, data, meta} = c;
    const key = chunkDataKey(hash);
    const p1 = this._kvw.put(key, data);
    let p2;
    if (meta !== undefined) {
      p2 = this._kvw.put(chunkMetaKey(hash), meta);
    }
    this._mutatedChunks.add(c.hash);
    await p1;
    await p2;
  }

  async setHead(name: string, hash: string | undefined): Promise<void> {
    const oldHash = await this.read().getHead(name);
    const hk = headKey(name);

    let p1: Promise<void>;
    if (hash === undefined) {
      p1 = this._kvw.del(hk);
    } else {
      p1 = this._kvw.put(hk, utf8.encode(hash));
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
    await this._kvw.commit();
  }

  async collectGarbage(): Promise<void> {
    // We increment all the ref counts before we do all the decrements. This
    // is so that we do not remove an item that goes from 1 -> 0 -> 1
    const newHeads: (string | undefined)[] = [];
    const oldHeads: (string | undefined)[] = [];
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
    for (const hash of this._mutatedChunks) {
      const count = await this.getRefCount(hash);
      if (count === 0) {
        ps.push(this.removeAllRelatedKeys(hash, false));
      }
    }
    await Promise.all(ps);
  }

  async changeRefCount(hash: string, delta: number): Promise<void> {
    const oldCount = await this.getRefCount(hash);
    const newCount = oldCount + delta;

    if ((oldCount === 0 && delta === 1) || (oldCount === 1 && delta === -1)) {
      const metaKey = chunkMetaKey(hash);
      const buf = await this._kvw.get(metaKey);
      if (buf !== undefined) {
        const meta = getRootAsMeta(buf);
        const length = meta.refsLength();
        const ps = [];
        for (let i = 0; i < length; i++) {
          const r = meta.refs(i);
          ps.push(this.changeRefCount(r, delta));
        }
        await Promise.all(ps);
      }
    }

    if (newCount === 0) {
      await this.removeAllRelatedKeys(hash, true);
    } else {
      await this.setRefCount(hash, newCount);
    }
  }

  async setRefCount(hash: string, count: number): Promise<void> {
    // Ref count is represented as a u16 stored as 2 bytes using BE.
    const refCountKey = chunkRefCountKey(hash);
    const buf = toLittleEndian(count);
    if (count === 0) {
      await this._kvw.del(refCountKey);
    } else {
      await this._kvw.put(refCountKey, buf);
    }
  }

  async getRefCount(hash: string): Promise<number> {
    const buf = await this._kvw.get(chunkRefCountKey(hash));
    if (buf === undefined) {
      return 0;
    }
    return fromLittleEndian(buf);
  }

  async removeAllRelatedKeys(
    hash: string,
    updateMutatedChunks: boolean,
  ): Promise<void> {
    await Promise.all([
      this._kvw.del(chunkDataKey(hash)),
      this._kvw.del(chunkMetaKey(hash)),
      this._kvw.del(chunkRefCountKey(hash)),
    ]);

    if (updateMutatedChunks) {
      this._mutatedChunks.delete(hash);
    }
  }

  close(): void {
    this._kvw.release();
  }
}