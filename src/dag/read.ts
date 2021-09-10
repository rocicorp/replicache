import type * as kv from '../kv/mod';
import {assertMeta, Chunk} from './chunk';
import {chunkDataKey, chunkMetaKey, headKey} from './key';
import * as utf8 from '../utf8';
import {assertString} from '../asserts';
import {READ_FLATBUFFERS} from './config';
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
      if (READ_FLATBUFFERS && refsVal instanceof Uint8Array) {
        refs = readMetaFlatbufferAsRefs(refsVal);
      } else {
        assertMeta(refsVal);
        refs = refsVal;
      }
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
    if (READ_FLATBUFFERS && data instanceof Uint8Array) {
      return utf8.decode(data);
    }
    assertString(data);
    return data;
  }

  close(): void {
    this._kvr.release();
  }
}

function readMetaFlatbufferAsRefs(data: Uint8Array): string[] {
  const buf = new flatbuffers.ByteBuffer(data);
  const meta = MetaFB.getRootAsMeta(buf);
  const length = meta.refsLength();
  const refs: string[] = [];
  for (let i = 0; i < length; i++) {
    refs.push(meta.refs(i));
  }
  return refs;
}
