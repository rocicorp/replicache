import type * as kv from '../kv/mod';
import {assertMeta, Chunk, createChunkWithHash} from './chunk';
import {chunkDataKey, chunkMetaKey, headKey} from './key';
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
