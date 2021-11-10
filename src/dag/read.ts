import type * as kv from '../kv/mod';
import {assertChunkData, Chunk} from './chunk';
import {chunkDataKey, headKey} from './key';
import * as flatbuffers from 'flatbuffers';
import {Meta as MetaFB} from './generated/meta/meta.js';
import {assertHash, Hash} from '../hash';

export class Read {
  private readonly _kvr: kv.Read;

  constructor(kv: kv.Read) {
    this._kvr = kv;
  }

  async hasChunk(hash: Hash): Promise<boolean> {
    return await this._kvr.has(chunkDataKey(hash));
  }

  async getChunk(hash: Hash): Promise<Chunk | undefined> {
    const chunkData = await this._kvr.get(chunkDataKey(hash));
    if (chunkData === undefined) {
      return undefined;
    }

    assertChunkData(chunkData);
    const [type, data] = chunkData;
    return Chunk.read(hash, type, data);
  }

  async getHead(name: string): Promise<Hash | undefined> {
    const data = await this._kvr.get(headKey(name));
    if (data === undefined) {
      return undefined;
    }
    assertHash(data);
    return data;
  }

  close(): void {
    this._kvr.release();
  }

  get closed(): boolean {
    return this._kvr.closed;
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
