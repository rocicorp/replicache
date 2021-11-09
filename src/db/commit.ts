import {Chunk} from '../dag/mod';
import type * as dag from '../dag/mod';
import type {ReadonlyJSONValue} from '../json';
import {assertJSONValue} from '../json';
import {
  assertArray,
  assertNotNull,
  assertNotUndefined,
  assertNumber,
  assertObject,
  assertString,
} from '../asserts';
import type {Value} from '../kv/store';
import * as flatbuffers from 'flatbuffers';
import {LocalMeta as LocalMetaFB} from './generated/commit/local-meta';
import {Meta as MetaFB} from './generated/commit/meta';
import {MetaTyped as MetaTypedFB} from './generated/commit/meta-typed';
import {Commit as CommitFB} from './generated/commit/commit';
import {SnapshotMeta as SnapshotMetaFB} from './generated/commit/snapshot-meta';
import {IndexChangeMeta as IndexChangeMetaFB} from './generated/commit/index-change-meta';
import {IndexDefinition as IndexDefinitionFB} from './generated/commit/index-definition';
import {IndexRecord as IndexRecordFB} from './generated/commit/index-record';
import * as utf8 from '../utf8';
import {assertHash, Hash} from '../hash';

export const DEFAULT_HEAD_NAME = 'main';

export const enum MetaTyped {
  NONE = 0,
  IndexChange = 1,
  Local = 2,
  Snapshot = 3,
}

export class Commit<M extends Meta = Meta> {
  readonly chunk: Chunk<CommitData>;

  constructor(chunk: Chunk<CommitData>) {
    this.chunk = chunk;
  }

  get meta(): M {
    return this.chunk.data.meta as M;
  }

  isLocal(): this is Commit<LocalMeta> {
    return this.meta.type === MetaTyped.Local;
  }

  isSnapshot(): this is Commit<SnapshotMeta> {
    return this.meta.type === MetaTyped.Snapshot;
  }

  isIndexChange(): this is Commit<IndexChangeMeta> {
    return this.meta.type === MetaTyped.IndexChange;
  }

  get valueHash(): Hash {
    // Already validated!
    return this.chunk.data.valueHash;
  }

  get mutationID(): number {
    const {meta} = this;
    switch (meta.type) {
      case MetaTyped.IndexChange:
      case MetaTyped.Snapshot:
        return meta.lastMutationID;
      case MetaTyped.Local:
        return meta.mutationID;
    }
  }

  get nextMutationID(): number {
    return this.mutationID + 1;
  }

  get indexes(): IndexRecord[] {
    // Already validated!
    return this.chunk.data.indexes;
  }

  /**
   * Returns the set of local commits from the given from_commit_hash back to but not
   * including its base snapshot. If from_commit_hash is a snapshot, the returned vector
   * will be empty. When, as typical, from_commit_hash is the head of the default chain
   * then the returned commits are the set of pending commits, ie the set of local commits
   * that have not yet been pushed to the data layer.
   *
   * The vector of commits is returned in reverse chain order, that is, starting
   * with the commit with hash from_commit_hash and walking backwards.
   */
  static async localMutations(
    fromCommitHash: Hash,
    dagRead: dag.Read,
  ): Promise<Commit<LocalMeta>[]> {
    const commits = await Commit.chain(fromCommitHash, dagRead);
    // Filter does not deal with type narrowing.
    return commits.filter(c => c.isLocal()) as Commit<LocalMeta>[];
  }

  static async baseSnapshot(hash: Hash, dagRead: dag.Read): Promise<Commit> {
    let commit = await Commit.fromHash(hash, dagRead);
    while (!commit.isSnapshot()) {
      const {meta} = commit;
      const {basisHash} = meta;
      if (basisHash === null) {
        throw new Error(`Commit ${commit.chunk.hash} has no basis`);
      }
      commit = await Commit.fromHash(basisHash, dagRead);
    }
    return commit;
  }

  static snapshotMetaParts(
    c: Commit,
  ): [lastMutationID: number, cookie: ReadonlyJSONValue] {
    const m = c.meta;
    if (m.type === MetaTyped.Snapshot) {
      return [m.lastMutationID, m.cookieJSON];
    }
    throw new Error('Snapshot meta expected');
  }

