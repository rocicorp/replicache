import {assertNotUndefined} from '../asserts';
import type * as dag from '../dag/mod';
import * as db from '../db/mod';
import {assertEntries} from '../prolly/mod';
import * as sync from '../sync/mod';
import type {LogContext} from '../logger';
import {BTreeWrite} from '../btree/mod';
import type {IndexRecord} from '../db/commit';
import {MetaTyped} from '../db/meta-typed';
import type {Hash} from '../hash';
import {setCurrentVersion} from './migrate-0-to-1';

type OldHash = Hash;
type NewHash = Hash;
type PendingMap = Map<OldHash, NewHash>;

export async function migrateHead(
  name: string,
  dagWrite: dag.Write,
  pending: PendingMap,
): Promise<void> {
  const hash = await dagWrite.getHead(name);
  if (hash !== undefined) {
    // Follow the ref.
    await migrateCommit(hash, dagWrite, pending);
  }
}

export function migrateWeakCommit(
  hash: Hash,
  dagWrite: dag.Write,
  pending: PendingMap,
): Promise<Hash> {
  return migrateMaybeWeakCommit(hash, dagWrite, pending, true);
}

export async function migrateCommit(
  hash: Hash,
  dagWrite: dag.Write,
  pending: PendingMap,
): Promise<Hash> {
  return migrateMaybeWeakCommit(hash, dagWrite, pending, false);
}

export async function migrateMaybeWeakCommit(
  oldHash: Hash,
  dagWrite: dag.Write,
  pending: PendingMap,
  allowHashToBeWeak: boolean,
): Promise<Hash> {
  const h = pending.get(oldHash);
  if (h) {
    return h;
  }

  const chunk = await dagWrite.getChunk(oldHash);

  // A weak hash means that the ref does not keep it alive which allows the
  // chunk to be missing.
  if (chunk === undefined && allowHashToBeWeak) {
    return oldHash;
  }
  assertNotUndefined(chunk);

  const commit = db.fromChunk(chunk);

  const valueHashP = migrateProllyMap(commit.valueHash, dagWrite, pending);
  let basisHashP: Promise<Hash> | null = null;
  // basisHash is weak for Snapshot Commits
  if (commit.meta.basisHash) {
    basisHashP = migrateWeakCommit(commit.meta.basisHash, dagWrite, pending);
  }

  let originalHashP: Promise<Hash> | null = null;
  // originalHash is weak for Local Commits
  if (commit.isLocal() && commit.meta.originalHash) {
    originalHashP = migrateWeakCommit(
      commit.meta.originalHash,
      dagWrite,
      pending,
    );
  }

  const indexes: IndexRecord[] = await Promise.all(
    commit.indexes.map(async index => {
      const valueHash = await migrateProllyMap(
        index.valueHash,
        dagWrite,
        pending,
      );
      return {definition: index.definition, valueHash};
    }),
  );

  const valueHash = await valueHashP;
  const basisHash = basisHashP && (await basisHashP);
  const originalHash = originalHashP && (await originalHashP);

  let newCommit: db.Commit;
  switch (commit.meta.type) {
    case MetaTyped.IndexChange:
      newCommit = db.newIndexChange(
        basisHash,
        commit.meta.lastMutationID,
        valueHash,
        indexes,
      );
      break;
    case MetaTyped.Snapshot:
      newCommit = db.newSnapshot(
        basisHash,
        commit.meta.lastMutationID,
        commit.meta.cookieJSON,
        valueHash,
        indexes,
      );
      break;
    case MetaTyped.Local:
      newCommit = db.newLocal(
        basisHash,
        commit.meta.mutationID,
        commit.meta.mutatorName,
        commit.meta.mutatorArgsJSON,
        originalHash,
        valueHash,
        indexes,
      );
      break;
  }

  await dagWrite.putChunk(newCommit.chunk);

  const newHash = newCommit.chunk.hash;
  pending.set(oldHash, newHash);
  return newHash;
}

export async function migrateProllyMap(
  oldHash: Hash,
  dagWrite: dag.Write,
  pending: PendingMap,
): Promise<Hash> {
  // In v1 we used prolly.Map to store the map.
  // In v2 we use btree.InternalNode | btree.DataNode

  const h = pending.get(oldHash);
  if (h) {
    return h;
  }

  const prollyChunk = await dagWrite.getChunk(oldHash);
  assertNotUndefined(prollyChunk);
  const {data} = prollyChunk;
  assertEntries(data);

  const btree = new BTreeWrite(dagWrite);
  for (const [k, v] of data) {
    await btree.put(k, v);
  }

  const newHash = await btree.flush();
  pending.set(oldHash, newHash);
  return newHash;
}

/**
 * Migrates the whole Dag store from version 1 (Prolly Map) to version 2
 * (B+Tree).
 *
 * This migrates the hashes since the B+Tree uses hashes to reference the B+Tree
 * nodes and we rely on GC to remove old chunks.
 *
 * Our data model does not allow listing the heads so this only migrates the
 * known heads; `db.DEFAULT_HEAD_NAME` and `sync.SYNC_HEAD_NAME`.
 */
export async function migrate1to2(
  dagWrite: dag.Write,
  lc: LogContext,
): Promise<void> {
  lc.debug?.(`migrating from version 1 to version 2`);
  // We pass in a pending map to only handle each hash once. Some chunks are
  // referenced more than once so this prevents us from trying to migrate the
  // same chunk twice. The map is from old hash to new hash.
  const pending: PendingMap = new Map();
  await Promise.all([
    migrateHead(db.DEFAULT_HEAD_NAME, dagWrite, pending),
    migrateHead(sync.SYNC_HEAD_NAME, dagWrite, pending),
    setCurrentVersion(2, dagWrite.kvWrite),
  ]);
}
