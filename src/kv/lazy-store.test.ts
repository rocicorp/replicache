import {runAll} from './store-test-util';
import {TestMemStore} from './test-mem-store';
import {LazyStore} from './lazy-store';

runAll('lazystore', () => new LazyStore(new TestMemStore(), 1000, _ => true));


// test reading and writing (and deleting) of pinned keys

// test that pinned keys are never evicited even if cacheSize is exceeded

// test lazy loading of values from underlying (with get and has)

// test once lazy loaded value are read from cache not underlying store (with get and has) (maybe with spy) 

// test write updates cache

// test delete updates cache

// test cache eviction
   // test happens on set and respects LRU
   // test one item being evicted
   // test multiple items getting evicted to fit one new
   // test all items being evicted to fit sincle new item
   // test all items including new item getting evicted due to new item being over cache size limit
   // test set updates size correctly when an item is replaced
   // test delete updates size correctly