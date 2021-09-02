import type * as kv from '../kv/mod';
import {uuid as makeUuid} from './uuid';
import {assertString} from '../asserts';

const CID_KEY = 'sys/cid';

export async function init(s: kv.Store): Promise<string> {
  const cid = await s.withRead(r => r.get(CID_KEY));
  if (cid !== undefined) {
    assertString(cid);
    return cid;
  }
  const uuid = makeUuid();
  await s.withWrite(async wt => {
    await wt.put(CID_KEY, uuid);
    await wt.commit();
  });
  return uuid;
}
