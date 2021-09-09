import {expect} from '@esm-bundle/chai';
import {MemStore} from '../kv/mod';
import {CID_KEY, init} from './client-id';
import * as utf8 from '../utf8';

test('init client ID', async () => {
  const ms = new MemStore();
  const cid1 = await init(ms);
  const cid2 = await init(ms);
  expect(cid1).to.equal(cid2);
  const ms2 = new MemStore();
  const cid3 = await init(ms2);
  expect(cid1).to.not.equal(cid3);
});

test('init client ID uint8array upgrade', async () => {
  const ms = new MemStore();
  const fakeClientID = 'fake-client-id';
  await ms.withWrite(async w => {
    await w.put(CID_KEY, utf8.encode(fakeClientID));
    await w.commit();
  });
  const cid = await init(ms);
  expect(cid).to.equal(fakeClientID);

  await ms.withRead(async r => {
    const cid2 = await r.get(CID_KEY);
    expect(cid2).to.equal(fakeClientID);
  });
});