  /**
   * Returns all commits from the commit with from_commit_hash to its base
   * snapshot, inclusive of both. Resulting vector is in chain-head-first order
   * (so snapshot comes last).
   */
  static async chain(
    fromCommitHash: Hash,
    dagRead: dag.Read,
  ): Promise<Commit[]> {
    let commit = await Commit.fromHash(fromCommitHash, dagRead);
    const commits = [];
    while (!commit.isSnapshot()) {
      const {meta} = commit;
      const {basisHash} = meta;
      if (basisHash === null) {
        throw new Error(`Commit ${commit.chunk.hash} has no basis`);
      }
      commits.push(commit);
      commit = await Commit.fromHash(basisHash, dagRead);
    }
    commits.push(commit);
    return commits;
  }

  static async fromHash(hash: Hash, dagRead: dag.Read): Promise<Commit> {
    const chunk = await dagRead.getChunk(hash);
    if (!chunk) {
      throw new Error(`Missing commit for ${hash}`);
    }
    return fromChunk(chunk);
  }
}

type BasisHash = {
  readonly basisHash: Hash | null;
};

export type IndexChangeMeta = BasisHash & {
  readonly type: MetaTyped.IndexChange;
  readonly lastMutationID: number;
};

function assertIndexChangeMeta(
  v: Record<string, unknown>,
): asserts v is IndexChangeMeta {
  // type already asserted
  assertNumber(v.lastMutationID);

  // Note: indexes are already validated for all commit types. Only additional
  // things to validate are:
  //   - last_mutation_id is equal to the basis
  //   - value_hash has not been changed
  // However we don't have a write transaction this deep, so these validated at
  // commit time.
}

export type LocalMeta = BasisHash & {
  readonly type: MetaTyped.Local;
  readonly mutationID: number;
  readonly mutatorName: string;
  readonly mutatorArgsJSON: ReadonlyJSONValue;
  readonly originalHash: Hash | null;
};

function assertLocalMeta(v: Record<string, unknown>): asserts v is LocalMeta {
  // type already asserted
  assertNumber(v.mutationID);
  assertString(v.mutatorName);
  if (!v.mutatorName) {
    throw new Error('Missing mutator name');
  }
  assertJSONValue(v.mutatorArgsJSON);
  if (v.originalHash !== null) {
    assertHash(v.originalHash);
  }
}

export type SnapshotMeta = BasisHash & {
  readonly type: MetaTyped.Snapshot;
  readonly lastMutationID: number;
  readonly cookieJSON: ReadonlyJSONValue;
};

function assertSnapshot(v: Record<string, unknown>): asserts v is SnapshotMeta {
  // type already asserted
  assertNumber(v.lastMutationID);
  assertJSONValue(v.cookieJSON);
}

export type Meta = IndexChangeMeta | LocalMeta | SnapshotMeta;

function assertMeta(v: unknown): asserts v is Meta {
  assertObject(v);
  if (v.basisHash !== null) {
    assertString(v.basisHash);
  }

  assertNumber(v.type);
  switch (v.type) {
    case MetaTyped.IndexChange:
      assertIndexChangeMeta(v);
      break;
    case MetaTyped.Local:
      assertLocalMeta(v);
      break;
    case MetaTyped.Snapshot:
      assertSnapshot(v);
      break;
    default:
      throw new Error(`Invalid enum value ${v.type}`);
  }
}

export type IndexDefinition = {
  readonly name: string;
  // keyPrefix describes a subset of the primary key to index
  readonly keyPrefix: string;
  // jsonPointer describes the (sub-)value to index (secondary index)
  readonly jsonPointer: string;
};

function assertIndexDefinition(v: unknown): asserts v is IndexDefinition {
  assertObject(v);
  assertString(v.name);
  assertString(v.keyPrefix);
  assertString(v.jsonPointer);
}

export type IndexRecord = {
  readonly definition: IndexDefinition;
  readonly valueHash: Hash;
};

function assertIndexRecord(v: unknown): asserts v is IndexRecord {
  assertObject(v);
  assertIndexDefinition(v.definition);
  assertString(v.valueHash);
}

export function newLocal(
  basisHash: Hash | null,
  mutationID: number,
  mutatorName: string,
  mutatorArgsJSON: ReadonlyJSONValue,
  originalHash: Hash | null,
  valueHash: Hash,
  indexes: IndexRecord[],
): Commit {
  const meta: LocalMeta = {
    type: MetaTyped.Local,
    basisHash,
    mutationID,
    mutatorName,
    mutatorArgsJSON,
    originalHash,
  };
  return commitFromCommitData({meta, valueHash, indexes});
}

export function newSnapshot(
  basisHash: Hash | null,
  lastMutationID: number,
  cookieJSON: ReadonlyJSONValue,
  valueHash: Hash,
  indexes: IndexRecord[],
): Commit {
  const meta: SnapshotMeta = {
    type: MetaTyped.Snapshot,
    basisHash,
    lastMutationID,
    cookieJSON,
  };
  return commitFromCommitData({meta, valueHash, indexes});
}

