import {assertNumber, assertUint8Array} from '../asserts';
import * as dag from '../dag/mod';
import * as prolly from '../prolly/mod';
import type * as kv from '../kv/mod';
import * as db from '../db/mod';
import * as sync from '../sync/mod';
import * as utf8 from '../utf8';
import type {LogContext} from '../logger';
import {Hash, parse} from '../hash';
import {ChunkType} from '../dag/chunk-type';

const VERSION_KEY = 'sys/storage-format-version';

export async function currentVersion(read: kv.Read): Promise<number> {
  const v = await read.get(VERSION_KEY);
  if (v === undefined) {
    return 0;
  }
  assertNumber(v);
  return v;
}

export async function setCurrentVersion(
  version: number,
  write: kv.Write,
): Promise<void> {
  return write.put(VERSION_KEY, version);
}

export async function migrateClientID(write: kv.Write): Promise<void> {
  const v = await write.get(sync.CID_KEY);
  if (v === undefined) {
    return;
  }
  assertUint8Array(v);
  const clientID = utf8.decode(v);
  await write.put(sync.CID_KEY, clientID);
}

export async function migrateHead(
  name: string,
  write: kv.Write,
  pending: Set<string>,
): Promise<void> {
  const hash = await migrateHeadKeyValue(name, write, pending);
  if (hash !== undefined) {
    // Follow the ref.
    await migrateCommit(hash, write, pending);
  }
}

export async function migrateHeadKeyValue(
  name: string,
  write: kv.Write,
  pending: Set<string>,
): Promise<Hash | undefined> {
  const key = dag.headKey(name);
  if (pending.has(key)) {
    return undefined;
  }
  pending.add(key);

  const v = await write.get(key);
  if (v === undefined) {
    return undefined;
  }

  assertUint8Array(v);
  const ref = parse(utf8.decode(v));
  await write.put(key, ref);
  return ref;
}

export function migrateWeakCommit(
  hash: Hash,
  write: kv.Write,
  pending: Set<string>,
): Promise<void> {
  return migrateMaybeWeakCommit(hash, write, pending, true);
}

export async function migrateCommit(
  hash: Hash,
  write: kv.Write,
  pending: Set<string>,
): Promise<void> {
  return migrateMaybeWeakCommit(hash, write, pending, false);
}

export async function migrateMaybeWeakCommit(
  hash: Hash,
  write: kv.Write,
  pending: Set<string>,
  allowHashToBeWeak: boolean,
): Promise<void> {
  const key = dag.chunkDataKey(hash);
  if (pending.has(key)) {
    return;
  }
  pending.add(key);

  const buf = await write.get(dag.chunkDataKey(hash));
  // A weak hash means that the ref does not keeo it alive which allows the
  // chunk to be missing.
  if (buf === undefined && allowHashToBeWeak) {
    return;
  }
  assertUint8Array(buf);

  const ps: Promise<unknown>[] = [];

  ps.push(
    migrateMetaKeyValue(hash, write, pending),
    migrateRefCountKeyValue(hash, write, pending),
  );

  const commitData = db.commitDataFromFlatbuffer(buf);
  const commit = new db.Commit(dag.Chunk.new(ChunkType.Commit, commitData));

  ps.push(migrateProllyMap(commit.valueHash, write, pending));
  // basisHash is weak for Snapshot Commits
  if (commit.meta.basisHash) {
    ps.push(migrateWeakCommit(commit.meta.basisHash, write, pending));
  }

  // originalHash is weak for Local Commits
  if (commit.isLocal() && commit.meta.originalHash) {
    ps.push(migrateWeakCommit(commit.meta.originalHash, write, pending));
  }

  for (const index of commit.indexes) {
    ps.push(migrateProllyMap(index.valueHash, write, pending));
  }

  ps.push(write.put(key, commitData));

  await Promise.all(ps);
}

export async function migrateMetaKeyValue(
  hash: Hash,
  write: kv.Write,
  pending: Set<string>,
): Promise<void> {
  const key = dag.chunkMetaKey(hash);
  if (pending.has(key)) {
    return;
  }
  pending.add(key);
  const v = await write.get(key);
  if (v === undefined) {
    // We do not write empty meta key values.
    return;
  }

  assertUint8Array(v);
  const refs = dag.metaFromFlatbuffer(v);
  await write.put(dag.chunkMetaKey(hash), refs);
}

export async function migrateRefCountKeyValue(
  hash: Hash,
  write: kv.Write,
  pending: Set<string>,
): Promise<void> {
  const key = dag.chunkRefCountKey(hash);
  if (pending.has(key)) {
    return;
  }
  pending.add(key);

  const v = await write.get(key);
  if (v === undefined) {
    // We do not write empty ref count key values.
    return;
  }

  assertUint8Array(v);
  const count = dag.fromLittleEndian(v);
  await write.put(dag.chunkRefCountKey(hash), count);
}

export async function migrateProllyMap(
  hash: Hash,
  write: kv.Write,
  pending: Set<string>,
): Promise<void> {
  const key = dag.chunkDataKey(hash);
  if (pending.has(key)) {
    return;
  }
  pending.add(key);

  const v = await write.get(key);
  assertUint8Array(v);
  const entries = prolly.entriesFromFlatbuffer(v);
  await Promise.all([
    write.put(dag.chunkDataKey(hash), entries),
    migrateRefCountKeyValue(hash, write, pending),
  ]);
}

/**
 * Migrates the whole KV store from version 0 (flatbuffers) to version 1 (JS).
 *
 * This does not migrate the hashes since we do not really care about that the
 * hashes match the content. If the data would have been generated by version 1
 * directly the hashes would not end up the same.
 *
 * Our data model does not allow listing the heads so this only migrates the
 * known heads; `db.DEFAULT_HEAD_NAME` and `sync.SYNC_HEAD_NAME`.
 */
export async function migrate0to1(
  write: kv.Write,
  lc: LogContext,
): Promise<void> {
  lc.debug?.(`migrating from version 0 to version 1`);
  // We pass in a pending set to only handle each key once. Some keys are
  // referenced more than once so this prevents us from trying to migrate the
  // same key twice.
  const pending: Set<string> = new Set();
  await Promise.all([
    migrateClientID(write),
    migrateHead(db.DEFAULT_HEAD_NAME, write, pending),
    migrateHead(sync.SYNC_HEAD_NAME, write, pending),
    setCurrentVersion(1, write),
  ]);
}
