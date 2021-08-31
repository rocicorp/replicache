import {openDB, deleteDB} from '../node_modules/idb/with-async-ittr.js';
import xbytes from '../node_modules/xbytes/dist/index.mjs';
import {randomData} from './data.js';

/**
 * @param {{dataType: import("./data").RandomDataType; group: string; valSize: number; numKeys: number;}} opts
 * @returns Benchmark
 */
export function benchmarkIDBRead(opts) {
  return {
    name: `idb read tx (${opts.dataType}) ${opts.numKeys}x${xbytes(
      opts.valSize,
      {
        fixed: 0,
        iec: true,
      },
    )}`,
    group: opts.group,
    byteSize: opts.valSize * opts.numKeys,
    async setup() {
      await deleteDB('db1');
      const db = await openDB('db1', 1, {
        upgrade(db) {
          db.createObjectStore('store1');
        },
      });
      try {
        await idbPopulate(
          db,
          randomData(opts.dataType, opts.numKeys, opts.valSize),
        );
      } finally {
        db.close();
      }
    },

    /**
     * @param {import('./perf.js').Bencher} bench
     */
    async run(bench) {
      const db = await openDB('db1');
      try {
        bench.reset();
        const tx = db.transaction('store1', 'readonly', {
          durability: 'relaxed',
        });
        const store = await tx.objectStore('store1');
        const vals = await store.getAll(IDBKeyRange.bound(0, opts.numKeys - 1));
        bench.stop();
        // Use the values to ensure they aren't optimized away.
        console.log(`Read ${vals.length} values`);
      } finally {
        db.close();
      }
    },
  };
}

/**
 *
 * @param {import('idb').IDBPDatabase} db
 * @param {(string | ArrayBuffer | Record<string, string> | Blob)[]} data
 */
async function idbPopulate(db, data) {
  const tx = db.transaction('store1', 'readwrite', {durability: 'relaxed'});
  const store = await tx.objectStore('store1');
  await Promise.all(data.map((v, i) => store.put(v, i)));
  await tx.done;
}

/**
 * @param {{dataType: import('./data').RandomDataType; group: string; valSize: number; numKeys: number;}} opts
 * @returns Benchmark
 */
export function benchmarkIDBWrite(opts) {
  return {
    name: `idb write tx (${opts.dataType}) ${opts.numKeys}x${xbytes(
      opts.valSize,
      {
        fixed: 0,
        iec: true,
      },
    )}`,
    group: opts.group,
    byteSize: opts.valSize * opts.numKeys,

    async setup() {
      await deleteDB('db1');
      const db = await openDB('db1', 1, {
        upgrade(db) {
          db.createObjectStore('store1');
        },
      });
      db.close();
    },

    /**
     * @param {import('./perf.js').Bencher} bench
     */
    async run(bench) {
      const db = await openDB('db1');
      try {
        const data = randomData(opts.dataType, opts.numKeys, opts.valSize);
        bench.reset();
        await idbPopulate(db, data);
        bench.stop();
      } finally {
        db.close();
      }
    },
  };
}