export function newIndexChange(
  basisHash: Hash | null,
  lastMutationID: number,
  valueHash: Hash,
  indexes: IndexRecord[],
): Commit {
  const meta: IndexChangeMeta = {
    type: MetaTyped.IndexChange,
    basisHash,
    lastMutationID,
  };
  return commitFromCommitData({meta, valueHash, indexes});
}

export function fromChunk(chunk: Chunk): Commit {
  validateChunk(chunk);
  return new Commit(chunk);
}

function chunkFromCommitData(data: CommitData): Chunk<CommitData> {
  const refs = getRefs(data);
  return Chunk.new(data, refs);
}

function commitFromCommitData(data: CommitData): Commit {
  return new Commit(chunkFromCommitData(data));
}

function getRefs(data: CommitData): Hash[] {
  const refs: Hash[] = [data.valueHash];
  const {meta} = data;
  switch (meta.type) {
    case MetaTyped.IndexChange:
      meta.basisHash && refs.push(meta.basisHash);
      break;
    case MetaTyped.Local:
      meta.basisHash && refs.push(meta.basisHash);
      // Local has weak originalHash
      break;
    case MetaTyped.Snapshot:
      // Snapshot has weak basisHash
      break;
  }

  for (const index of data.indexes) {
    refs.push(index.valueHash);
  }

  return refs;
}

export type CommitData = {
  readonly meta: Meta;
  readonly valueHash: Hash;
  readonly indexes: IndexRecord[];
};

function assertCommitData(v: unknown): asserts v is CommitData {
  assertObject(v);
  assertMeta(v.meta);
  assertString(v.valueHash);
  assertArray(v.indexes);
  for (const index of v.indexes) {
    assertIndexRecord(index);
  }
}

function validateChunk(
  chunk: Chunk<Value>,
): asserts chunk is Chunk<CommitData> {
  const {data} = chunk;
  assertCommitData(data);

  // Indexes is optional
  const seen = new Set();
  for (const index of data.indexes) {
    const {name} = index.definition;
    if (seen.has(name)) {
      throw new Error(`Duplicate index ${name}`);
    }
    seen.add(name);
  }
}

export function commitDataFromFlatbuffer(data: Uint8Array): CommitData {
  const buf = new flatbuffers.ByteBuffer(data);
  const commitFB = CommitFB.getRootAsCommit(buf);
  const metaFB = commitFB.meta();
  assertNotNull(metaFB);
  const meta = metaFromFlatbuffer(metaFB);

  const valueHash = commitFB.valueHash();
  assertHash(valueHash);

  const indexes: IndexRecord[] = [];

  const length = commitFB.indexesLength();
  for (let i = 0; i < length; i++) {
    const indexFB = commitFB.indexes(i);
    assertNotNull(indexFB);
    const definitionFB = indexFB.definition();
    assertNotNull(definitionFB);
    const name = definitionFB.name();
    assertString(name);
    const keyPrefixArray = definitionFB.keyPrefixArray();
    assertNotNull(keyPrefixArray);
    const keyPrefix = utf8.decode(keyPrefixArray);
    const jsonPointer = definitionFB.jsonPointer() ?? '';
    assertString(jsonPointer);
    const definition: IndexDefinition = {
      name,
      keyPrefix,
      jsonPointer,
    };
    const valueHash = indexFB.valueHash();
    assertHash(valueHash);
    const index: IndexRecord = {
      definition,
      valueHash,
    };
    indexes.push(index);
  }

  return {
    meta,
    valueHash,
    indexes,
  };
}

function metaFromFlatbuffer(metaFB: MetaFB): Meta {
  const basisHash = metaFB.basisHash() as Hash | null;
  switch (metaFB.typedType()) {
    case MetaTypedFB.NONE:
      throw new Error('Invalid meta type');
    case MetaTypedFB.IndexChangeMeta:
      return indexChangeMetaFromFlatbuffer(metaFB, basisHash);
    case MetaTypedFB.LocalMeta:
      return localMetaFromFlatbuffer(metaFB, basisHash);
    case MetaTypedFB.SnapshotMeta:
      return snapshotMetaFromFlatbuffer(metaFB, basisHash);
  }
}

function indexChangeMetaFromFlatbuffer(
  fb: MetaFB,
  basisHash: Hash | null,
): IndexChangeMeta {
  const indexChangeMetaFB = fb.typed(
    new IndexChangeMetaFB(),
  ) as IndexChangeMetaFB;
  return {
    type: MetaTyped.IndexChange,
    basisHash,
    lastMutationID: indexChangeMetaFB.lastMutationId().toFloat64(),
  };
}

