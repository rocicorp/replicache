import type * as kv from '../kv/mod';
import {assertMeta, Chunk, createChunkWithHash} from './chunk';
import {chunkDataKey, chunkMetaKey, headKey} from './key';
import * as flatbuffers from 'flatbuffers';
import {Meta as MetaFB} from './generated/meta/meta.js';
import {assertHash, Hash} from '../hash';

export class Read {
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
