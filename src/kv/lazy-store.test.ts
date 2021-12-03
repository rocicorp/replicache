import {expect} from '@esm-bundle/chai';
import {runAll} from './store-test-util';
import {TestMemStore} from './test-mem-store';
import {LazyStore} from './lazy-store';
import type {Value} from './store';

runAll(
  'lazystore everything pinned',
  () => new LazyStore(new TestMemStore(), 0, _ => true),
);

runAll(
  'lazystore everything cached (large cache limit, nothing pinned)',
  () => new LazyStore(new TestMemStore(), 10000, _ => false),
);

const DEFAULT_VALUE_SIZE = 100;
function getSizeOfValueForTest(value: Value): number {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const {size} = value as {size?: Value};
    if (typeof size === 'number') {
      return size;
    }
  }
  return DEFAULT_VALUE_SIZE;
}

function shouldBePinnedForTest(key: string): boolean {
  return key.startsWith('pinned');
}

const DEFAULT_CACHE_SIZE_LIMIT = 200;
function createLazyStoreForTest(
  options: {
    cacheSizeLimit?: number;
  } = {},
) {
  const {cacheSizeLimit = DEFAULT_CACHE_SIZE_LIMIT} = options;
  const baseStore = new TestMemStore();
  return {
    baseStore,
    lazyStore: new LazyStore(
      baseStore,
      cacheSizeLimit,
      shouldBePinnedForTest,
      getSizeOfValueForTest,
    ),
  };
}

test('put does not write through to base store', async () => {
  const {baseStore, lazyStore} = createLazyStoreForTest();
  await lazyStore.withWrite(async write => {
    await write.put('notPinned1', 'notPinned1Value');
    await write.commit();
  });
  await baseStore.withRead(async read => {
    expect(await read.get('notPinned1')).to.be.undefined;
  });
});

test('del does not write through to base store', async () => {
  const {baseStore, lazyStore} = createLazyStoreForTest();
  await baseStore.withWrite(async write => {
    await write.put('inBase1', 'inBase1Value');
    await write.put('inBase2', 'inBase2Value');
    await write.commit();
  });
  await lazyStore.withRead(async read => {
    // load one of keys into the lazy store cache
    expect(await read.get('inBase1')).to.equal('inBase1Value');
  });
  await lazyStore.withWrite(async write => {
    // delete both keys (cached and not-cached) from lazy store
    await write.del('inBase1');
    await write.del('inBase2');
    await write.commit();
  });
  await baseStore.withRead(async read => {
    // neither delete impacts baseStore
    expect(await read.get('inBase1')).to.equal('inBase1Value');
    expect(await read.get('inBase1')).to.equal('inBase1Value');
  });
});

test('values are loaded from base store and cached', async () => {
  const {baseStore, lazyStore} = createLazyStoreForTest();
  await lazyStore.withRead(async read => {
    expect(await read.get('inBase1')).to.be.undefined;
  });
  await baseStore.withWrite(async write => {
    await write.put('inBase1', 'inBase1Value');
    await write.put('inBase2', 'inBase2Value');
    await write.commit();
  });
  await lazyStore.withRead(async read => {
    expect(await read.get('inBase1')).to.equal('inBase1Value');
    expect(await read.get('inBase2')).to.equal('inBase2Value');
  });
  await baseStore.withWrite(async write => {
    await write.put('inBase1', 'inBase1V2Value');
    await write.commit();
  });
  await lazyStore.withRead(async read => {
    // value of inBase1 is from cache, instead of new 'inBase1V2Value'
    // currently in base store
    expect(await read.get('inBase1')).to.equal('inBase1Value');
    expect(await read.get('inBase2')).to.equal('inBase2Value');
  });
});

