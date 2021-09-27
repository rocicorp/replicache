import {expect} from '@esm-bundle/chai';
import {MemStore} from '../kv/mod';
import {Chunk} from './chunk';
import {chunkDataKey, chunkMetaKey, chunkRefCountKey, headKey} from './key';
import {Write} from './write';
import type * as kv from '../kv/mod';
import {Read} from './read';
import {initHasher} from '../hash';
import type {Value} from '../kv/store';

setup(async () => {
  await initHasher();
});

test('put chunk', async () => {
  const t = async (data: Value, refs: string[]) => {
    const kv = new MemStore();
    await kv.withWrite(async kvw => {
      const w = new Write(kvw);
      const c = Chunk.new(data, refs);
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

  await t(0, []);
  await t(42, []);
  await t(true, []);
  await t(false, []);
  await t('', []);
  await t('hello', []);
  await t([], []);
  await t([1], []);
  await t({}, []);
  await t({a: 42}, []);
});

async function assertRefCount(kvr: kv.Read, hash: string, count: number) {
  const value = await kvr.get(chunkRefCountKey(hash));
  if (count === 0) {
    expect(value).to.be.undefined;
  } else {
    if (value === undefined) {
      throw new Error('value is undefined');
    }
    expect(value).to.equal(count);
  }
}

test('set head', async () => {
  const t = async (kv: kv.Store, name: string, hash: string | undefined) => {
    await kv.withWrite(async kvw => {
      const w = new Write(kvw);
      await (hash === undefined ? w.removeHead(name) : w.setHead(name, hash));
      if (hash !== undefined) {
        const h = await kvw.get(headKey(name));
        expect(h).to.equal(hash);
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

test('ref count invalid', async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = async (v: any, expectError?: string) => {
    const kv = new MemStore();
    const h = 'fakehash1';
    await kv.withWrite(async kvw => {
      await kvw.put(chunkRefCountKey(h), v);
      await kvw.commit();
    });
    await kv.withWrite(async kvw => {
      const w = new Write(kvw);
      let err;
      try {
        await w.getRefCount(h);
      } catch (e) {
        err = e;
      }
      if (expectError) {
        expect(err)
          .to.be.instanceof(Error)
          .with.property('message', expectError);
      } else {
        expect(err, 'No error expected').to.be.undefined;
      }
    });
  };

  await t(0);
  await t(1);
  await t(42);
  await t(0xffff);
  await t(-1, 'Invalid ref count -1. We expect the value to be a Uint16');
  await t(-1, 'Invalid ref count -1. We expect the value to be a Uint16');
  await t(1.5, 'Invalid ref count 1.5. We expect the value to be a Uint16');
  await t(NaN, 'Invalid ref count NaN. We expect the value to be a Uint16');
  await t(
    Infinity,
    'Invalid ref count Infinity. We expect the value to be a Uint16',
  );
  await t(
    -Infinity,
    'Invalid ref count -Infinity. We expect the value to be a Uint16',
  );
  await t(
    2 ** 16,
    'Invalid ref count 65536. We expect the value to be a Uint16',
  );
});

test('commit rollback', async () => {
  const t = async (commit: boolean, setHead: boolean) => {
    let key: string;
    const kv = new MemStore();
    await kv.withWrite(async kvw => {
      const w = new Write(kvw);
      const c = Chunk.new([0, 1], []);
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
  const t = async (name: string, data: Value, refs: string[]) => {
    const kv = new MemStore();
    const c = Chunk.new(data, refs);
    await kv.withWrite(async kvw => {
      const w = new Write(kvw);
      await w.putChunk(c);
      await w.setHead(name, c.hash);

      // Read the changes inside the tx.
      const c2 = await w.getChunk(c.hash);
      const h = await w.getHead(name);
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

  await t('', 0, []);
  await t('n1', 1, ['r1']);
  await t('n2', 42, ['r1', 'r2']);

  await t('', true, []);
  await t('', false, []);
  await t('', [], []);
  await t('', {}, []);
  await t('', null, []);
  await t('', [0], []);
  await t('', {a: true}, []);
});
