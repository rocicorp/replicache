import * as flatbuffers from 'flatbuffers';
import {Hash} from '../hash.js';
import {Meta} from './generated/meta/meta.js';

export class Chunk {
  readonly hash: string;
  readonly data: Uint8Array;
  readonly meta: Uint8Array | undefined;

  private constructor(
    hash: string,
    data: Uint8Array,
    meta: Uint8Array | undefined,
  ) {
    this.hash = hash;
    this.data = data;
    this.meta = meta;
  }

  static new(data: Uint8Array, refs: string[]): Chunk {
    const hash = Hash.of(data);
    const meta = createMeta(refs);
    return new Chunk(hash.toString(), data, meta);
  }

  *refs(): IterableIterator<string> {
    if (!this.meta) {
      return;
    }

    const buf = new flatbuffers.ByteBuffer(this.meta);
    const meta = Meta.getRootAsMeta(buf);
    const length = meta.refsLength();
    for (let i = 0; i < length; i++) {
      yield meta.refs(i);
    }
  }

  equals(b: Chunk): boolean {
    return this.hash === b.hash && arrayishEquals(this.meta, b.meta);
  }

  static read(
    hash: string,
    data: Uint8Array,
    meta: Uint8Array | undefined,
  ): Chunk {
    return new Chunk(hash, data, meta);
  }
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

function arrayishEquals<T>(
  a: ArrayLike<T> | undefined,
  b: ArrayLike<T> | undefined,
): boolean {
  if (a === b) {
    return true;
  }
  if (a === undefined || b === undefined || a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