// This is not expected in intended use, as pinned keys are intended
// for keys that are not persisted to the base store.  In expected
// use a pinned key not found in the pinned cache, will never be found
// in the base store.  This test exists to document this behavior.
// This behavior should not be problematic, and would complicate the code
// structure to not try to lookup pinned keys in the base store.
test('pinned keys can be loaded from base store and are then pinned', async () => {
  const {baseStore, lazyStore} = createLazyStoreForTest();
  await lazyStore.withRead(async read => {
    expect(await read.get('pinnedInBase1')).to.be.undefined;
  });
  await baseStore.withWrite(async write => {
    await write.put('pinnedInBase1', 'pinnedInBase1Value');
    await write.put('pinnedInBase2', 'pinnedInBase2Value');
    await write.commit();
  });
  await lazyStore.withRead(async read => {
    expect(await read.get('pinnedInBase1')).to.equal('pinnedInBase1Value');
    expect(await read.get('pinnedInBase2')).to.equal('pinnedInBase2Value');
  });
  await baseStore.withWrite(async write => {
    await write.put('pinnedInBase1', 'pinnedInBase1V2Value');
    await write.commit();
  });
  await lazyStore.withRead(async read => {
    // value of pinnedInBase1 is from pinned cache, instead of new 'inBase1V2Value'
    // currently in base store
    expect(await read.get('pinnedInBase1')).to.equal('pinnedInBase1Value');
    expect(await read.get('pinnedInBase2')).to.equal('pinnedInBase2Value');
  });
});

test('values in cache from put are read before base store', async () => {
  const {baseStore, lazyStore} = createLazyStoreForTest();
  await lazyStore.withRead(async read => {
    expect(await read.get('inBase1')).to.be.undefined;
  });
  await lazyStore.withWrite(async write => {
    await write.put('inBase1', 'inCache1Value');
    await write.commit();
  });
  await baseStore.withWrite(async write => {
    await write.put('inBase1', 'inBase1Value');
    await write.put('inBase2', 'inBase2Value');
    await write.commit();
  });
  await lazyStore.withRead(async read => {
    expect(await read.get('inBase1')).to.equal('inCache1Value');
    expect(await read.get('inBase2')).to.equal('inBase2Value');
  });
});

test('values are reloaded from base store if evicted from cache', async () => {
  const {baseStore, lazyStore} = createLazyStoreForTest();
  await lazyStore.withRead(async read => {
    expect(await read.get('inBase1')).to.be.undefined;
  });
  await baseStore.withWrite(async write => {
    await write.put('inBase1', 'inBase1Value');
    await write.put('inBase2', 'inBase2Value');
    await write.commit();
  });
  await lazyStore.withRead(async read => {
    expect(await read.get('inBase1')).to.equal('inBase1Value');
    expect(await read.get('inBase2')).to.equal('inBase2Value');
  });
  await baseStore.withWrite(async write => {
    await write.put('inBase1', 'inBase1V2Value');
    await write.put('inBase2', 'inBase2V2Value');
    await write.commit();
  });
  await lazyStore.withWrite(async write => {
    expect(await write.get('inBase1')).to.equal('inBase1Value');
    expect(await write.get('inBase2')).to.equal('inBase2Value');
    await write.put('notPinned1', 'notPinned1Value');
    await write.put('notPinned2', 'notPinned2Value');
    await write.put('notPinned3', 'notPinned3Value');
    // inBase1 and inBase2 evicted by above write of notPinned[1-2]
    await write.commit();
  });
  await lazyStore.withRead(async read => {
    // new values loaded from base store
    expect(await read.get('inBase1')).to.equal('inBase1V2Value');
    expect(await read.get('inBase2')).to.equal('inBase2V2Value');
  });
});

test('values are reloaded from base store if deleted from cache', async () => {
  const {baseStore, lazyStore} = createLazyStoreForTest();
  await lazyStore.withRead(async read => {
    expect(await read.get('inBase1')).to.be.undefined;
  });
  await baseStore.withWrite(async write => {
    await write.put('inBase1', 'inBase1Value');
    await write.put('inBase2', 'inBase2Value');
    await write.commit();
  });
  await lazyStore.withRead(async read => {
    expect(await read.get('inBase1')).to.equal('inBase1Value');
    expect(await read.get('inBase2')).to.equal('inBase2Value');
  });
  await baseStore.withWrite(async write => {
    await write.put('inBase1', 'inBase1V2Value');
    await write.put('inBase2', 'inBase2V2Value');
    await write.commit();
  });
  await lazyStore.withWrite(async write => {
    expect(await write.get('inBase1')).to.equal('inBase1Value');
    expect(await write.get('inBase2')).to.equal('inBase2Value');
    await write.del('inBase1');
    await write.del('inBase2');
    await write.commit();
  });
  await lazyStore.withRead(async read => {
    // new values loaded from base store
    expect(await read.get('inBase1')).to.equal('inBase1V2Value');
    expect(await read.get('inBase2')).to.equal('inBase2V2Value');
  });
});

