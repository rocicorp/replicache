import {expect} from '@esm-bundle/chai';
import type {Chain} from '../db/test-helpers';
import type * as dag from '../dag/mod';
import * as db from '../db/mod';
import * as sync from '../sync/mod';
import type {SnapshotMeta} from '../db/commit';

// See db.test_helpers for addLocal, addSnapshot, etc. We can't put addLocalRebase
// there because sync depends on db, and addLocalRebase depends on sync.

// addSyncSnapshot adds a sync snapshot off of the main chain's base snapshot and
// returns it (in chain order). Caller needs to supply which commit to take indexes
// from because it is context dependent (they should come from the parent of the
// first commit to rebase, or from head if no commits will be rebased).

export async function addSyncSnapshot(
  chain: Chain,
  store: dag.Store,
  takeIndexesFrom: number,
): Promise<Chain> {
  expect(chain.length >= 2).to.be.true;

  let maybeBaseSnapshot: db.Commit<SnapshotMeta> | undefined;
  for (let i = chain.length - 1; i > 0; i--) {
    const commit = chain[i - 1];
    if (commit.isSnapshot()) {
      maybeBaseSnapshot = commit;
      break;
    }
  }
  if (maybeBaseSnapshot === undefined) {
    throw new Error('main chain doesnt have a snapshot or local commit');
  }
  const baseSnapshot = maybeBaseSnapshot;
  const syncChain: Chain = [];

  // Add sync snapshot.
  const cookie = `sync_cookie_${chain.length}`;
  const indexes = db.readIndexesForWrite(chain[takeIndexesFrom]);
  await store.withWrite(async dagWrite => {
    const w = await db.Write.newSnapshot(
      db.whenceHash(baseSnapshot.chunk.hash),
      baseSnapshot.mutationID,
      cookie,
      dagWrite,
      indexes,
    );
    await w.commit(sync.SYNC_HEAD_NAME);
  });
  const [, commit] = await store.withRead(async dagRead => {
    return await db.readCommit(db.whenceHead(sync.SYNC_HEAD_NAME), dagRead);
  });
  syncChain.push(commit);

  return syncChain;
}
