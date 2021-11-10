import {assert, assertArray, assertNumber} from '../asserts';
import {Hash, hashOf} from '../hash';
import {getRefs} from './get-refs';
import type {Value} from '../kv/store';
import type {ChunkType} from './chunk-type';

export type Refs = readonly Hash[];

export class Chunk<V extends Value = Value> {
  readonly hash: Hash;
  readonly data: V;

  /**
   * Meta is an array of refs. If there are no refs we do not write a meta
   * chunk.
   */
  get refs(): Refs {
    return getRefs(this.type, this.data);
  }

  /**
   * Type describes what kind of chunk this is. This is used in getRef to
   * determine how to find the refs in the value.
   */
  readonly type: ChunkType;

  private constructor(type: ChunkType, hash: Hash, data: V) {
    this.type = type;
    this.hash = hash;
    this.data = data;
  }

  static new<V extends Value = Value>(type: ChunkType, data: V): Chunk<V> {
    const hash = hashOf(JSON.stringify(data));
    return new Chunk(type, hash, data);
  }

  static read<V extends Value = Value>(
    hash: Hash,
    type: ChunkType,
    data: V,
  ): Chunk<V> {
    return new Chunk(type, hash, data);
  }
}

type ChunkData<V extends Value> = readonly [ChunkType, V];

export function assertChunkData<V extends Value = Value>(
  v: unknown,
): asserts v is ChunkData<V> {
  assertArray(v);
  assert(v.length === 2);
  assertNumber(v[0]);
}
