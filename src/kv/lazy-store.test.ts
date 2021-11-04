import {expect} from '@esm-bundle/chai';
import {runAll} from './store-test-util';
import {MemStore} from './mem-store';
import {LazyStore} from './lazy-store';

runAll('lazystore', () => new LazyStore(new MemStore()));

test('chunk keys', async () => {
  const memStore = new MemStore();
  const lazyStore = new LazyStore(memStore);

  await lazyStore.withWrite(async write => {
    await write.put('a', 'a');
    await write.put('c/a', 'c/a');

    expect(await write.get('a')).to.equal('a');
    expect(await write.get('c/a')).to.equal('c/a');

    await write.commit();
  });

  await memStore.withRead(async read => {
    expect(await read.get('a')).to.equal('a');
    expect(await read.get('c/a')).to.equal('c/a');
  });

  await lazyStore.withRead(async read => {
    expect(await read.get('a')).to.equal('a');
    expect(await read.get('c/a')).to.equal('c/a');
  });

  await memStore.withWrite(async write => {
    await write.put('a', 'a2');
    await write.put('c/a', 'c/a2');
    await write.put('b', 'b');
    await write.put('c/b', 'c/b');
    await write.commit();
  });

  await lazyStore.withRead(async read => {
    expect(await read.get('a')).to.equal('a2');
    // The key 'c/a' is cached and not read through to the underlying store.
    expect(await read.get('c/a')).to.equal('c/a');
    expect(await read.get('b')).to.equal('b');
    expect(await read.get('c/b')).to.equal('c/b');
  });
});
