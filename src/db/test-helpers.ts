import type {Store as DagStore} from '../dag/store';
import {Commit, DEFAULT_HEAD_NAME} from './commit';
import {expect} from '@esm-bundle/chai';
import {readCommit, readIndexes, whenceHead} from './read';
import {stringToUint8Array} from './util';
import {initDB, Write} from './write';

export type Chain = Commit[];

export async function addGenesis(
  chain: Chain,
  store: DagStore,
): Promise<Chain> {
  expect(chain).to.have.length(0);
  const commit = await createGenesis(store);
  chain.push(commit);
  return chain;
}

export async function createGenesis(store: DagStore): Promise<Commit> {
  debugger;
  await store.withWrite(async w => {
    await initDB(w, DEFAULT_HEAD_NAME);
  });
  return await store.withRead(async read => {
    const [, commit] = await readCommit(whenceHead(DEFAULT_HEAD_NAME), read);
    return commit;
  });
}

// Local commit has mutator name and args according to its index in the
// chain.
export async function addLocal(chain: Chain, store: DagStore): Promise<Chain> {
  expect(chain).to.have.length.greaterThan(0);
  const i = chain.length;
  const commit = await createLocal(
    [[stringToUint8Array('local'), stringToUint8Array(i.toString())]],
    store,
    i,
  );

  chain.push(commit);
  return chain;
}

export async function createLocal(
  entries: [Uint8Array, Uint8Array][],
  store: DagStore,
  i: number,
): Promise<Commit> {
  await store.withWrite(async dagWrite => {
    const w = await Write.newLocal(
      whenceHead(DEFAULT_HEAD_NAME),
      `mutator_name_${i}`,
      JSON.stringify([i]),
      undefined,
      dagWrite,
    );
    for (const [key, val] of entries) {
      await w.put(key, val);
    }
    await w.commit(DEFAULT_HEAD_NAME);
  });
  return await store.withRead(async dagRead => {
    const [, commit] = await readCommit(whenceHead(DEFAULT_HEAD_NAME), dagRead);
    return commit;
  });
}

export async function addIndexChange(
  chain: Chain,
  store: DagStore,
): Promise<Chain> {
  expect(chain).to.have.length.greaterThan(0);
  const i = chain.length;
  const commit = await createIndex(i + '', 'local', '', store);
  chain.push(commit);
  return chain;
}

export async function createIndex(
  name: string,
  prefix: string,
  jsonPointer: string,
  store: DagStore,
): Promise<Commit> {
  await store.withWrite(async dagWrite => {
    const w = await Write.newIndexChange(
      whenceHead(DEFAULT_HEAD_NAME),
      dagWrite,
    );
    await w.createIndex(name, stringToUint8Array(prefix), jsonPointer);
    await w.commit(DEFAULT_HEAD_NAME);
  });
  return store.withRead(async dagRead => {
    const [, commit] = await readCommit(whenceHead(DEFAULT_HEAD_NAME), dagRead);
    return commit;
  });
}

// See also sync.test_helpers for add_sync_snapshot, which can't go here because
// it depends on details of sync and sync depends on db.

// The optional map for the commit is treated as key, value pairs.
export async function addSnapshot(
  chain: Chain,
  store: DagStore,
  map: [string, string][] | undefined,
): Promise<Chain> {
  expect(chain).to.have.length.greaterThan(0);
  const cookie = `cookie_${chain.length}`;
  await store.withWrite(async dagWrite => {
    const w = await Write.newSnapshot(
      whenceHead(DEFAULT_HEAD_NAME),
      chain[chain.length - 1].nextMutationID(),
      cookie,
      dagWrite,
      readIndexes(chain[chain.length - 1]),
    );

    if (map) {
      for (const [k, v] of map) {
        await w.put(stringToUint8Array(k), stringToUint8Array(v));
      }
    }
    await w.commit(DEFAULT_HEAD_NAME);
  });
  return store.withRead(async dagRead => {
    const [, commit] = await readCommit(whenceHead(DEFAULT_HEAD_NAME), dagRead);
    chain.push(commit);
    return chain;
  });
}
