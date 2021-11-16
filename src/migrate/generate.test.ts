import {addGenesis, addIndexChange, addLocal, Chain} from '../db/test-helpers';
import {addSyncSnapshot} from '../sync/test-helpers';
import * as dag from '../dag/mod';
import {initHasher} from '../hash';
import {toJS} from './snippet';
import {TestMemStore} from '../kv/test-mem-store';

// This is not a real test, it is just a helper to generate the test data.

setup(async () => {
  await initHasher();
});

test.skip('generate', async () => {
  const kv = new TestMemStore();
  const store = new dag.TestStore(kv);

  const mainChain: Chain = [];

  await addGenesis(mainChain, store);
  await addLocal(mainChain, store);
  await addSyncSnapshot(mainChain, store, 0);
  await addLocal(mainChain, store);

  const o = Object.fromEntries(kv.entries());
  console.log(toJS(o));
});

test.skip('gen with index', async () => {
  const kv = new TestMemStore();
  const store = new dag.TestStore(kv);

  const mainChain: Chain = [];

  await addGenesis(mainChain, store);
  await addLocal(mainChain, store);
  await addIndexChange(mainChain, store);
  await addLocal(mainChain, store);

  const o = Object.fromEntries(kv.entries());
  console.log(toJS(o));
});