test('put replaces cached values in cache from base store', async () => {
  const {baseStore, lazyStore} = createLazyStoreForTest();
  await baseStore.withWrite(async write => {
    await write.put('inBase1', 'inBase1Value');
    await write.put('inBase2', 'inBase2Value');
    await write.commit();
  });
  await lazyStore.withWrite(async write => {
    expect(await write.get('inBase1')).to.equal('inBase1Value');
    expect(await write.get('inBase2')).to.equal('inBase2Value');
    await write.put('inBase1', 'inCache1Value');
    await write.commit();
  });
  await lazyStore.withRead(async read => {
    // new values loaded from base store
    expect(await read.get('inBase1')).to.equal('inCache1Value');
    expect(await read.get('inBase2')).to.equal('inBase2Value');
  });
});

test('cache evicts in lru fashion, basic test of just reads', async () => {
  const {baseStore, lazyStore} = createLazyStoreForTest();
  await baseStore.withWrite(async write => {
    await write.put('inBase1', 'inBase1Value');
    await write.put('inBase2', 'inBase2Value');
    await write.put('inBase3', 'inBase3Value');
    await write.commit();
  });

  await lazyStore.withRead(async read => {
    expect(await read.get('inBase1')).to.equal('inBase1Value');
    expect(await read.get('inBase2')).to.equal('inBase2Value');
    // evicts inBase1
    expect(await read.get('inBase3')).to.equal('inBase3Value');
  });

  await baseStore.withWrite(async write => {
    await write.del('inBase1');
    await write.del('inBase2');
    await write.del('inBase3');
    await write.commit();
  });

  await lazyStore.withRead(async read => {
    // evicted (and no longer in base store)
    expect(await read.get('inBase1')).to.be.undefined;
    expect(await read.get('inBase2')).to.equal('inBase2Value');
    expect(await read.get('inBase3')).to.equal('inBase3Value');
  });
});

test('cache evicts in lru fashion, slightly more complex test with repeats of just reads', async () => {
  const {baseStore, lazyStore} = createLazyStoreForTest();
  await baseStore.withWrite(async write => {
    await write.put('inBase1', 'inBase1Value');
    await write.put('inBase2', 'inBase2Value');
    await write.put('inBase3', 'inBase3Value');
    await write.commit();
  });

  await lazyStore.withRead(async read => {
    expect(await read.get('inBase1')).to.equal('inBase1Value');
    expect(await read.get('inBase2')).to.equal('inBase2Value');
    expect(await read.get('inBase1')).to.equal('inBase1Value');
    // evicts inBase2
    expect(await read.get('inBase3')).to.equal('inBase3Value');
  });

  await baseStore.withWrite(async write => {
    await write.del('inBase1');
    await write.del('inBase2');
    await write.del('inBase3');
    await write.commit();
  });

  await lazyStore.withRead(async read => {
    // evicted (and no longer in base store)
    expect(await read.get('inBase2')).to.be.undefined;
    expect(await read.get('inBase1')).to.equal('inBase1Value');
    expect(await read.get('inBase3')).to.equal('inBase3Value');
  });
});

