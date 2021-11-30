import {expect} from '@esm-bundle/chai';
import {SinonFakeTimers, useFakeTimers} from 'sinon';
import {assert} from '../asserts';
import type {Node} from '../btree/node';
import * as dag from '../dag/mod';
import * as db from '../db/mod';
import {
  addGenesis,
  addIndexChange,
  addLocal,
  addSnapshot,
  Chain,
} from '../db/test-helpers';
import {
  assertHash,
  assertNotTempHash,
  Hash,
  isTempHash,
  makeNewFakeHashFunction,
} from '../hash';
import type {Value} from '../kv/store';
import type {ClientID} from '../sync/client-id';
import {getClient} from './clients';
import {addSyncSnapshot} from '../sync/test-helpers';
import {persist} from './persist';

let clock: SinonFakeTimers;
setup(() => {
  clock = useFakeTimers(123456789);
});

teardown(() => {
  clock.restore();
});

async function assertSameDagData(
  clientID: ClientID,
  memdag: dag.TestStore,
  perdag: dag.TestStore,
): Promise<void> {
  const memdagHeadHash = await memdag.withRead(async dagRead => {
    const headHash = await dagRead.getHead(db.DEFAULT_HEAD_NAME);
    expect(isTempHash(headHash)).to.be.false;
    return headHash;
  });
  const perdagClientHash = await perdag.withRead(async dagRead => {
    const client = await getClient(clientID, dagRead);
    assert(client);
    return client.headHash;
  });
  expect(memdagHeadHash).to.equal(perdagClientHash);
  assertHash(memdagHeadHash);

  const memSnapshot = await getChunkSnapshot(memdag, memdagHeadHash);
  const perSnapshot = await getChunkSnapshot(perdag, perdagClientHash);

  expect(memSnapshot).to.deep.equal(perSnapshot);
}

test('persist pipeline', async () => {
  const memdag = new dag.TestStore(
    undefined,
    makeNewFakeHashFunction('t/memdag'),
    assertHash,
  );
  const perdag = new dag.TestStore(
    undefined,
    makeNewFakeHashFunction('perdag'),
    assertNotTempHash,
  );
  const clientID = 'client-id';

  const chain: Chain = [];

  const reset = async () => {
    memdag.clear();
    perdag.clear();
    chain.length = 0;
    await addGenesis(chain, memdag);
  };

  const testPersist = async () => {
    await persist(clientID, memdag, perdag);
    await assertSameDagData(clientID, memdag, perdag);
  };

  await reset();
  await testPersist();

  await reset();
  await addLocal(chain, memdag);
  await testPersist();

  await reset();
  await addSnapshot(chain, memdag, [
    ['a', 0],
    ['b', 1],
    ['c', 2],
  ]);
  await testPersist();

  await reset();
  await addLocal(chain, memdag);
  await addSyncSnapshot(chain, memdag, 1);
  await testPersist();

  await reset();
  await addLocal(chain, memdag);
  await addLocal(chain, memdag);
  await testPersist();

  await reset();
  await addLocal(chain, memdag);
  await testPersist();
  await addLocal(chain, memdag);
  await testPersist();

  await reset();
  await addLocal(chain, memdag);
  await addLocal(chain, memdag);
  await addLocal(chain, memdag);
  await testPersist();

  await reset();
  await addLocal(chain, memdag);
  await addSnapshot(chain, memdag, [['changed', 3]]);
  await testPersist();

  await reset();
  await addLocal(chain, memdag);
  await addSnapshot(chain, memdag, [['changed', 4]]);
  await addLocal(chain, memdag);
  await testPersist();

  await reset();
  await addLocal(chain, memdag);
  await addSnapshot(chain, memdag, [['changed', 5]]);
  await addLocal(chain, memdag);
  await addSyncSnapshot(chain, memdag, 3);
  await testPersist();

  await reset();
  await addLocal(chain, memdag);
  await addIndexChange(chain, memdag);
  await testPersist();
});

class ChunkSnapshotVisitor extends db.Visitor {
  snapshot: Record<string, Value> = {};

  override visitCommitChunk(
    chunk: dag.Chunk<db.CommitData<db.Meta>>,
  ): Promise<void> {
    this.snapshot[chunk.hash.toString()] = chunk.data;
    return super.visitCommitChunk(chunk);
  }

  override visitBTreeNodeChunk(chunk: dag.Chunk<Node>): Promise<void> {
    this.snapshot[chunk.hash.toString()] = chunk.data;
    return super.visitBTreeNodeChunk(chunk);
  }
}

async function getChunkSnapshot(
  dagStore: dag.Store,
  hash: Hash,
): Promise<Record<string, Value>> {
  return dagStore.withRead(async dagRead => {
    const v = new ChunkSnapshotVisitor(dagRead);
    await v.visitCommit(hash);
    return v.snapshot;
  });
}