function localMetaFromFlatbuffer(
  fb: MetaFB,
  basisHash: Hash | null,
): LocalMeta {
  const localMetaFB = fb.typed(new LocalMetaFB()) as LocalMetaFB;
  const mutatorName = localMetaFB.mutatorName();
  if (!mutatorName) {
    throw new Error('Missing mutator name');
  }
  const mutatorArgsJSONArray = localMetaFB.mutatorArgsJsonArray();
  assertNotNull(mutatorArgsJSONArray);
  return {
    type: MetaTyped.Local,
    basisHash,
    mutationID: localMetaFB.mutationId().toFloat64(),
    mutatorName,
    mutatorArgsJSON: JSON.parse(utf8.decode(mutatorArgsJSONArray)),
    originalHash: localMetaFB.originalHash() as Hash | null,
  };
}

function snapshotMetaFromFlatbuffer(
  fb: MetaFB,
  basisHash: Hash | null,
): SnapshotMeta {
  const snapshotMetaFB = fb.typed(new SnapshotMetaFB()) as SnapshotMetaFB;
  const cookieJSONArray = snapshotMetaFB.cookieJsonArray();
  assertNotNull(cookieJSONArray);
  return {
    type: MetaTyped.Snapshot,
    basisHash,
    lastMutationID: snapshotMetaFB.lastMutationId().toFloat64(),
    cookieJSON: JSON.parse(utf8.decode(cookieJSONArray)),
  };
}

export function commitDataToFlatbuffer(data: CommitData): Uint8Array {
  const builder = new flatbuffers.Builder();

  const {basisHash} = data.meta;
  const {valueHash, indexes} = data;

  assertString(valueHash);
  if (!valueHash) {
    throw new Error('Missing value hash');
  }

  const [unionType, unionValue] = (() => {
    switch (data.meta.type) {
      case MetaTyped.Local: {
        const {mutationID, mutatorName, mutatorArgsJSON, originalHash} =
          data.meta;
        const localMeta = LocalMetaFB.createLocalMeta(
          builder,
          flatbuffers.createLong(mutationID, 0),
          builder.createString(mutatorName),
          LocalMetaFB.createMutatorArgsJsonVector(
            builder,
            utf8.encode(JSON.stringify(mutatorArgsJSON)),
          ),
          originalHash ? builder.createString(String(originalHash)) : 0,
        );
        return [MetaTypedFB.LocalMeta, localMeta];
      }

      case MetaTyped.Snapshot: {
        const {lastMutationID, cookieJSON} = data.meta;
        const cookieBytes = utf8.encode(JSON.stringify(cookieJSON));
        const snapshotMeta = SnapshotMetaFB.createSnapshotMeta(
          builder,
          builder.createLong(lastMutationID, 0),
          SnapshotMetaFB.createCookieJsonVector(builder, cookieBytes),
        );
        return [MetaTypedFB.SnapshotMeta, snapshotMeta];
      }

      case MetaTyped.IndexChange: {
        const {lastMutationID} = data.meta;
        const indexChangeMeta = IndexChangeMetaFB.createIndexChangeMeta(
          builder,
          builder.createLong(lastMutationID, 0),
        );
        return [MetaTypedFB.IndexChangeMeta, indexChangeMeta];
      }
    }
  })();

  const meta = MetaFB.createMeta(
    builder,
    basisHash ? builder.createString(String(basisHash)) : 0,
    unionType,
    unionValue,
  );

  const indexRecordsFB = [];
  for (const index of indexes) {
    const {name, keyPrefix, jsonPointer} = index.definition;
    const indexDefinition = IndexDefinitionFB.createIndexDefinition(
      builder,
      builder.createString(name),
      IndexDefinitionFB.createKeyPrefixVector(builder, utf8.encode(keyPrefix)),
      builder.createString(jsonPointer),
    );

    assertString(index.valueHash);
    if (!index.valueHash) {
      throw new Error('Missing index value hash');
    }

    const indexRecord = IndexRecordFB.createIndexRecord(
      builder,
      indexDefinition,
      builder.createString(index.valueHash),
    );
    indexRecordsFB.push(indexRecord);
  }

  assertNotUndefined(valueHash);
  assertNotNull(valueHash);
  if (valueHash === '') {
    throw new Error('Invalid value hash');
  }

  const commitFB = CommitFB.createCommit(
    builder,
    meta,
    builder.createString(valueHash),
    CommitFB.createIndexesVector(builder, indexRecordsFB),
  );

  builder.finish(commitFB);
  return builder.asUint8Array();
}
