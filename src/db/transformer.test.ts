import {expect} from '@esm-bundle/chai';
import * as dag from '../dag/mod';
import {MemStore} from '../kv/mod';
import {
  addGenesis,
  addIndexChange,
  addLocal,
  addSnapshot,
  Chain,
} from './test-helpers';
import {Commit, IndexRecord} from './commit';
import {Transformer} from './transformer';
import {Hash, initHasher} from '../hash';
import {BTreeRead, BTreeWrite, Entry} from '../btree/mod';
import type {DataNode} from '../btree/node';
import type {ReadonlyJSONValue} from '../json';
import {assert} from '../asserts';

setup(async () => {
  await initHasher();
});

test('noops transformBTreeInternalEntry', async () => {
  const dagStore = new dag.Store(new MemStore());

  await dagStore.withWrite(async write => {
    const transformer = new Transformer(write);

    const dataNode: DataNode = [0, [['k', 42]]];
    const chunk = dag.Chunk.new(dataNode, []);
    await write.putChunk(chunk);
    const entry: Entry<Hash> = ['key', chunk.hash];

    expect(await transformer.transformBTreeInternalEntry(entry)).to.equal(
      entry,
    );
  });
});

test('transformBTreeNode - noop', async () => {
  const dagStore = new dag.Store(new MemStore());

  await dagStore.withWrite(async write => {
    const transformer = new Transformer(write);

    const map = new BTreeWrite(write);
    await map.put('key', 'value');
    const valueHash = await map.flush();

    expect(await transformer.transformBTreeNode(valueHash)).to.equal(valueHash);
  });
});

test('transformCommit - noop', async () => {
  const dagStore = new dag.Store(new MemStore());

  const testChain = async (chain: Commit[]) => {
    await dagStore.withWrite(async write => {
      const transformer = new Transformer(write);

      for (const commit of chain) {
        const h = commit.chunk.hash;
        expect(await transformer.transformCommit(h)).to.equal(h);
      }
    });
  };

  const chain: Chain = [];
  await addGenesis(chain, dagStore);
  await addLocal(chain, dagStore);
  await addIndexChange(chain, dagStore);
  await addLocal(chain, dagStore);
  await testChain(chain);

  await addSnapshot(chain, dagStore, [['k', 42]]);
  await addLocal(chain, dagStore);
  await testChain(chain.slice(-2));
});

test('transformIndexRecord - noop', async () => {
  const dagStore = new dag.Store(new MemStore());

  await dagStore.withWrite(async write => {
    const transformer = new Transformer(write);

    const map = new BTreeWrite(write);
    await map.put('key', 'value');
    const valueHash = await map.flush();

    const index: IndexRecord = {
      definition: {
        jsonPointer: '',
        keyPrefix: '',
        name: 'index',
      },
      valueHash,
    };

    expect(await transformer.transformIndexRecord(index)).to.equal(index);
  });
});

test('transforms data entry', async () => {
  const dagStore = new dag.Store(new MemStore());

  class TestTransformer extends Transformer {
    override async transformBTreeDataEntry(
      entry: Entry<ReadonlyJSONValue>,
    ): Promise<Entry<ReadonlyJSONValue>> {
      if (entry[0] === 'k') {
        return ['k', entry[0] + ' - Changed!'];
      }
      return entry;
    }
  }

  const chain: Chain = [];
  await addGenesis(chain, dagStore);
  await addSnapshot(chain, dagStore, [['k', 42]]);
  await addLocal(chain, dagStore);

  await dagStore.withWrite(async write => {
    const transformer = new TestTransformer(write);

    const h = chain[2].chunk.hash;
    const h2 = await transformer.transformCommit(h);

    await write.setHead('test', h2);
    await write.commit();
  });

  await dagStore.withRead(async read => {
    const headHash = await read.getHead('test');
    assert(headHash);
    const commit = await Commit.fromHash(headHash, read);
    const map = new BTreeRead(read, commit.valueHash);
    expect(await map.get('k')).to.equal('k - Changed!');
  });
});
