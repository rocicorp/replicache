import {assertString} from '../asserts';
import {Hash} from '../hash';
import type {Value} from '../kv/store';

type Meta = string[];

// TODO(arv): Make this class take a type parameter for the data type?
export class Chunk {
  readonly hash: string;
  readonly data: Value;
  /**
   * Meta is an array of refs. If there are no refs we do not write a meta
   * chunk.
   */
  readonly meta: Meta;

  private constructor(hash: string, data: Value, meta: Meta = []) {
    this.hash = hash;
    this.data = data;
    this.meta = meta;
  }

  static new(data: Value, refs: string[]): Chunk {
    // Use hash of JSON stringified data if a JSONValue is passed.
    const sum = ArrayBuffer.isView(data) ? data : JSON.stringify(data);
    const hash = Hash.of(sum);
    return new Chunk(hash.toString(), data, refs);
  }

  static read(hash: string, data: Value, meta: Meta | undefined): Chunk {
    return new Chunk(hash, data, meta);
  }
}

export function assertMeta(v: unknown): asserts v is Meta {
  if (!Array.isArray(v)) {
    throw new Error('Meta must be an array');
  }
  for (const e of v) {
    assertString(e);
  }
}
