import {expect} from '@esm-bundle/chai';
import {TestStore} from '../dag/test-store';
import {
  addGenesis,
  addIndexChange,
  addLocal,
  addSnapshot,
  Chain,
} from '../db/test-helpers';
import {slurp} from './slurp';

suite('slurp', () => {
  const chain: Chain = [];
  const srcStore = new TestStore();
  const dstStore = new TestStore(undefined, () =>
    expect.fail('should not compute hash on dst'),
  );
  setup(async () => {
    srcStore.kvStore.clear();
    dstStore.kvStore.clear();
    chain.length = 0;
    await addGenesis(chain, srcStore);
  });

  teardown(async () => {
    const {hash} = chain[chain.length - 1].chunk;

    await slurp(hash, dstStore, srcStore);

    expect(srcStore.kvStore.snapshot()).to.deep.equal(
      dstStore.kvStore.snapshot(),
    );

    expect(srcStore.chunks()).to.deep.equal(dstStore.chunks());
  });

  test('genesis', async () => {
    // nothing here
  });

  test('snapshot', async () => {
    await addSnapshot(chain, srcStore, undefined);
  });

  test('snapshot with some entries', async () => {
    await addSnapshot(chain, srcStore, [
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ]);
  });

  test('local commit', async () => {
    await addLocal(chain, srcStore);
  });

  test('local commit * 2', async () => {
    await addLocal(chain, srcStore);
    await addLocal(chain, srcStore);
  });

  test('local commit + snapshot', async () => {
    await addLocal(chain, srcStore);
    await addSnapshot(chain, srcStore, [
      ['d', 3],
      ['e', 4],
    ]);
  });

  test('local commit + index', async () => {
    await addLocal(chain, srcStore);
    await addIndexChange(chain, srcStore);
  });

  test('local + slurp + local', async () => {
    await addLocal(chain, srcStore);
    await slurp(chain[chain.length - 1].chunk.hash, dstStore, srcStore);
    await addLocal(chain, srcStore);
  });
});
