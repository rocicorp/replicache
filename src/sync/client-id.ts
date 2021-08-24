import type * as kv from '../kv/mod.js';
import {uuid as makeUuid} from './uuid.js';

const CID_KEY = 'sys/cid';

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

export async function init(s: kv.Store): Promise<string> {
  const cid = await s.withRead(r => r.get(CID_KEY));
  if (cid !== undefined) {
    return textDecoder.decode(cid);
  }
  const uuid = makeUuid();
  await s.withWrite(async wt => {
    await wt.put(CID_KEY, textEncoder.encode(uuid));
    await wt.commit();
  });
  return uuid;
}
