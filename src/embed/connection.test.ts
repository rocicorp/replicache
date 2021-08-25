import {expect} from '@esm-bundle/chai';
import * as dag from '../dag/mod.js';
import * as db from '../db/mod.js';
import * as sync from '../sync/mod.js';
import * as utf8 from '../utf8.js';
import {MemStore} from '../kv/mem-store.js';
import {addGenesis, addLocal, Chain} from '../db/test-helpers.js';
import {addSyncSnapshot} from '../sync/test-helpers.js';
import {commitImpl, openTransactionImpl} from './connection.js';

test('open transaction rebase opts', async () => {
  const store = new dag.Store(new MemStore());

  const txns = new Map();
  const main_chain: Chain = [];
  await addGenesis(main_chain, store);
  await addLocal(main_chain, store);
  const sync_chain = await addSyncSnapshot(main_chain, store, 0);
  const original = main_chain[1];
  let meta = original.meta();
  if (!meta.isLocal()) {
    throw new Error('not local');
  }
  let lm = meta.typed() as db.LocalMeta;
  const original_hash = original.chunk.hash;
  const original_name = lm.mutatorName();
  const original_args = utf8.decode(lm.mutatorArgsJSON());

  // drop(meta);
  // drop(original);

  let result;
  try {
    // Error: rebase commit's basis must be sync head.
    result = await openTransactionImpl(
      store,
      txns,
      original_name,
      original_args,
      {
        basis: original_hash, // <-- not the sync head
        original: original_hash,
      },
    );
  } catch (e) {
    result = e;
  }
  expect(result).to.be.instanceOf(Error);
  expect(result.message).to.equal(
    'WrongSyncHeadJSLogInfo: sync head is c50qh3sv6pv6g956205g5566ftjd20pr, transaction basis is 5vm3movfjjpjs5sanpmnd4n965kvn04p',
  );

  // Error: rebase commit's name should not change.
  try {
    result = await openTransactionImpl(
      store,
      txns,
      'different',
      original_args,
      {
        basis: sync_chain[0].chunk.hash,
        original: original_hash,
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
  await addLocal(main_chain, store);
  const new_local = main_chain[main_chain.length - 1];
  meta = new_local.meta();
  if (!meta.isLocal()) {
    throw new Error('not local');
  }
  lm = meta.typed() as db.LocalMeta;
  const new_local_hash = new_local.chunk.hash;
  const new_local_name = lm.mutatorName();
  const new_local_args = utf8.decode(lm.mutatorArgsJSON());
  try {
    result = await openTransactionImpl(
      store,
      txns,
      new_local_name,
      new_local_args,
      {
        basis: sync_chain[0].chunk.hash,
        original: new_local_hash,
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
  const otr = await openTransactionImpl(
    store,
    txns,
    original_name,
    original_args,
    {
      basis: sync_chain[0].chunk.hash,
      original: original_hash,
    },
  );
  const ctr = await commitImpl(txns, otr, false);

  await store.withWrite(async dagWrite => {
    const sync_head_hash = await dagWrite.read().getHead(sync.SYNC_HEAD_NAME);
    expect(ctr.ref).to.equal(sync_head_hash);
  });
});