test('cache evicts in lru fashion, more advanced tests with reads and writes', async () => {
  const {baseStore, lazyStore} = createLazyStoreForTest({cacheSizeLimit: 300});
  await baseStore.withWrite(async write => {
    await write.put('inBase1', 'inBase1Value');
    await write.put('inBase2', 'inBase2Value');
    await write.put('inBase3', 'inBase3Value');
    await write.commit();
  });

  await lazyStore.withWrite(async write => {
    expect(await write.get('inBase1')).to.equal('inBase1Value');
    expect(await write.get('inBase2')).to.equal('inBase2Value');
    expect(await write.get('inBase3')).to.equal('inBase3Value');
    await write.put('notPinned1', 'notPinned1Value');
    await write.put('notPinned2', 'notPinned2Value');
    expect(await write.get('inBase1')).to.equal('inBase1Value');
    await write.commit();
  });

  await baseStore.withWrite(async write => {
    await write.del('inBase1');
    await write.del('inBase2');
    await write.del('inBase3');
    await write.commit();
  });

  await lazyStore.withRead(async read => {
    expect(await read.get('inBase1')).to.equal('inBase1Value');
    expect(await read.get('inBase2')).to.be.undefined;
    expect(await read.get('inBase3')).to.be.undefined;
    expect(await read.get('notPinned1')).to.equal('notPinned1Value');
    expect(await read.get('notPinned2')).to.equal('notPinned2Value');
  });

  await lazyStore.withWrite(async write => {
    await write.put('notPinned1', 'notPinned1V2Value');
    await write.put('notPinned2', 'notPinned2V2Value');
    await write.put('notPinned3', 'notPinned3V2Value');
    await write.commit();
  });

  await lazyStore.withWrite(async write => {
    await write.put('notPinned1', 'notPinned1V3Value');
    await write.commit();
  });

  await lazyStore.withRead(async read => {
    expect(await read.get('inBase1')).to.be.undefined;
    expect(await read.get('inBase2')).to.be.undefined;
    expect(await read.get('inBase3')).to.be.undefined;
  });

  await baseStore.withWrite(async write => {
    await write.put('inBase1', 'inBase1V2Value');
    await write.put('inBase2', 'inBase2V2Value');
    await write.put('inBase3', 'inBase3V2Value');
    await write.commit();
  });

  await lazyStore.withRead(async read => {
    expect(await read.get('inBase1')).to.equal('inBase1V2Value');
    expect(await read.get('inBase2')).to.equal('inBase2V2Value');
    expect(await read.get('notPinned1')).to.equal('notPinned1V3Value');
    expect(await read.get('notPinned2')).to.be.undefined;
    expect(await read.get('notPinned3')).to.be.undefined;
    expect(await read.get('inBase3')).to.equal('inBase3V2Value');
    expect(await read.get('notPinned1')).to.equal('notPinned1V3Value');
    expect(await read.get('inBase1')).to.equal('inBase1V2Value');
    expect(await read.get('inBase2')).to.equal('inBase2V2Value');
    expect(await read.get('inBase3')).to.equal('inBase3V2Value');
    expect(await read.get('notPinned1')).to.be.undefined;
  });
});

test('cache will evict multiple values to make room for new value', async () => {
  const {baseStore, lazyStore} = createLazyStoreForTest({cacheSizeLimit: 300});
  await baseStore.withWrite(async write => {
    await write.put('inBase1', 'inBase1Value');
    await write.put('inBase2', 'inBase2Value');
    await write.put('inBase3', 'inBase3Value');
    await write.put('inBase4', {name: 'inBase4Value', size: 200});
    await write.commit();
  });

  await lazyStore.withRead(async read => {
    expect(await read.get('inBase1')).to.equal('inBase1Value');
    expect(await read.get('inBase2')).to.equal('inBase2Value');
    expect(await read.get('inBase3')).to.equal('inBase3Value');
    // evicts inBase1 and inBase2 as its size is 200
    expect(await read.get('inBase4')).to.deep.equal({
      name: 'inBase4Value',
      size: 200,
    });
  });

  await baseStore.withWrite(async write => {
    await write.del('inBase1');
    await write.del('inBase2');
    await write.del('inBase3');
    await write.del('inBase4');
    await write.commit();
  });

  await lazyStore.withRead(async read => {
    // inBase1 and inBase2 are evicted (and no longer in base store)
    expect(await read.get('inBase1')).to.be.undefined;
    expect(await read.get('inBase2')).to.be.undefined;
    expect(await read.get('inBase3')).to.equal('inBase3Value');
    expect(await read.get('inBase4')).to.deep.equal({
      name: 'inBase4Value',
      size: 200,
    });
  });
});

