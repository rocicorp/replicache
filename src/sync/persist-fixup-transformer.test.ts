import {assert} from '@esm-bundle/chai';
import * as dag from '../dag/mod';
import * as db from '../db/mod';
import {
  fakeHash,
  initHasher,
  makeNewTempHashFunction,
  parse as parseHash,
} from '../hash';
import {BTreeWrite} from '../btree/write';
import {PersistFixupTransformer} from './persist-fixup-transformer';

setup(async () => {
  await initHasher();
});

test('fixup of a single snapshot commit with empty btree', async () => {
  const memdag = new dag.TestStore(
    undefined,
    makeNewTempHashFunction(),
    () => undefined,
  );

  const [headHash, valueHash] = await memdag.withWrite(async dagWrite => {
    const tree = new BTreeWrite(dagWrite);
    const valueHash = await tree.flush();
    const c = db.newSnapshot(
      dagWrite.createChunk,
      null,
      0,
      null,
      valueHash,
      [],
    );
    await dagWrite.putChunk(c.chunk);
    await dagWrite.setHead('test', c.chunk.hash);
    await dagWrite.commit();
    return [c.chunk.hash, valueHash];
  });

  assert.deepEqual(memdag.kvStore.snapshot(), {
    'c/t/000000000000000000000000000000/d': [0, []],
    'c/t/000000000000000000000000000001/d': {
      meta: {type: 3, basisHash: null, lastMutationID: 0, cookieJSON: null},
      valueHash: 't/000000000000000000000000000000',
      indexes: [],
    },
    'c/t/000000000000000000000000000001/m': [
      't/000000000000000000000000000000',
    ],
    'h/test': 't/000000000000000000000000000001',
    'c/t/000000000000000000000000000000/r': 1,
    'c/t/000000000000000000000000000001/r': 1,
  });

  const mappings = new Map([
    [headHash, fakeHash('head')],
    [valueHash, fakeHash('value')],
  ]);

  const newHeadHash = await memdag.withWrite(async dagWrite => {
    const transformer = new PersistFixupTransformer(dagWrite, mappings);
    const newHeadHash = await transformer.transformCommit(headHash);

    await dagWrite.setHead('test', newHeadHash);
    await dagWrite.commit();
    return newHeadHash;
  });

  assert.equal(newHeadHash, fakeHash('head'));

  assert.deepEqual(memdag.kvStore.snapshot(), {
    'h/test': 'fake000000000000000000000000head',
    'c/fake00000000000000000000000value/d': [0, []],
    'c/fake000000000000000000000000head/d': {
      meta: {type: 3, basisHash: null, lastMutationID: 0, cookieJSON: null},
      valueHash: 'fake00000000000000000000000value',
      indexes: [],
    },
    'c/fake000000000000000000000000head/m': [
      'fake00000000000000000000000value',
    ],
    'c/fake00000000000000000000000value/r': 1,
    'c/fake000000000000000000000000head/r': 1,
  });

  // Now add a local commit on top of the snapshot commit.
  {
    const headHash = await memdag.withWrite(async dagWrite => {
      const c = db.newLocal(
        dagWrite.createChunk,
        newHeadHash,
        1,
        'test',
        {v: 42},
        null,
        fakeHash('value'),
        [],
      );
      await dagWrite.putChunk(c.chunk);
      await dagWrite.setHead('test', c.chunk.hash);
      await dagWrite.commit();
      return c.chunk.hash;
    });

    assert.deepEqual(memdag.kvStore.snapshot(), {
      'c/fake000000000000000000000000head/d': {
        indexes: [],
        meta: {
          basisHash: null,
          cookieJSON: null,
          lastMutationID: 0,
          type: 3,
        },
        valueHash: 'fake00000000000000000000000value',
      },
      'c/fake000000000000000000000000head/m': [
        'fake00000000000000000000000value',
      ],
      'c/fake000000000000000000000000head/r': 1,
      'c/fake00000000000000000000000value/d': [0, []],
      'c/fake00000000000000000000000value/r': 2,
      'c/t/000000000000000000000000000002/d': {
        indexes: [],
        meta: {
          basisHash: 'fake000000000000000000000000head',
          mutationID: 1,
          mutatorArgsJSON: {
            v: 42,
          },
          mutatorName: 'test',
          originalHash: null,
          type: 2,
        },
        valueHash: 'fake00000000000000000000000value',
      },
      'c/t/000000000000000000000000000002/m': [
        'fake00000000000000000000000value',
        'fake000000000000000000000000head',
      ],
      'c/t/000000000000000000000000000002/r': 1,
      'h/test': 't/000000000000000000000000000002',
    });

    const mappings = new Map([[headHash, fakeHash('head2')]]);

    const newHeadHash2 = await memdag.withWrite(async dagWrite => {
      const transformer = new PersistFixupTransformer(dagWrite, mappings);
      const newHeadHash = await transformer.transformCommit(headHash);

      await dagWrite.setHead('test', newHeadHash);
      await dagWrite.commit();
      return newHeadHash;
    });

    assert.deepEqual(memdag.kvStore.snapshot(), {
      'c/fake000000000000000000000000head/d': {
        indexes: [],
        meta: {
          basisHash: null,
          cookieJSON: null,
          lastMutationID: 0,
          type: 3,
        },
        valueHash: 'fake00000000000000000000000value',
      },
      'c/fake000000000000000000000000head/m': [
        'fake00000000000000000000000value',
      ],
      'c/fake000000000000000000000000head/r': 1,
      'c/fake00000000000000000000000head2/d': {
        indexes: [],
        meta: {
          basisHash: 'fake000000000000000000000000head',
          mutationID: 1,
          mutatorArgsJSON: {
            v: 42,
          },
          mutatorName: 'test',
          originalHash: null,
          type: 2,
        },
        valueHash: 'fake00000000000000000000000value',
      },
      'c/fake00000000000000000000000head2/m': [
        'fake00000000000000000000000value',
        'fake000000000000000000000000head',
      ],
      'c/fake00000000000000000000000head2/r': 1,
      'c/fake00000000000000000000000value/d': [0, []],
      'c/fake00000000000000000000000value/r': 2,
      'h/test': 'fake00000000000000000000000head2',
    });
    assert.equal(newHeadHash2, fakeHash('head2'));
  }
});

