import * as flatbuffers from 'flatbuffers';
import {Hash} from '../hash';
import type {Value} from '../kv/store';
import {Meta} from './generated/meta/meta';

// TODO(arv): Make this class take a type parameter for the data type?
export class Chunk {
  readonly hash: string;
  readonly data: Value;
  /**
   * Meta is a Meta.fbs containing refs if there are any refs. If there are no
   * refs we do not write a meta chunk.
   */
  readonly meta: Uint8Array | undefined;

  private constructor(hash: string, data: Value, meta: Uint8Array | undefined) {
    this.hash = hash;
    this.data = data;
    this.meta = meta;
  }

  static new(data: Value, refs: string[]): Chunk {
    // Use hash of JSON stringified data if a JSONValue is passed.
    const sum = ArrayBuffer.isView(data) ? data : JSON.stringify(data);
    const hash = Hash.of(sum);
    const meta = createMeta(refs);
    return new Chunk(hash.toString(), data, meta);
  }

  static read(hash: string, data: Value, meta: Uint8Array | undefined): Chunk {
    return new Chunk(hash, data, meta);
  }
}

export function getRefsFromMeta(meta: Uint8Array): string[] {
  const buf = new flatbuffers.ByteBuffer(meta);
  const metaObj = Meta.getRootAsMeta(buf);
  const length = metaObj.refsLength();
  return Array.from({length}, (_, i) => metaObj.refs(i));
}

function createMeta(refs: string[]): Uint8Array | undefined {
  const refsLength = refs.length;
  if (refsLength === 0) {
    return undefined;
  }

  const builder = new flatbuffers.Builder();
  const refsOffset = Meta.createRefsVector(
    builder,
    refs.map(r => builder.createString(r)),
  );
  const m = Meta.createMeta(builder, refsOffset);
  builder.finish(m);
  return builder.asUint8Array();
}
