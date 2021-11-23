import {assert} from '@esm-bundle/chai';
import * as dag from '../dag/mod';
import type * as btree from '../btree/mod';
import {initHasher, isTempHash, newTempHash} from '../hash';
import {addGenesis, addIndexChange, addLocal, Chain} from '../db/test-helpers';
import {
  GatheredChunks,
  PersistWriteTransformer,
} from './persist-write-transformer';
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

  class TestTransformer extends PersistWriteTransformer {
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
    assert.isTrue(isTempHash(c.chunk.hash));

    const gatheredChunks: GatheredChunks = new Map([[c.chunk.hash, c.chunk]]);

    const newHash = await dagStore.withWrite(async dagWrite => {
      const transformer = new PersistWriteTransformer(dagWrite, gatheredChunks);
      const newHash = await transformer.transformCommit(c.chunk.hash);
      assert.notEqual(newHash, c.chunk.hash);
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
      assert.notEqual(newChunk?.hash, c.chunk.hash);
    });
  };

  const {valueHash, indexes, chunk} = chain[0];
  const basisHash = chunk.hash;
  const lastMutationID = 123;
  const cookieJSON = 'monster';
  const createChunk: dag.CreateChunk = (data, refs) =>
    dag.createChunk(data, refs, newTempHash);

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
  const memdag = new dag.TestStore(undefined, newTempHash, () => undefined);
  const perdag = new dag.TestStore();

  const chain: Chain = [];
  await addGenesis(chain, perdag);

  const {indexes, chunk} = chain[0];
  const basisHash = chunk.hash;
  const lastMutationID = 123;
  const cookieJSON = 'monster';
  const createChunk: dag.CreateChunk = (data, refs) =>
    dag.createChunk(data, refs, newTempHash);

  const entries = Object.entries({
    memdag: true,
    perdag: false,
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

  const snapshotBefore = Object.fromEntries(perdag.kvStore.entries());
  assert.deepEqual(snapshotBefore, {
    'c/mdcncodijhl6jk2o8bb7m0hg15p3sf24/d': [0, []],
    'c/9lrb08p9b7jqo8oad3aef60muj4td8ke/d': {
      meta: {type: 3, basisHash: null, lastMutationID: 0, cookieJSON: null},
      valueHash: 'mdcncodijhl6jk2o8bb7m0hg15p3sf24',
      indexes: [],
    },
    'c/9lrb08p9b7jqo8oad3aef60muj4td8ke/m': [
      'mdcncodijhl6jk2o8bb7m0hg15p3sf24',
    ],
    'h/main': '9lrb08p9b7jqo8oad3aef60muj4td8ke',
    'c/mdcncodijhl6jk2o8bb7m0hg15p3sf24/r': 1,
    'c/9lrb08p9b7jqo8oad3aef60muj4td8ke/r': 1,
  });

  const c = newSnapshot(
    createChunk,
    basisHash,
    lastMutationID,
    cookieJSON,
    treeChunk.hash,
    indexes,
  );
  assert.isTrue(isTempHash(c.chunk.hash));

  const gatheredChunks: GatheredChunks = new Map([
    [c.chunk.hash, c.chunk as dag.Chunk<Value>],
    [treeChunk.hash, treeChunk as dag.Chunk<Value>],
  ]);

  const newHash = await perdag.withWrite(async dagWrite => {
    const transformer = new PersistWriteTransformer(dagWrite, gatheredChunks);
    const newHash = await transformer.transformCommit(c.chunk.hash);
    assert.notEqual(newHash, c.chunk.hash);
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

  const snapshotAfter = Object.fromEntries(perdag.kvStore.entries());
  assert.deepEqual(snapshotAfter, {
    'h/main': 'joi3b834ue0iql9tmfpkjc50ihml4mbl',
    'c/8prggufvsba8bja61khrh70ut4daptcn/d': [
      0,
      [
        ['memdag', true],
        ['perdag', false],
      ],
    ],
    'c/joi3b834ue0iql9tmfpkjc50ihml4mbl/d': {
      meta: {
        type: 3,
        basisHash: '9lrb08p9b7jqo8oad3aef60muj4td8ke',
        lastMutationID: 123,
        cookieJSON: 'monster',
      },
      valueHash: '8prggufvsba8bja61khrh70ut4daptcn',
      indexes: [],
    },
    'c/joi3b834ue0iql9tmfpkjc50ihml4mbl/m': [
      '8prggufvsba8bja61khrh70ut4daptcn',
    ],
    'c/8prggufvsba8bja61khrh70ut4daptcn/r': 1,
    'c/joi3b834ue0iql9tmfpkjc50ihml4mbl/r': 1,
  });
});
