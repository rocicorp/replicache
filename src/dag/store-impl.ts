import type * as kv from '../kv/mod';
import {Store, Read, Write, MissingChunkError, mustGetChunk} from './store';
import {
  assertMeta,
  Chunk,
  createChunkWithHash,
  createChunk,
  ChunkHasher,
} from './chunk';
import {chunkDataKey, chunkMetaKey, headKey, chunkRefCountKey} from './key';
import {assertHash, Hash} from '../hash';
import {assertNumber} from '../asserts';
import type {ReadonlyJSONValue} from '../json';
import {computeRefCountUpdates} from './gc';

export class StoreImpl implements Store {
  private readonly _kv: kv.Store;
  private readonly _chunkHasher: ChunkHasher;
  private readonly _assertValidHash: (hash: Hash) => void;

  constructor(
    kv: kv.Store,
    chunkHasher: ChunkHasher,
    assertValidHash: (hash: Hash) => void,
  ) {
    this._kv = kv;
    this._chunkHasher = chunkHasher;
    this._assertValidHash = assertValidHash;
  }

  async read(): Promise<Read> {
    return new ReadImpl(await this._kv.read(), this._assertValidHash);
  }

  async withRead<R>(fn: (read: Read) => R | Promise<R>): Promise<R> {
    return this._kv.withRead(kvr =>
      fn(new ReadImpl(kvr, this._assertValidHash)),
    );
  }

  async write(): Promise<Write> {
    return new WriteImpl(
      await this._kv.write(),
      this._chunkHasher,
      this._assertValidHash,
    );
  }

  async withWrite<R>(fn: (Write: Write) => R | Promise<R>): Promise<R> {
    return this._kv.withWrite(kvw =>
      fn(new WriteImpl(kvw, this._chunkHasher, this._assertValidHash)),
    );
  }

  async close(): Promise<void> {
    await this._kv.close();
  }
}

export class ReadImpl implements Read {
  protected readonly _tx: kv.Read;
  readonly assertValidHash: (hash: Hash) => void;

  constructor(kv: kv.Read, assertValidHash: (hash: Hash) => void) {
    this._tx = kv;
    this.assertValidHash = assertValidHash;
  }

  async hasChunk(hash: Hash): Promise<boolean> {
    return await this._tx.has(chunkDataKey(hash));
  }

  async getChunk(hash: Hash): Promise<Chunk | undefined> {
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

  async mustGetChunk(hash: Hash): Promise<Chunk> {
    return mustGetChunk(this, hash);
  }

  async getHead(name: string): Promise<Hash | undefined> {
    const data = await this._tx.get(headKey(name));
    if (data === undefined) {
      return undefined;
    }
    assertHash(data);
    return data;
  }

  close(): void {
    this._tx.release();
  }

  get closed(): boolean {
    return this._tx.closed;
  }
}

type HeadChange = {
  new: Hash | undefined;
  old: Hash | undefined;
};

export class WriteImpl extends ReadImpl implements Write {
  protected declare readonly _tx: kv.Write;
  private readonly _chunkHasher: ChunkHasher;

  private readonly _putChunks = new Set<Hash>();
  private readonly _changedHeads = new Map<string, HeadChange>();

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
    this._putChunks.add(hash);
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
    const refCountUpdates = await computeRefCountUpdates(
      this._changedHeads.values(),
      this._putChunks,
      this,
    );
    await this._applyRefCountUpdates(refCountUpdates);
    await this._tx.commit();
  }

  async getRefCount(hash: Hash): Promise<number | undefined> {
    const value = await this._tx.get(chunkRefCountKey(hash));
    if (value === undefined) {
      return undefined;
    }
    assertNumber(value);
    if (value < 0 || value > 0xffff || value !== (value | 0)) {
      throw new Error(
        `Invalid ref count ${value}. We expect the value to be a Uint16`,
      );
    }
    return value;
  }

  async getRefs(hash: Hash): Promise<readonly Hash[] | undefined> {
    const meta = await this._tx.get(chunkMetaKey(hash));
    if (meta !== undefined) {
      assertMeta(meta);
    }
    return meta;
  }

  private async _applyRefCountUpdates(
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

  private async _removeAllRelatedKeys(hash: Hash): Promise<void> {
    await Promise.all([
      this._tx.del(chunkDataKey(hash)),
      this._tx.del(chunkMetaKey(hash)),
      this._tx.del(chunkRefCountKey(hash)),
    ]);

    this._putChunks.delete(hash);
  }

  close(): void {
    this._tx.release();
  }
}