test('cache will evict multiple values to make room for new value', async () => {
  const {baseStore, lazyStore} = createLazyStoreForTest({cacheSizeLimit: 300});
  await baseStore.withWrite(async write => {
    await write.put('inBase1', 'inBase1Value');
    await write.put('inBase2', 'inBase2Value');
    await write.put('inBase3', 'inBase3Value');
    await write.put('inBase4', {name: 'inBase4Value', size: 250});
    await write.commit();
  });

  await lazyStore.withRead(async read => {
    expect(await read.get('inBase1')).to.equal('inBase1Value');
    expect(await read.get('inBase2')).to.equal('inBase2Value');
    expect(await read.get('inBase3')).to.equal('inBase3Value');
    // evicts inBase1, inBase2 and inBase3 as its size is 250
    expect(await read.get('inBase4')).to.deep.equal({
      name: 'inBase4Value',
      size: 250,
    });
  });

  await baseStore.withWrite(async write => {
    await write.del('inBase1');
    await write.del('inBase2');
    await write.del('inBase3');
    await write.del('inBase4');
    await write.commit();
  });

  await lazyStore.withRead(async read => {
    // inBase1, inBase2 and inBase3 are evicted (and no longer in base store)
    expect(await read.get('inBase1')).to.be.undefined;
    expect(await read.get('inBase2')).to.be.undefined;
    expect(await read.get('inBase3')).to.be.undefined;
    expect(await read.get('inBase4')).to.deep.equal({
      name: 'inBase4Value',
      size: 250,
    });
  });
});

test('cache does not cache items with size greater than cacheSizeLimit, and does not evict other values to try to make room', async () => {
  const {baseStore, lazyStore} = createLazyStoreForTest({cacheSizeLimit: 300});
  await baseStore.withWrite(async write => {
    await write.put('inBase1', 'inBase1Value');
    await write.put('inBase2', 'inBase2Value');
    await write.put('inBase3', 'inBase3Value');
    await write.put('inBase4', {name: 'inBase4Value', size: 400});
    await write.commit();
  });

  await lazyStore.withRead(async read => {
    expect(await read.get('inBase1')).to.equal('inBase1Value');
    expect(await read.get('inBase2')).to.equal('inBase2Value');
    expect(await read.get('inBase3')).to.equal('inBase3Value');
    // is not cached because its size exceeds cache size limit
    // other values are not evicted
    expect(await read.get('inBase4')).to.deep.equal({
      name: 'inBase4Value',
      size: 400,
    });
  });

  await baseStore.withWrite(async write => {
    await write.del('inBase1');
    await write.del('inBase2');
    await write.del('inBase3');
    await write.del('inBase4');
    await write.commit();
  });

  await lazyStore.withRead(async read => {
    expect(await read.get('inBase1')).to.equal('inBase1Value');
    expect(await read.get('inBase2')).to.equal('inBase2Value');
    expect(await read.get('inBase3')).to.equal('inBase3Value');
    expect(await read.get('inBase4')).to.be.undefined;
  });
});

test('cache is not updated and evictions do not happen until commit', async () => {
  const {lazyStore} = createLazyStoreForTest();
  await lazyStore.withWrite(async write => {
    await write.put('notPinned1', 'notPinned1Value');
    await write.put('notPinned2', 'notPinned2Value');
    await write.commit();
  });

  await lazyStore.withWrite(async write => {
    await write.put('notPinned3', 'notPinned3Value');
    await write.put('notPinned4', 'notPinned4Value');
    // not evicted yet because we haven't committed
    expect(await write.get('notPinned1')).to.equal('notPinned1Value');
    expect(await write.get('notPinned2')).to.equal('notPinned2Value');
    // no commit
  });

  await lazyStore.withWrite(async write => {
    // not evict because notPinned3 and notPinned4 where not committed
    expect(await write.get('notPinned1')).to.equal('notPinned1Value');
    expect(await write.get('notPinned2')).to.equal('notPinned2Value');
    expect(await write.get('notPinned3')).to.be.undefined;
    expect(await write.get('notPinned4')).to.be.undefined;

    await write.put('notPinned5', 'notPinned5Value');
    await write.put('notPinned6', 'notPinned6Value');
    // evicts notPinned1 and notPinned2
    await write.commit();
  });

  await lazyStore.withRead(async read => {
    expect(await read.get('notPinned1')).to.be.undefined;
    expect(await read.get('notPinned2')).to.be.undefined;
    expect(await read.get('notPinned3')).to.be.undefined;
    expect(await read.get('notPinned4')).to.be.undefined;
    expect(await read.get('notPinned5')).to.equal('notPinned5Value');
    expect(await read.get('notPinned6')).to.equal('notPinned6Value');
  });
});

