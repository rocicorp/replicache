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
import {initHasher} from '../hash';
import type {DataNode} from '../btree/node';
import type {ReadonlyJSONValue} from '../json';
import {Visitor} from './visitor';
import type {Commit} from './commit';

setup(async () => {
  await initHasher();
});

test('test that we get to the data nodes', async () => {
  const dagStore = new dag.Store(new MemStore());

  const log: ReadonlyJSONValue[] = [];
  const chain: Chain = [];

  class TestVisitor extends Visitor {
    override async visitBTreeDataNode(node: DataNode) {
      log.push(node[1]);
    }
  }

  const t = async (commit: Commit, expected: ReadonlyJSONValue[]) => {
    log.length = 0;
    await dagStore.withRead(async dagRead => {
      const visitor = new TestVisitor(dagRead);
      await visitor.visitCommit(commit.chunk.hash);
      expect(log).to.deep.equal(expected);
    });
  };

  await addGenesis(chain, dagStore);
  await t(chain[0], []);

  await addLocal(chain, dagStore);
  await t(chain[1], [[['local', '1']]]);

  await addIndexChange(chain, dagStore);
  await t(chain[2], [[['local', '1']], [['\u00001\u0000local', '1']]]);

  await addLocal(chain, dagStore);
  await t(chain[3], [
    [['local', '1']],
    [['\u00001\u0000local', '1']],
    [['local', '3']],
    [['\u00003\u0000local', '3']],
  ]);

  await addSnapshot(chain, dagStore, [['k', 42]]);
  await t(chain[4], [
    [
      ['k', 42],
      ['local', '3'],
    ],
    [['\u00003\u0000local', '3']],
  ]);
});
