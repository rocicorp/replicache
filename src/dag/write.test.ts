import {expect} from '@esm-bundle/chai';
import {MemStore} from '../kv/mem-store';
import {Chunk} from './chunk';
import {chunkDataKey, chunkMetaKey, chunkRefCountKey, headKey} from './key';
import {Write} from './write';
import type {Read as KVRead, Store as KVStore} from '../kv/store';
import {fromLittleEndian} from './dag';
import {Read} from './read';

test('put chunk', async () => {
  const t = async (data: Uint8Array, refs: string[]) => {
    const kv = new MemStore();
    await kv.withWrite(async kvw => {
      const w = new Write(kvw);
      const c = await Chunk.new(data, refs);
      await w.putChunk(c);

      const kd = chunkDataKey(c.hash);
      const km = chunkMetaKey(c.hash);

      // The chunk data should always be there.
      expect(await kvw.get(kd)).to.deep.equal(c.data);

      // The chunk meta should only be there if there were refs.
      if (refs.length === 0) {
        expect(await kvw.has(km)).to.be.false;
      } else {
        expect(await kvw.get(km)).to.deep.equal(c.meta);
      }
    });
  };

  await t(new Uint8Array([]), []);
  await t(new Uint8Array([0]), ['r1']);
  await t(new Uint8Array([0, 1]), ['r1', 'r2']);
});

async function assertRefCount(kvr: KVRead, hash: string, count: number) {
  const buf = await kvr.get(chunkRefCountKey(hash));
  if (count === 0) {
    expect(buf).to.be.undefined;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const metaCount = fromLittleEndian(buf!);
    expect(metaCount).to.equal(count);
  }
}

test('set head', async () => {
  const t = async (kv: KVStore, name: string, hash: string | undefined) => {
    await kv.withWrite(async kvw => {
      const w = new Write(kvw);
      await w.setHead(name, hash);
      if (hash !== undefined) {
        expect(hash).to.equal(
          new TextDecoder().decode(await kvw.get(headKey(name))),
        );
      } else {
        expect(await kvw.get(headKey(name))).to.be.undefined;
      }
      await w.commit();
    });
  };

  const kv = new MemStore();

  await t(kv, '', '');
  await kv.withRead(async kvr => {
    await assertRefCount(kvr, '', 1);
  });

  await t(kv, '', 'h1');
  await kv.withRead(async kvr => {
    await assertRefCount(kvr, 'h1', 1);
    await assertRefCount(kvr, '', 0);
  });

  await t(kv, 'n1', '');
  await kv.withRead(async kvr => {
    await assertRefCount(kvr, '', 1);
  });

  await t(kv, 'n1', 'h1');
  await kv.withRead(async kvr => {
    await assertRefCount(kvr, 'h1', 2);
    await assertRefCount(kvr, '', 0);
  });

  await t(kv, 'n1', 'h1');
  await kv.withRead(async kvr => {
    await assertRefCount(kvr, 'h1', 2);
    await assertRefCount(kvr, '', 0);
  });

  await t(kv, 'n1', undefined);
  await kv.withRead(async kvr => {
    await assertRefCount(kvr, 'h1', 1);
    await assertRefCount(kvr, '', 0);
  });

  await t(kv, '', undefined);
  await kv.withRead(async kvr => {
    await assertRefCount(kvr, 'h1', 0);
    await assertRefCount(kvr, '', 0);
  });
});

test('commit rollback', async () => {
  const t = async (commit: boolean, setHead: boolean) => {
    let key: string;
    const kv = new MemStore();
    await kv.withWrite(async kvw => {
      const w = new Write(kvw);
      const c = await Chunk.new(new Uint8Array([0, 1]), []);
      await w.putChunk(c);

      key = chunkDataKey(c.hash);

      // The changes should be present inside the tx.
      expect(await kvw.has(key)).to.be.true;

      if (commit) {
        if (setHead) {
          await w.setHead('test', c.hash);
        }
        await w.commit();
      } else {
        // implicit rollback
      }
    });

    // The data should only persist if we set the head and commit.
    await kv.withRead(async kvr => {
      expect(setHead).to.be.equal(await kvr.has(key));
    });
  };
  await t(true, false);
  await t(false, false);
  await t(true, true);
});

test('roundtrip', async () => {
  const t = async (name: string, data: Uint8Array, refs: string[]) => {
    const kv = new MemStore();
    const c = await Chunk.new(data, refs);
    await kv.withWrite(async kvw => {
      const w = new Write(kvw);
      await w.putChunk(c);
      await w.setHead(name, c.hash);

      // Read the changes inside the tx.
      const c2 = await w.read().getChunk(c.hash);
      const h = await w.read().getHead(name);
      expect(c2).to.deep.equal(c);
      expect(c.hash).to.equal(h);
      await w.commit();
    });

    // Read the changes outside the tx.
    await kv.withRead(async kvr => {
      const r = new Read(kvr);
      const c2 = await r.getChunk(c.hash);
      const h = await r.getHead(name);
      expect(c2).to.deep.equal(c);
      expect(c.hash).to.equal(h);
    });
  };

  await t('', new Uint8Array([]), []);
  await t('n1', new Uint8Array([0]), ['r1']);
  await t('n2', new Uint8Array([0, 1]), ['r1', 'r2']);
});
