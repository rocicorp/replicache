import type {Commit, LocalMeta} from './db/commit';
import type {JSONValue} from './mod';
import {Replicache} from './mod';

const rep = new Replicache({
  name: 'test-unload',
  mutators: {
    addData: async (tx, data: Record<string, JSONValue>) => {
      for (const [k, v] of Object.entries(data)) {
        await tx.put(k, v);
      }
    },
  },
});

for (let i = 0; i < 100; i++) {
  await rep.mutate.addData({now: new Date().toISOString()});
  await rep.mutate.addData({a: 'long'.repeat(1000)});
  await rep.mutate.addData({b: 2});
}

const el = document.getElementById('text');
if (el) {
  const {pendingCommits} = localStorage;
  delete localStorage.pendingCommits;
  if (pendingCommits) {
    el.textContent = `// pendingCommits.length: ${
      JSON.parse(pendingCommits).length
    }\n${pendingCommits}`;
  } else {
    el.textContent = 'No pending commits';
  }
}

const allDataEl = document.getElementById('all-data');
if (allDataEl) {
  allDataEl.textContent = await rep.query(
    async tx => `keys: ${(await tx.scan().keys().toArray()).join(',')}`,
  );
}

let persistDone = false;

let data: Commit<LocalMeta>[];
window.onbeforeunload = e => {
  // This block does not finish in time...
  void (async () => {
    // Add mutations or persist does not have to touch IDB.
    await rep.mutate.addData({c: 3});

    const start = performance.now();
    // @ts-expect-error private
    await rep._persist();
    persistDone = true;
    const end = performance.now();
    console.log(`persist took: ${end - start}ms`);
  })();

  // Reading the pending commits from dag.LazyStore does not need to touch IDB
  // (unless the data does not fit in which case we are screwed).
  void (async () => {
    const start = performance.now();
    data = await rep.pendingCommits();
    const end = performance.now();
    console.log(`pendingCommits took: ${end - start}ms`);

    if (data.length > 0) {
      e.returnValue = 1;
      const s = JSON.stringify(data, null, 2);
      try {
        localStorage.pendingCommits = s;
      } catch (e) {
        // Size limit for localStorage is about 5MB.
        // https://arty.name/localstorage.html
        localStorage.pendingCommits = `localStorage quota exceeded, ${s.length}\n${e}`;
      }
    }
  })();
};

window.addEventListener('beforeunload', () => {
  console.log('persistDone', persistDone);
});