test('fixup of a single snapshot commit with a btree with internal nodes', async () => {
  const memdag = new dag.TestStore(
    undefined,
    makeNewTempHashFunction(),
    () => undefined,
  );

  const entries = Object.entries({
    a: 0,
    b: 1,
    c: 2,
    d: 3,
    e: 4,
    f: 5,
  });

  const [headHash, valueHash] = await memdag.withWrite(async dagWrite => {
    const tree = new BTreeWrite(dagWrite, undefined, 2, 4, () => 1, 0);
    for (const [k, v] of entries) {
      await tree.put(k, v);
    }

    const valueHash = await tree.flush();
    const c = db.newSnapshot(
      dagWrite.createChunk,
      null,
      0,
      null,
      valueHash,
      [],
    );
    await dagWrite.putChunk(c.chunk);
    await dagWrite.setHead('test', c.chunk.hash);
    await dagWrite.commit();
    return [c.chunk.hash, valueHash];
  });

  // console.log(JSON.stringify(memdag.kvStore.snapshot(), null, 2));

  assert.deepEqual(
    memdag.kvStore.snapshot(),

    {
      'c/t/000000000000000000000000000000/d': [
        0,
        [
          ['a', 0],
          ['b', 1],
        ],
      ],
      'c/t/000000000000000000000000000001/d': [
        0,
        [
          ['c', 2],
          ['d', 3],
          ['e', 4],
          ['f', 5],
        ],
      ],
      'c/t/000000000000000000000000000002/d': [
        1,
        [
          ['b', 't/000000000000000000000000000000'],
          ['f', 't/000000000000000000000000000001'],
        ],
      ],
      'c/t/000000000000000000000000000002/m': [
        't/000000000000000000000000000000',
        't/000000000000000000000000000001',
      ],
      'c/t/000000000000000000000000000003/d': {
        meta: {
          type: 3,
          basisHash: null,
          lastMutationID: 0,
          cookieJSON: null,
        },
        valueHash: 't/000000000000000000000000000002',
        indexes: [],
      },
      'c/t/000000000000000000000000000003/m': [
        't/000000000000000000000000000002',
      ],
      'h/test': 't/000000000000000000000000000003',
      'c/t/000000000000000000000000000000/r': 1,
      'c/t/000000000000000000000000000001/r': 1,
      'c/t/000000000000000000000000000002/r': 1,
      'c/t/000000000000000000000000000003/r': 1,
    },
  );

  const mappings = new Map([
    [headHash, fakeHash('head')],
    [valueHash, fakeHash('value')],
    [parseHash('t/000000000000000000000000000000'), fakeHash('data0')],
    [parseHash('t/000000000000000000000000000001'), fakeHash('data1')],
  ]);

  const newHeadHash = await memdag.withWrite(async dagWrite => {
    const transformer = new PersistFixupTransformer(dagWrite, mappings);
    const newHeadHash = await transformer.transformCommit(headHash);

    await dagWrite.setHead('test', newHeadHash);
    await dagWrite.commit();
    return newHeadHash;
  });

  assert.equal(newHeadHash, fakeHash('head'));

  // console.log(JSON.stringify(memdag.kvStore.snapshot(), null, 2));

  assert.deepEqual(
    memdag.kvStore.snapshot(),

    {
      'h/test': 'fake000000000000000000000000head',
      'c/fake00000000000000000000000data0/d': [
        0,
        [
          ['a', 0],
          ['b', 1],
        ],
      ],
      'c/fake00000000000000000000000data1/d': [
        0,
        [
          ['c', 2],
          ['d', 3],
          ['e', 4],
          ['f', 5],
        ],
      ],
      'c/fake00000000000000000000000value/d': [
        1,
        [
          ['b', 'fake00000000000000000000000data0'],
          ['f', 'fake00000000000000000000000data1'],
        ],
      ],
      'c/fake00000000000000000000000value/m': [
        'fake00000000000000000000000data0',
        'fake00000000000000000000000data1',
      ],
      'c/fake000000000000000000000000head/d': {
        meta: {
          type: 3,
          basisHash: null,
          lastMutationID: 0,
          cookieJSON: null,
        },
        valueHash: 'fake00000000000000000000000value',
        indexes: [],
      },
      'c/fake000000000000000000000000head/m': [
        'fake00000000000000000000000value',
      ],
      'c/fake00000000000000000000000data0/r': 1,
      'c/fake00000000000000000000000data1/r': 1,
      'c/fake00000000000000000000000value/r': 1,
      'c/fake000000000000000000000000head/r': 1,
    },
  );
});
