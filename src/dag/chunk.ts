import {assertString} from '../asserts';
import {Hash, hashOf} from '../hash';
import type {Value} from '../kv/store';

type Refs = readonly Hash[];

export interface Chunk<V extends Value = Value> {
  readonly hash: Hash;
  readonly data: V;
  /**
   * Meta is an array of refs. If there are no refs we do not write a meta
   * chunk.
   */
  readonly meta: Refs;
}

class ChunkImpl<V extends Value = Value> implements Chunk<V> {
  readonly hash: Hash;
  readonly data: V;
  readonly meta: Refs;

  constructor(hash: Hash, data: V, meta: Refs) {
    this.hash = hash;
    this.data = data;
    this.meta = meta;
  }
}

export function assertMeta(v: unknown): asserts v is Refs {
  if (!Array.isArray(v)) {
    throw new Error('Meta must be an array');
  }
  for (const e of v) {
    assertString(e);
  }
}

export function makeChunk<V extends Value>(
  data: V,
  refs: Refs,
  chunkHasher: ChunkHasher,
): Chunk<V> {
  const hash = chunkHasher(data);
  return new ChunkImpl(hash, data, refs);
}

export function readChunk<V extends Value>(
  hash: Hash,
  data: V,
  refs: Refs,
): Chunk<V> {
  return new ChunkImpl(hash, data, refs);
}

export type CreateChunk = <V extends Value>(data: V, refs: Refs) => Chunk<V>;

export function defaultChunkHasher<V extends Value>(data: V): Hash {
  return hashOf(JSON.stringify(data));
}

export type ChunkHasher = typeof defaultChunkHasher;
