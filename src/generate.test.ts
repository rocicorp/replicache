import {addGenesis, addIndexChange, addLocal, Chain} from './db/test-helpers';
import {MemStore} from './kv/mem-store';
import {addSyncSnapshot} from './sync/test-helpers';
import {Store} from './dag/store';
import {initHasher} from './hash';
import {toJS} from './migrate/snippet';

// This is not a real test, it is just a helper to generate the test data.

setup(async () => {
  await initHasher();
});

test.skip('gen', async () => {
  const kv = new MemStore();
  const store = new Store(kv);

  const mainChain: Chain = [];

  await addGenesis(mainChain, store);
  await addLocal(mainChain, store);
  await addSyncSnapshot(mainChain, store, 0);
  await addLocal(mainChain, store);

  // @ts-expect-error Accessing private property _map.
  const o = Object.fromEntries(kv._map.entries());
  console.log(toJS(o));
});

test.skip('gen with index', async () => {
  const kv = new MemStore();
  const store = new Store(kv);

  const mainChain: Chain = [];

  await addGenesis(mainChain, store);
  await addLocal(mainChain, store);
  await addIndexChange(mainChain, store);
  await addLocal(mainChain, store);

  // @ts-expect-error Accessing private property _map.
  const o = Object.fromEntries(kv._map.entries());
  console.log(toJS(o));
});
