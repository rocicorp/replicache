import {assert} from '@esm-bundle/chai';
import * as dag from '../dag/mod';
import type * as btree from '../btree/mod';
import {
  assertHash,
  initHasher,
  isTempHash,
  makeNewFakeHashFunction,
} from '../hash';
import {addGenesis, addIndexChange, addLocal, Chain} from '../db/test-helpers';
import {GatheredChunks, WriteTransformer} from './write-transformer';
import {
  Commit,
  CommitData,
  Meta,
  newIndexChange,
  newLocal,
  newSnapshot,
} from '../db/mod';
import {BTreeRead, BTreeWrite} from '../btree/mod';
import type {Value} from '../kv/mod';
import {asyncIterableToArray} from '../async-iterable-to-array';

setup(async () => {
  await initHasher();
});

test('Nothing gathered, nothing written', async () => {
  const dagStore = new dag.TestStore();

  const chain: Chain = [];
  await addGenesis(chain, dagStore);
  await addLocal(chain, dagStore);
  await addIndexChange(chain, dagStore);
  await addLocal(chain, dagStore);

  const gatheredChunks: GatheredChunks = new Map();

  const snapshot = Object.fromEntries(dagStore.kvStore.entries());

  class TestTransformer extends WriteTransformer {
    override transformBTreeNodeData(
      data: btree.DataNode,
    ): Promise<btree.DataNode>;
    override transformBTreeNodeData(
      data: btree.InternalNode,
    ): Promise<btree.InternalNode>;
    override transformBTreeNodeData(data: btree.Node): Promise<btree.Node> {
      // Since the gathered chunks is empty, we should not be writing anything.
      assert.fail('should not be called with data: ' + JSON.stringify(data));
    }
  }

  await dagStore.withWrite(async dagWrite => {
    for (const commit of chain) {
      const transformer = new TestTransformer(dagWrite, gatheredChunks);
      const newHash = await transformer.transformCommit(commit.chunk.hash);
      assert.equal(newHash, commit.chunk.hash);
    }
  });

  assert.deepEqual(Object.fromEntries(dagStore.kvStore.entries()), snapshot);
});

test('single new commit on top of snapshot is written', async () => {
  const dagStore = new dag.TestStore();

  const chain: Chain = [];
  await addGenesis(chain, dagStore);

  const t = async (c: Commit<Meta>) => {
    assert.isFalse(isTempHash(c.chunk.hash));

    const gatheredChunks: GatheredChunks = new Map([[c.chunk.hash, c.chunk]]);

    const newHash = await dagStore.withWrite(async dagWrite => {
      const transformer = new WriteTransformer(dagWrite, gatheredChunks);
      const newHash = await transformer.transformCommit(c.chunk.hash);
      assert.equal(newHash, c.chunk.hash);
      await dagWrite.setHead('test', newHash);
      await dagWrite.commit();
      return newHash;
    });

    assert.isFalse(isTempHash(newHash));

    await dagStore.withRead(async dagRead => {
      const newChunk = await dagRead.getChunk(newHash);
      const snapshotCommit = chain[0];

      assert.equal(
        (newChunk?.data as CommitData<Meta>)?.valueHash,
        snapshotCommit.valueHash,
      );

      assert.deepEqual(newChunk?.data, c.chunk.data);
      assert.deepEqual(newChunk?.data, c.chunk.data);
      assert.equal(newChunk?.hash, c.chunk.hash);
    });
  };

  const fakeHasher = makeNewFakeHashFunction('fake');
  const {valueHash, indexes, chunk} = chain[0];
  const basisHash = chunk.hash;
  const lastMutationID = 123;
  const cookieJSON = 'monster';
  const createChunk: dag.CreateChunk = (data, refs) =>
    dag.createChunkWithHash(fakeHasher(), data, refs);

  const mutationID = lastMutationID + 1;
  const mutatorName = 'test';
  const mutatorArgsJSON = {data: 42};
  const originalHash = null;

  await t(
    newLocal(
      createChunk,
      basisHash,
      mutationID,
      mutatorName,
      mutatorArgsJSON,
      originalHash,
      valueHash,
      indexes,
    ),
  );

  await t(
    newSnapshot(
      createChunk,
      basisHash,
      lastMutationID,
      cookieJSON,
      valueHash,
      indexes,
    ),
  );

  await t(
    newIndexChange(createChunk, basisHash, lastMutationID, valueHash, indexes),
  );
});

