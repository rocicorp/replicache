import type * as kv from '../kv/mod';
import {assertMeta, Chunk} from './chunk';
import {chunkDataKey, chunkMetaKey, headKey} from './key';
import {assertString} from '../asserts';
import * as flatbuffers from 'flatbuffers';
import {Meta as MetaFB} from './generated/meta/meta.js';

export class Read {
  private readonly _kvr: kv.Read;

  constructor(kv: kv.Read) {
    this._kvr = kv;
  }

  async hasChunk(hash: string): Promise<boolean> {
    return await this._kvr.has(chunkDataKey(hash));
  }

  async getChunk(hash: string): Promise<Chunk | undefined> {
    const data = await this._kvr.get(chunkDataKey(hash));
    if (data === undefined) {
      return undefined;
    }

    const refsVal = await this._kvr.get(chunkMetaKey(hash));
    let refs: readonly string[];
    if (refsVal !== undefined) {
      assertMeta(refsVal);
      refs = refsVal;
    } else {
      refs = [];
    }
    return Chunk.read(hash, data, refs);
  }

  async getHead(name: string): Promise<string | undefined> {
    const data = await this._kvr.get(headKey(name));
    if (data === undefined) {
      return undefined;
    }
    assertString(data);
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