test('cache is updated correctly on delete (including size tracking)', async () => {
  const {lazyStore} = createLazyStoreForTest({cacheSizeLimit: 200});
  await lazyStore.withWrite(async write => {
    await write.put('notPinned1', 'notPinned1Value');
    await write.put('notPinned2', 'notPinned2Value');
    await write.commit();
  });
  await lazyStore.withWrite(async write => {
    expect(await write.get('notPinned1')).to.equal('notPinned1Value');
    expect(await write.get('notPinned2')).to.equal('notPinned2Value');
    await write.del('notPinned2');
    await write.put('notPinned3', 'notPinned3Value');
    await write.commit();
  });
  await lazyStore.withWrite(async write => {
    // not evicted because delete of notPinned2 made room
    expect(await write.get('notPinned1')).to.equal('notPinned1Value');
    // deleted
    expect(await write.get('notPinned2')).to.be.undefined;
    expect(await write.get('notPinned3')).to.equal('notPinned3Value');
    // should evict notPinned1
    await write.put('notPinned4', 'notPinned4Value');
    await write.commit();
  });
  await lazyStore.withRead(async read => {
    // evicted by put of notPinned4
    expect(await read.get('notPinned1')).to.be.undefined;
    // deleted
    expect(await read.get('notPinned2')).to.be.undefined;
    expect(await read.get('notPinned3')).to.equal('notPinned3Value');
    expect(await read.get('notPinned4')).to.equal('notPinned4Value');
  });
});

test('cache is updated correctly on set of already cached key (including size tracking)', async () => {
  const {lazyStore} = createLazyStoreForTest({cacheSizeLimit: 300});
  await lazyStore.withWrite(async write => {
    await write.put('notPinned1', 'notPinned1Value');
    await write.put('notPinned2', 'notPinned2Value');
    await write.put('notPinned3', 'notPinned3Value');
    await write.put('notPinned4', 'notPinned4Value');
    await write.commit();
  });
  await lazyStore.withWrite(async write => {
    await write.put('notPinned1', {name: 'notPinned1V2Value', size: 200});
    await write.commit();
  });
  await lazyStore.withRead(async read => {
    expect(await read.get('notPinned1')).to.deep.equal({
      name: 'notPinned1V2Value',
      size: 200,
    });
    expect(await read.get('notPinned2')).to.be.undefined;
    expect(await read.get('notPinned3')).to.be.undefined;
    expect(await read.get('notPinned4')).to.equal('notPinned4Value');
  });
});

test('pinned keys are never evicted even if cache size is exceeded', async () => {
  const {lazyStore} = createLazyStoreForTest();
  await lazyStore.withWrite(async write => {
    await write.put('pinned1', 'pinned1Value');
    await write.put('pinned2', 'pinned2Value');
    await write.put('notPinned1', 'notPinned1Value');
    await write.put('notPinned2', 'notPinned2Value');
    await write.commit();
  });
  await lazyStore.withWrite(async write => {
    await write.put('notPinned3', 'pinned3Value');
    // over cache size limit, should evict notPinned1, but not any pinned keys
    await write.commit();
  });
  await lazyStore.withWrite(async write => {
    // pinned values are still cached
    expect(await write.get('pinned1')).to.equal('pinned1Value');
    expect(await write.get('pinned2')).to.equal('pinned2Value');

    // despite being at cache size limit, more pinned values can be added
    // and old  and new are all still cached
    await write.put('pinned3', 'pinned3Value');
    await write.commit();
  });
});

test('pinned keys are not counted towards cache size', async () => {
  const {lazyStore} = createLazyStoreForTest();
  await lazyStore.withWrite(async write => {
    await write.put('pinned1', 'pinned1Value');
    await write.put('pinned2', 'pinned2Value');
    // both notPinned1 and notPinned2 are cached because pinned1 and pinned2
    // are not counted towards the cache size.
    await write.put('notPinned1', 'notPinned1Value');
    await write.put('notPinned2', 'notPinned2Value');
    await write.commit();
  });
  await lazyStore.withRead(async read => {
    expect(await read.get('notPinned1')).to.equal('notPinned1Value');
    expect(await read.get('notPinned2')).to.equal('notPinned2Value');
  });
});
