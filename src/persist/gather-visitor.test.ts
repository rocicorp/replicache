import {expect} from '@esm-bundle/chai';
import * as dag from '../dag/mod';
import {makeNewTempHashFunction, newTempHash} from '../hash';
import {
  addGenesis,
  addIndexChange,
  addLocal,
  addSnapshot,
  Chain,
} from '../db/test-helpers';
import {GatherVisitor} from './gather-visitor';
import {TestMemStore} from '../kv/test-mem-store';
import {sortByHash} from '../dag/test-store';

test('dag with no temp hashes gathers nothing', async () => {
  const dagStore = new dag.TestStore();

  const chain: Chain = [];
  await addGenesis(chain, dagStore);
  await addLocal(chain, dagStore);
  await addIndexChange(chain, dagStore);
  await addLocal(chain, dagStore);

  await dagStore.withRead(async dagRead => {
    for (const commit of chain) {
      const visitor = new GatherVisitor(dagRead);
      await visitor.visitCommit(commit.chunk.hash);
      expect(visitor.gatheredChunks).to.be.empty;
    }
  });

  await addSnapshot(chain, dagStore, undefined);

  await dagStore.withRead(async dagRead => {
    const visitor = new GatherVisitor(dagRead);
    await visitor.visitCommit(chain[chain.length - 1].chunk.hash);
    expect(visitor.gatheredChunks).to.be.empty;
  });
});

test('dag with only temp hashes gathers eveything', async () => {
  const kvStore = new TestMemStore();
  const dagStore = new dag.TestStore(kvStore, newTempHash, () => void 0);
  const chain: Chain = [];

  const testGatheredChunks = async () => {
    await dagStore.withRead(async dagRead => {
      const visitor = new GatherVisitor(dagRead);
      await visitor.visitCommit(chain[chain.length - 1].chunk.hash);
      expect(dagStore.chunks()).to.deep.equal(
        sortByHash(visitor.gatheredChunks.values()),
      );
    });
  };

  await addGenesis(chain, dagStore);
  await addLocal(chain, dagStore);
  await testGatheredChunks();

  await addIndexChange(chain, dagStore);
  await addLocal(chain, dagStore);
  await testGatheredChunks();

  await addSnapshot(chain, dagStore, undefined);
  await testGatheredChunks();
});

test('dag with some permanent hashes and some temp hashes on top', async () => {
  const kvStore = new TestMemStore();
  const perdag = new dag.TestStore(kvStore);
  const chain: Chain = [];

  await addGenesis(chain, perdag);
  await addLocal(chain, perdag);

  await perdag.withRead(async dagRead => {
    const visitor = new GatherVisitor(dagRead);
    await visitor.visitCommit(chain[chain.length - 1].chunk.hash);
    expect(visitor.gatheredChunks).to.be.empty;
  });

  const memdag = new dag.TestStore(
    kvStore,
    makeNewTempHashFunction(),
    () => void 0,
  );

  await addLocal(chain, memdag);

  await memdag.withRead(async dagRead => {
    const visitor = new GatherVisitor(dagRead);
    await visitor.visitCommit(chain[chain.length - 1].chunk.hash);
    expect(Object.fromEntries(visitor.gatheredChunks)).to.deep.equal({
      't/000000000000000000000000000000': {
        data: [0, [['local', '2']]],
        hash: 't/000000000000000000000000000000',
        meta: [],
      },
      't/000000000000000000000000000001': {
        data: {
          indexes: [],
          meta: {
            basisHash: 'fakehash000000000000000000000003',
            mutationID: 2,
            mutatorArgsJSON: [2],
            mutatorName: 'mutator_name_2',
            originalHash: null,
            timestamp: 42,
            type: 2,
          },
          valueHash: 't/000000000000000000000000000000',
        },
        hash: 't/000000000000000000000000000001',
        meta: [
          't/000000000000000000000000000000',
          'fakehash000000000000000000000003',
        ],
      },
    });
  });

  await addSnapshot(
    chain,
    perdag,
    Object.entries({
      a: 1,
      b: 2,
      c: 3,
      d: 4,
    }),
  );
  await addIndexChange(chain, memdag);

  await memdag.withRead(async dagRead => {
    const visitor = new GatherVisitor(dagRead);
    await visitor.visitCommit(chain[chain.length - 1].chunk.hash);
    expect(Object.fromEntries(visitor.gatheredChunks)).to.deep.equal({
      't/000000000000000000000000000002': {
        data: [0, [['\u00002\u0000local', '2']]],
        hash: 't/000000000000000000000000000002',
        meta: [],
      },
      't/000000000000000000000000000003': {
        data: {
          indexes: [
            {
              definition: {
                jsonPointer: '',
                keyPrefix: 'local',
                name: '4',
              },
              valueHash: 't/000000000000000000000000000002',
            },
          ],
          meta: {
            basisHash: 'fakehash000000000000000000000005',
            lastMutationID: 3,
            type: 1,
          },
          valueHash: 'fakehash000000000000000000000004',
        },
        hash: 't/000000000000000000000000000003',
        meta: [
          'fakehash000000000000000000000004',
          'fakehash000000000000000000000005',
          't/000000000000000000000000000002',
        ],
      },
    });
  });
});
