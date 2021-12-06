import type {Hash} from '../hash';
import type * as kv from '../kv/mod';
import type {ChunkHasher} from './chunk';
import {Read} from './read';
import {Write} from './write';

export class Store {
  private readonly _cacheStore: Store;
  private readonly _sourceStore: Store;
  private readonly _chunkHasher: ChunkHasher;
  private readonly _assertValidHash: (hash: Hash) => void;

  constructor(
    cacheStore: Store,
    sourceStore: Store,
    chunkHasher: ChunkHasher,
    assertValidHash: (hash: Hash) => void,
  ) {
    this._cacheStore = cacheStore;
    this._sourceStore = sourceStore;
    this._chunkHasher = chunkHasher;
    this._assertValidHash = assertValidHash;
  }

  async read(): Promise<Read> {
    return new Read(await this._kv.read(), this._assertValidHash);
  }

  async withRead<R>(fn: (read: Read) => R | Promise<R>): Promise<R> {
    return this._kv.withRead(kvr => fn(new Read(kvr, this._assertValidHash)));
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

export class Read {
  private readonly _cacheStore: Store;
  private readonly _sourceStore: Store;
  readonly assertValidHash: (hash: Hash) => void;

  constructor(    cacheStore: Store,
    sourceStore: Store, assertValidHash: (hash: Hash) => void) {
    this._cacheStore = cacheStore;
    this._sourceStore = sourceStore;
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

export function metaFromFlatbuffer(data: Uint8Array): string[] {
  const buf = new flatbuffers.ByteBuffer(data);
  const meta = MetaFB.getRootAsMeta(buf);
  const length = meta.refsLength();
  const refs: string[] = [];
  for (let i = 0; i < length; i++) {
    refs.push(meta.refs(i));
  }
  return refs;
}

export function metaToFlatbuffer(refs: readonly string[]): Uint8Array {
  const builder = new flatbuffers.Builder();
  const refsOffset = MetaFB.createRefsVector(
    builder,
    refs.map(r => builder.createString(r)),
  );
  const m = MetaFB.createMeta(builder, refsOffset);
  builder.finish(m);
  return builder.asUint8Array();
}

