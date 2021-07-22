import {Meta} from './meta_generated.js';
import * as flatbuffers from 'flatbuffers';

export function getRootAsMeta(bytes: Uint8Array): Meta {
  const buf = new flatbuffers.ByteBuffer(bytes);
  return Meta.getRootAsMeta(buf);
}

export type {Meta};