test('single new snapshot with new btree on top of snapshot is written', async () => {
  const memdag = new dag.TestStore(
    undefined,
    makeNewFakeHashFunction('t/memdag'),
    assertHash,
  );
  const perdag = new dag.TestStore(
    undefined,
    makeNewFakeHashFunction('perdag'),
    assertHash,
  );

  const chain: Chain = [];
  await addGenesis(chain, perdag);

  const {indexes, chunk} = chain[0];
  const basisHash = chunk.hash;
  const lastMutationID = 123;
  const cookieJSON = 'monster';
  const fakeHasher = makeNewFakeHashFunction('fake');
  const createChunk: dag.CreateChunk = (data, refs) =>
    dag.createChunkWithHash(fakeHasher(), data, refs);

  const entries = Object.entries({
    a: true,
    b: false,
  });

  const treeChunk = await memdag.withWrite(async dagWrite => {
    const tree = new BTreeWrite(dagWrite);
    for (const [k, v] of entries) {
      await tree.put(k, v);
    }
    const h = await tree.flush();
    await dagWrite.setHead('tree', h);
    await dagWrite.commit();
    const chunk = await dagWrite.getChunk(h);
    return chunk as dag.Chunk<btree.DataNode>;
  });
  assert.isTrue(isTempHash(treeChunk.hash));

  assert.deepEqual(perdag.kvStore.snapshot(), {
    'c/perdag00000000000000000000000000/d': [0, []],
    'c/perdag00000000000000000000000000/r': 1,
    'c/perdag00000000000000000000000001/d': {
      indexes: [],
      meta: {
        basisHash: null,
        cookieJSON: null,
        lastMutationID: 0,
        type: 3,
      },
      valueHash: 'perdag00000000000000000000000000',
    },
    'c/perdag00000000000000000000000001/m': [
      'perdag00000000000000000000000000',
    ],
    'c/perdag00000000000000000000000001/r': 1,
    'h/main': 'perdag00000000000000000000000001',
  });

  assert.deepEqual(memdag.kvStore.snapshot(), {
    'c/t/memdag000000000000000000000000/d': [
      0,
      [
        ['a', true],
        ['b', false],
      ],
    ],
    'c/t/memdag000000000000000000000000/r': 1,
    'h/tree': 't/memdag000000000000000000000000',
  });

  const fixedTreeChunk = dag.createChunkWithHash(
    fakeHasher(),
    treeChunk.data,
    treeChunk.meta,
  );

  const c = newSnapshot(
    createChunk,
    basisHash,
    lastMutationID,
    cookieJSON,
    fixedTreeChunk.hash,
    indexes,
  );
  assert.isFalse(isTempHash(c.chunk.hash));

  const gatheredChunks: GatheredChunks = new Map([
    [c.chunk.hash, c.chunk as dag.Chunk<Value>],
    [fixedTreeChunk.hash, fixedTreeChunk as dag.Chunk<Value>],
  ]);

  const newHash = await perdag.withWrite(async dagWrite => {
    const transformer = new WriteTransformer(dagWrite, gatheredChunks);
    const newHash = await transformer.transformCommit(c.chunk.hash);
    assert.equal(newHash, c.chunk.hash);
    await dagWrite.setHead('main', newHash);
    await dagWrite.removeHead('test');
    await dagWrite.commit();
    return newHash;
  });

  assert.isFalse(isTempHash(newHash));

  await perdag.withRead(async dagRead => {
    const newCommit = await Commit.fromHash(newHash, dagRead);
    assert.isFalse(isTempHash(newCommit.valueHash));
    const newTree = new BTreeRead(dagRead, newCommit.valueHash);
    const newEntries = await asyncIterableToArray(newTree.entries());
    assert.deepEqual(newEntries, entries);
  });

  assert.deepEqual(perdag.kvStore.snapshot(), {
    'c/fake0000000000000000000000000000/d': [
      0,
      [
        ['a', true],
        ['b', false],
      ],
    ],
    'c/fake0000000000000000000000000000/r': 1,
    'c/fake0000000000000000000000000001/d': {
      indexes: [],
      meta: {
        basisHash: 'perdag00000000000000000000000001',
        cookieJSON: 'monster',
        lastMutationID: 123,
        type: 3,
      },
      valueHash: 'fake0000000000000000000000000000',
    },
    'c/fake0000000000000000000000000001/m': [
      'fake0000000000000000000000000000',
    ],
    'c/fake0000000000000000000000000001/r': 1,
    'h/main': 'fake0000000000000000000000000001',
  });
});
