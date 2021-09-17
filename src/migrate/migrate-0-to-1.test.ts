import {expect} from '@esm-bundle/chai';
import {MemStore} from '../kv/mod';
import {
  currentVersion,
  migrateClientID,
  migrateCommit,
  migrateHeadKeyValue,
  migrateMetaKeyValue,
  migrateProllyMap,
  migrateRefCountKeyValue,
  setCurrentVersion,
} from './migrate-0-to-1';
import * as dag from '../dag/mod';
import * as db from '../db/mod';
import * as sync from '../sync/mod';
import * as utf8 from '../utf8';
import * as prolly from '../prolly/mod';
import {CommitData, MetaTyped} from '../db/commit';
import {initHasher} from '../hash';

setup(async () => {
  await initHasher();
});

test('current version', async () => {
  const kv = new MemStore();

  expect(await kv.withRead(currentVersion)).to.equal(0);

  await kv.withWrite(async w => {
    await setCurrentVersion(42, w);
  });

  expect(await kv.withRead(currentVersion)).to.equal(42);
});

test('migrateClientID', async () => {
  const kv = new MemStore();

  // OK if not present?
  await kv.withWrite(async w => {
    await migrateClientID(w);
  });

  const cid = 'test-client-id';
  await kv.withWrite(async w => {
    // @ts-expect-error - allow invalid value type
    await w.put(sync.CID_KEY, utf8.encode(cid));
  });
  await kv.withWrite(async w => {
    await migrateClientID(w);
  });
  await kv.withRead(async r => {
    expect(await r.get(sync.CID_KEY)).to.equal(cid);
  });
});

test('migrateMetaKeyValue', async () => {
  const t = async (expected: string[]) => {
    const kv = new MemStore();

    const hash = 'fakehash';

    // OK if not present?
    await kv.withWrite(async w => {
      await migrateMetaKeyValue(hash, w, new Set());
    });

    const buf = dag.metaToFlatbuffer(expected);
    await kv.withWrite(async w => {
      // @ts-expect-error Allow writing Uint8Array
      await w.put(dag.chunkMetaKey(hash), buf);
    });
    await kv.withWrite(async w => {
      await migrateMetaKeyValue(hash, w, new Set());
    });
    await kv.withRead(async r => {
      expect(await r.get(dag.chunkMetaKey(hash))).to.deep.equal(expected);
    });
  };

  await t([]);
  await t(['foo']);
  await t(['foo', 'bar']);
});

test('migrateRefCountKeyValue', async () => {
  const kv = new MemStore();

  const hash = 'fakehash';

  // OK if not present?
  await kv.withWrite(async w => {
    await migrateRefCountKeyValue(hash, w, new Set());
  });

  const t = async (count: number) => {
    const buf = dag.toLittleEndian(count);
    await kv.withWrite(async w => {
      // @ts-expect-error Allow writing Uint8Array
      await w.put(dag.chunkRefCountKey(hash), buf);
    });
    await kv.withWrite(async w => {
      await migrateRefCountKeyValue(hash, w, new Set());
    });
    await kv.withRead(async r => {
      expect(await r.get(dag.chunkRefCountKey(hash))).to.equal(count);
    });
  };

  await t(1);
  await t(42);
  await t(0xffff);
});

test('migrateHeadKeyValue', async () => {
  const kv = new MemStore();

  const name = 'head-name';
  const hash = 'fakehash';
  await kv.withWrite(async w => {
    // @ts-expect-error. Allow writing Uint8Array.
    await w.put(dag.headKey(name), utf8.encode(hash));
  });
  await kv.withWrite(async w => {
    const h = await migrateHeadKeyValue(name, w, new Set());
    expect(h).to.equal(hash);
  });
  await kv.withRead(async r => {
    expect(await r.get(dag.headKey(name))).to.equal(hash);
  });
});

test('migrateProllyMap', async () => {
  const t = async (entries: prolly.Entry[]) => {
    const kv = new MemStore();
    const hash = 'fakehash';

    const buf = prolly.entriesToFlatbuffer(entries);
    await kv.withWrite(async w => {
      // @ts-expect-error. Allow writing Uint8Array.
      await w.put(dag.chunkDataKey(hash), buf);
    });
    await kv.withWrite(async w => {
      await migrateProllyMap(hash, w, new Set());
    });
    await kv.withRead(async r => {
      expect(await r.get(dag.chunkDataKey(hash))).to.deep.equal(entries);
    });
  };

  await t([]);
  await t([['foo', 42]]);
  await t([['foo', false]]);
  await t([['foo', 0]]);
  await t([
    ['foo', true],
    ['bar', []],
  ]);
  await t([
    ['x', {}],
    ['y', {z: null}],
  ]);
});

test('migrateCommit', async () => {
  const kv = new MemStore();

  const entries: prolly.Entry[] = [['a', 42]];
  const entriesHash = 'entries-hash';

  const commit: CommitData = {
    meta: {
      type: MetaTyped.Snapshot,
      basisHash: null,
      cookieJSON: null,
      lastMutationID: 0,
    },
    valueHash: entriesHash,
    indexes: [],
  };
  const commitHash = 'commit-hash';
  const refs = [entriesHash];

  await kv.withWrite(async w => {
    await w.put(
      dag.chunkDataKey(entriesHash),
      // @ts-expect-error. Allow writing Uint8Array.
      prolly.entriesToFlatbuffer(entries),
    );
    await w.put(
      dag.chunkDataKey(commitHash),
      // @ts-expect-error. Allow writing Uint8Array.
      db.commitDataToFlatbuffer(commit),
    );
    await w.put(
      dag.chunkMetaKey(commitHash),
      // @ts-expect-error. Allow writing Uint8Array.
      dag.metaToFlatbuffer(refs),
    );
  });

  await kv.withWrite(async w => {
    await migrateCommit(commitHash, w, new Set());
  });

  await kv.withRead(async r => {
    expect(await r.get(dag.chunkDataKey(commitHash))).to.deep.equal(commit);
    expect(await r.get(dag.chunkMetaKey(commitHash))).to.deep.equal(refs);
    expect(await r.get(dag.chunkDataKey(entriesHash))).to.deep.equal(entries);
  });
});
