import type * as kv from '../kv/mod';
import {uuid as makeUuid} from './uuid';
import * as utf8 from '../utf8';

const CID_KEY = 'sys/cid';

export async function init(s: kv.Store): Promise<string> {
  const cid = await s.withRead(r => r.get(CID_KEY));
  if (cid !== undefined) {
    return utf8.decode(cid);
  }
  const uuid = makeUuid();
  await s.withWrite(async wt => {
    await wt.put(CID_KEY, utf8.encode(uuid));
    await wt.commit();
  });
  return uuid;
}
