import type * as kv from '../kv/mod';
import {chunkDataKey, chunkMetaKey, headKey, chunkRefCountKey} from './key';
import {Read} from './read';
import {assertMeta, Chunk} from './chunk';
import * as utf8 from '../utf8';
import {assertNumber} from '../asserts';

type HeadChange = {
  new: string | undefined;
  old: string | undefined;
};

export class Write {
  private readonly _kvw: kv.Write;
  private readonly _newChunks = new Set<string>();
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
    if (meta.length > 0) {
      p2 = this._kvw.put(chunkMetaKey(hash), meta);
    }
    this._newChunks.add(c.hash);
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
    for (const hash of this._newChunks) {
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
      const meta = await this._kvw.get(chunkMetaKey(hash));
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

  async setRefCount(hash: string, count: number): Promise<void> {
    const refCountKey = chunkRefCountKey(hash);
    if (count === 0) {
      await this._kvw.del(refCountKey);
    } else {
      await this._kvw.put(refCountKey, count);
    }
  }

  async getRefCount(hash: string): Promise<number> {
    const value = await this._kvw.get(chunkRefCountKey(hash));
    if (value === undefined) {
      return 0;
    }
    assertNumber(value);
    return value;
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
      this._newChunks.delete(hash);
    }
  }

  close(): void {
    this._kvw.release();
  }
}
