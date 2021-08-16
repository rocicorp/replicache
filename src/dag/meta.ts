import {Meta} from './generated/meta/meta.js';
import * as flatbuffers from 'flatbuffers';

export function getRootAsMeta(bytes: Uint8Array): Meta {
  const buf = new flatbuffers.ByteBuffer(bytes);
  return Meta.getRootAsMeta(buf);
}

export type {Meta};
