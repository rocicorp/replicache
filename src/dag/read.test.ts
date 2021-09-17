import {expect} from '@esm-bundle/chai';
import {initHasher} from '../hash';
import {MemStore} from '../kv/mod';
import {Chunk} from './chunk';
import {chunkDataKey, chunkMetaKey} from './key';
import {Read} from './read';
import type {Value} from '../kv/store';

setup(async () => {
  await initHasher();
});

test('has chunk', async () => {
  const t = async (hash: string, expectHas: boolean) => {
    const k = 'present';
    const kv = new MemStore();
    await kv.withWrite(async kvw => {
      await kvw.put(chunkDataKey(k), [0, 1]);
    });

    await kv.withRead(async kvr => {
      const r = new Read(kvr);
      expect(await r.hasChunk(hash)).to.equal(expectHas);
    });
  };

  await t('present', true);
  await t('no such hash', false);
});

test('get chunk', async () => {
  const t = async (data: Value, refs: string[], getSameChunk: boolean) => {
    const kv = new MemStore();
    const chunk = Chunk.new(data, refs);
    await kv.withWrite(async kvw => {
      await kvw.put(chunkDataKey(chunk.hash), chunk.data);
      if (chunk.meta.length > 0) {
        await kvw.put(chunkMetaKey(chunk.hash), chunk.meta);
      }
    });

    await kv.withRead(async kvr => {
      const r = new Read(kvr);
      let expected = undefined;
      let chunkHash: string;
      if (getSameChunk) {
        expected = chunk;
        chunkHash = expected.hash;
      } else {
        chunkHash = 'no such hash';
      }
      expect(await r.getChunk(chunkHash)).to.deep.equal(expected);
      if (expected) {
        expect(await r.getChunk(chunkHash)).to.deep.equal(expected);
      } else {
        expect(await r.getChunk(chunkHash)).to.be.undefined;
      }
    });
  };

  await t('Hello', ['r1', 'r2'], true);
  await t(42, [], true);
  await t(null, ['r1', 'r2'], false);
});
