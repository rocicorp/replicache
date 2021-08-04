import {runAll} from './store-test-util.js';
import {IDBStore} from './idb-store.js';

let c = 0;

runAll('idbstore', async () => {
  const name = `test-idbstore-${c++}`;
  await deletaDatabase(name);
  return new IDBStore(name);
});

function deletaDatabase(name: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = e => reject(e);
  });
}
