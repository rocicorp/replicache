import {runAll} from './store-test-util.js';
import {MemStore} from './mem-store.js';

test('memstore', async () => {
  await runAll(() => new MemStore());
});
