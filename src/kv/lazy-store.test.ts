import {runAll} from './store-test-util';
import {TestMemStore} from './test-mem-store';
import {LazyStore} from './lazy-store';

runAll('lazystore', () => new LazyStore(
  new TestMemStore(),
  1000,
  (_) => true
));