import {expect} from '@esm-bundle/chai';
import * as dag from '../dag/mod';
import * as sync from '../sync/mod';
import {MemStore} from '../kv/mem-store';
import {addGenesis, addLocal, Chain} from '../db/test-helpers';
import {addSyncSnapshot} from '../sync/test-helpers';
import {commitImpl, openWriteTransactionImpl} from './connection';
import {LogContext} from '../logger';
import {initHasher} from '../hash';

setup(async () => {
  await initHasher();
});

test('open transaction rebase opts', async () => {
  const store = new dag.Store(new MemStore());
  const lc = new LogContext();

  const txns = new Map();
  const mainChain: Chain = [];
  await addGenesis(mainChain, store);
  await addLocal(mainChain, store);
  const syncChain = await addSyncSnapshot(mainChain, store, 0);
  const original = mainChain[1];
  if (!original.isLocal()) {
    throw new Error('not local');
  }
  let lm = original.meta;
  const originalHash = original.chunk.hash;
  const originalName = lm.mutatorName;
  const originalArgs = lm.mutatorArgsJSON;

  let result;
  try {
    // Error: rebase commit's basis must be sync head.
    result = await openWriteTransactionImpl(
      lc,
      store,
      txns,
      originalName,
      originalArgs,
      {
        basis: originalHash, // <-- not the sync head
        original: originalHash,
      },
    );
  } catch (e) {
    result = e;
  }
  expect(result).to.be.instanceOf(Error);
  expect(result.message).to.equal(
    'WrongSyncHeadJSLogInfo: sync head is isk9fvqti59teker527tq9n2sp605e9g, transaction basis is guqj839dn8u1vevbpj5fot376ln2nc2q',
  );

  // Error: rebase commit's name should not change.
  try {
    result = await openWriteTransactionImpl(
      lc,
      store,
      txns,
      'different',
      originalArgs,
      {
        basis: syncChain[0].chunk.hash,
        original: originalHash,
      },
    );
  } catch (e) {
    result = e;
  }

  expect(result).to.be.instanceOf(Error);
  expect(result.message).to.equal(
    'Inconsistent mutator: original: mutator_name_1, request: different',
  );

  // TODO test error: rebase commit's args should not change.
  // https://github.com/rocicorp/repc/issues/151

  // Ensure it doesn't let us rebase with a different mutation id.
  await addLocal(mainChain, store);
  const newLocal = mainChain[mainChain.length - 1];
  if (!newLocal.isLocal()) {
    throw new Error('not local');
  }
  lm = newLocal.meta;
  const newLocalHash = newLocal.chunk.hash;
  const newLocalName = lm.mutatorName;
  const newLocalArgs = lm.mutatorArgsJSON;
  try {
    result = await openWriteTransactionImpl(
      lc,
      store,
      txns,
      newLocalName,
      newLocalArgs,
      {
        basis: syncChain[0].chunk.hash,
        original: newLocalHash,
      },
    );
  } catch (e) {
    result = e;
  }
  expect(result).to.be.instanceOf(Error);
  expect(result.message).to.equal(
    'Inconsistent mutation ID: original: 2, next: 1',
  );

  // Correct rebase_opt (test this last because it affects the chain).
  const otr = await openWriteTransactionImpl(
    lc,
    store,
    txns,
    originalName,
    originalArgs,
    {
      basis: syncChain[0].chunk.hash,
      original: originalHash,
    },
  );
  const ctr = await commitImpl(txns, otr, false);

  await store.withWrite(async dagWrite => {
    const sync_head_hash = await dagWrite.read().getHead(sync.SYNC_HEAD_NAME);
    expect(ctr.ref).to.equal(sync_head_hash);
  });
});
