import type * as kv from '../kv/mod';
import {uuid as makeUuid} from './uuid';
import {assertString} from '../asserts';
import {READ_FLATBUFFERS} from '../dag/config';
import * as utf8 from '../utf8';

export const CID_KEY = 'sys/cid';

export async function init(store: kv.Store): Promise<string> {
  const cid = await store.withRead(r => r.get(CID_KEY));
  if (cid !== undefined) {
    if (READ_FLATBUFFERS) {
      if (cid instanceof Uint8Array) {
        const str = utf8.decode(cid);
        await writeClientID(store, str);
        return str;
      }
    }
    assertString(cid);
    return cid;
  }
  const uuid = makeUuid();
  await writeClientID(store, uuid);
  return uuid;
}

function writeClientID(s: kv.Store, uuid: string): Promise<void> {
  return s.withWrite(async wt => {
    await wt.put(CID_KEY, uuid);
    await wt.commit();
  });
}
