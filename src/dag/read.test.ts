import {expect} from '@esm-bundle/chai';
import {assertNotTempHash, Hash, fakeHash} from '../hash';
import {MemStore} from '../kv/mod';
import {createChunk, makeTestChunkHasher} from './chunk';
import {chunkDataKey, chunkMetaKey} from './key';
import {Read} from './read';
import type {Value} from '../kv/store';

test('has chunk', async () => {
  const t = async (hash: Hash, expectHas: boolean) => {
    const h = fakeHash('present');
    const kv = new MemStore();
    await kv.withWrite(async kvw => {
      await kvw.put(chunkDataKey(h), [0, 1]);
      await kvw.commit();
    });

    await kv.withRead(async kvr => {
      const r = new Read(kvr, assertNotTempHash);
      expect(await r.hasChunk(hash)).to.equal(expectHas);
    });
  };

  await t(fakeHash('present'), true);
  await t(fakeHash('nosuchhash'), false);
});

test('get chunk', async () => {
  const chunkHasher = makeTestChunkHasher('fake');

  const t = async (data: Value, refs: Hash[], getSameChunk: boolean) => {
    const kv = new MemStore();
    const chunk = createChunk(data, refs, chunkHasher);
    await kv.withWrite(async kvw => {
      await kvw.put(chunkDataKey(chunk.hash), chunk.data);
      if (chunk.meta.length > 0) {
        await kvw.put(chunkMetaKey(chunk.hash), chunk.meta);
      }
      await kvw.commit();
    });

    await kv.withRead(async kvr => {
      const r = new Read(kvr, assertNotTempHash);
      let expected = undefined;
      let chunkHash: Hash;
      if (getSameChunk) {
        expected = chunk;
        chunkHash = expected.hash;
      } else {
        chunkHash = fakeHash('nosuchhash');
      }
      expect(await r.getChunk(chunkHash)).to.deep.equal(expected);
      if (expected) {
        expect(await r.getChunk(chunkHash)).to.deep.equal(expected);
      } else {
        expect(await r.getChunk(chunkHash)).to.be.undefined;
      }
    });
  };

  await t('Hello', [fakeHash('r1'), fakeHash('r2')], true);
  await t(42, [], true);
  await t(null, [fakeHash('r1'), fakeHash('r2')], false);
});
