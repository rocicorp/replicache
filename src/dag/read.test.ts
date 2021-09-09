import {expect} from '@esm-bundle/chai';
import {initHasher} from '../hash';
import {MemStore} from '../kv/mod';
import {Chunk} from './chunk';
import {chunkDataKey, chunkMetaKey, headKey} from './key';
import {Read} from './read';
import {Meta as MetaFB} from './generated/meta/meta';
import * as flatbuffers from 'flatbuffers';
import * as utf8 from '../utf8';

setup(async () => {
  await initHasher();
});

test('has chunk', async () => {
  const t = async (hash: string, expectHas: boolean) => {
    const k = 'present';
    const kv = new MemStore();
    await kv.withWrite(async kvw => {
      await kvw.put(chunkDataKey(k), new Uint8Array([0, 1]));
      await kvw.commit();
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
  const t = async (data: Uint8Array, refs: string[], getSameChunk: boolean) => {
    for (const createRefs of [createMeta, <T>(x: T) => x]) {
      const kv = new MemStore();
      const chunk = Chunk.new(data, refs);
      await kv.withWrite(async kvw => {
        await kvw.put(chunkDataKey(chunk.hash), chunk.data);
        if (chunk.meta.length > 0) {
          await kvw.put(chunkMetaKey(chunk.hash), createRefs(chunk.meta));
        }
        await kvw.commit();
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
    }
  };

  await t(new Uint8Array([1]), ['r1', 'r2'], true);
  await t(new Uint8Array([1]), [], true);
  await t(new Uint8Array([1]), ['r1', 'r2'], false);
});

function createMeta(refs: string[]): Uint8Array {
  const builder = new flatbuffers.Builder();
  const refsOffset = MetaFB.createRefsVector(
    builder,
    refs.map(r => builder.createString(r)),
  );
  const m = MetaFB.createMeta(builder, refsOffset);
  builder.finish(m);
  return builder.asUint8Array();
}

test('get head with Uint8Array support', async () => {
  const kv = new MemStore();
  const h1 = 'v1';
  const h2 = 'v2';
  const h3 = 'v3';
  await kv.withWrite(async kvw => {
    await kvw.put(headKey(h1), 'h1');
    await kvw.put(headKey(h2), utf8.encode('h2'));
    await kvw.put(headKey(h3), 42);
    await kvw.commit();
  });

  await kv.withRead(async kvr => {
    const r = new Read(kvr);
    expect(await r.getHead(h1)).to.equal('h1');
    expect(await r.getHead(h2)).to.equal('h2');
    let err;
    try {
      await r.getHead(h3);
    } catch (e) {
      err = e;
    }
    expect(err)
      .to.be.instanceOf(Error)
      .with.property('message', 'Invalid type: number `42`, expected string');
  });
});
