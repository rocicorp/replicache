import type * as kv from '../kv/mod';
import {assertMeta, Chunk} from './chunk';
import {chunkDataKey, chunkMetaKey, headKey} from './key';
import * as utf8 from '../utf8';
import {assertInstanceof} from '../asserts';

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

    const meta = await this._kvr.get(chunkMetaKey(hash));
    if (meta !== undefined) {
      assertMeta(meta);
      if (meta.length > 0) {
        return Chunk.read(hash, data, meta);
      }
    }
    return Chunk.read(hash, data, undefined);
  }

  async getHead(name: string): Promise<string | undefined> {
    const data = await this._kvr.get(headKey(name));
    if (data === undefined) {
      return undefined;
    }
    assertInstanceof(data, Uint8Array);
    return utf8.decode(data);
  }

  close(): void {
    this._kvr.release();
  }
}
