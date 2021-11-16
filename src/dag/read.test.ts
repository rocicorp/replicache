import {expect} from '@esm-bundle/chai';
import {Hash, hashOf, initHasher} from '../hash';
import {MemStore} from '../kv/mod';
import {defaultChunkHasher, readChunk} from './chunk';
import {chunkDataKey, chunkMetaKey} from './key';
import {Read} from './read';
import type {Value} from '../kv/store';

setup(async () => {
  await initHasher();
});

test('has chunk', async () => {
  const t = async (hash: Hash, expectHas: boolean) => {
    const h = hashOf('present');
    const kv = new MemStore();
    await kv.withWrite(async kvw => {
      await kvw.put(chunkDataKey(h), [0, 1]);
      await kvw.commit();
    });

    await kv.withRead(async kvr => {
      const r = new Read(kvr, defaultChunkHasher);
      expect(await r.hasChunk(hash)).to.equal(expectHas);
    });
  };

  await t(hashOf('present'), true);
  await t(hashOf('no such hash'), false);
});

test('get chunk', async () => {
  const t = async (data: Value, refs: Hash[], getSameChunk: boolean) => {
    const kv = new MemStore();
    const hash = defaultChunkHasher(data);
    const chunk = readChunk(hash, data, refs);
    await kv.withWrite(async kvw => {
      await kvw.put(chunkDataKey(chunk.hash), chunk.data);
      if (chunk.meta.length > 0) {
        await kvw.put(chunkMetaKey(chunk.hash), chunk.meta);
      }
      await kvw.commit();
    });

    await kv.withRead(async kvr => {
      const r = new Read(kvr, defaultChunkHasher);
      let expected = undefined;
      let chunkHash: Hash;
      if (getSameChunk) {
        expected = chunk;
        chunkHash = expected.hash;
      } else {
        chunkHash = hashOf('no such hash');
      }
      expect(await r.getChunk(chunkHash)).to.deep.equal(expected);
      if (expected) {
        expect(await r.getChunk(chunkHash)).to.deep.equal(expected);
      } else {
        expect(await r.getChunk(chunkHash)).to.be.undefined;
      }
    });
  };

  await t('Hello', [hashOf('r1'), hashOf('r2')], true);
  await t(42, [], true);
  await t(null, [hashOf('r1'), hashOf('r2')], false);
});
