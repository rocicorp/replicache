import {expect} from '@esm-bundle/chai';
import {Store} from '../dag/store';
import {MemStore} from '../kv/mem-store';
import {baseSnapshot} from './commit';
import {
  addGenesis as addGenesis,
  addIndexChange,
  addLocal,
  addSnapshot,
  Chain,
} from './test-helpers';

test('base snapshot', async () => {
  const memStore = new MemStore();
  const store = new Store(memStore);
  const chain: Chain = [];
  await addGenesis(chain, store);
  let genesisHash = chain[0].chunk.hash;
  await store.withRead(async dagRead => {
    expect((await baseSnapshot(genesisHash, dagRead)).chunk.hash).to.equal(
      genesisHash,
    );
  });

  await addLocal(chain, store);
  await addIndexChange(chain, store);
  await addLocal(chain, store);
  genesisHash = chain[0].chunk.hash;
  await store.withRead(async dagRead => {
    expect(
      (await baseSnapshot(chain[chain.length - 1].chunk.hash, dagRead)).chunk
        .hash,
    ).to.equal(genesisHash);
  });

  await addSnapshot(chain, store, undefined);
  const baseHash = await store.withRead(async dagRead => {
    const baseHash = await dagRead.getHead('main');
    expect(
      (await baseSnapshot(chain[chain.length - 1].chunk.hash, dagRead)).chunk
        .hash,
    ).to.equal(baseHash);
    return baseHash;
  });

  await addLocal(chain, store);
  await addLocal(chain, store);
  await store.withRead(async dagRead => {
    expect(
      (await baseSnapshot(chain[chain.length - 1].chunk.hash, dagRead)).chunk
        .hash,
    ).to.equal(baseHash);
  });
});
