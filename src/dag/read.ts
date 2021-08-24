import type * as kv from '../kv/mod.js';
import {Chunk} from './chunk.js';
import {chunkDataKey, chunkMetaKey, headKey} from './key.js';
import * as utf8 from '../utf8.js';

export class Read {
  private readonly _kv: kv.Read;

  constructor(kv: kv.Read) {
    this._kv = kv;
  }

  async hasChunk(hash: string): Promise<boolean> {
    return await this._kv.has(chunkDataKey(hash));
  }

  async getChunk(hash: string): Promise<Chunk | undefined> {
    const data = await this._kv.get(chunkDataKey(hash));
    if (data === undefined) {
      return undefined;
    }

    const meta = await this._kv.get(chunkMetaKey(hash));
    return Chunk.read(hash, data, meta);
  }

  async getHead(name: string): Promise<string | undefined> {
    const data = await this._kv.get(headKey(name));
    if (data === undefined) {
      return undefined;
    }
    return utf8.decode(data);
  }
}
