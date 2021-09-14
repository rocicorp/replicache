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

export const DEFAULT_HEAD_NAME = 'main';

export const enum MetaTyped {
  NONE = 0,
  IndexChangeMeta = 1,
  LocalMeta = 2,
  SnapshotMeta = 3,
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
    return this.meta.type === MetaTyped.LocalMeta;
  }

  isSnapshot(): this is Commit<SnapshotMeta> {
    return this.meta.type === MetaTyped.SnapshotMeta;
  }

  isIndexChange(): this is Commit<IndexChangeMeta> {
    return this.meta.type === MetaTyped.IndexChangeMeta;
  }

  get valueHash(): string {
    // Already validated!
    return this.chunk.data.valueHash;
  }

  get mutationID(): number {
    const meta = this.meta;
    switch (meta.type) {
      case MetaTyped.IndexChangeMeta:
      case MetaTyped.SnapshotMeta:
        return meta.lastMutationID;
      case MetaTyped.LocalMeta:
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
    fromCommitHash: string,
    dagRead: dag.Read,
  ): Promise<Commit<LocalMeta>[]> {
    const commits = await Commit.chain(fromCommitHash, dagRead);
    // Filter does not deal with type narrowing.
    return commits.filter(c => c.isLocal()) as Commit<LocalMeta>[];
  }

  static async baseSnapshot(hash: string, dagRead: dag.Read): Promise<Commit> {
    let commit = await Commit.fromHash(hash, dagRead);
    while (!commit.isSnapshot()) {
      const meta = commit.meta;
      const basisHash = meta.basisHash;
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
    if (m.type === MetaTyped.SnapshotMeta) {
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
    fromCommitHash: string,
    dagRead: dag.Read,
  ): Promise<Commit[]> {
    let commit = await Commit.fromHash(fromCommitHash, dagRead);
    const commits = [];
    while (!commit.isSnapshot()) {
      const meta = commit.meta;
      const basisHash = meta.basisHash;
      if (basisHash === null) {
        throw new Error(`Commit ${commit.chunk.hash} has no basis`);
      }
      commits.push(commit);
      commit = await Commit.fromHash(basisHash, dagRead);
    }
    commits.push(commit);
    return commits;
  }

  static async fromHash(hash: string, dagRead: dag.Read): Promise<Commit> {
    const chunk = await dagRead.getChunk(hash);
    if (!chunk) {
      throw new Error(`Missing commit for ${hash}`);
    }
    return fromChunk(chunk);
  }
}

type BasisHash = {
  readonly basisHash: string | null;
};

export type IndexChangeMeta = BasisHash & {
  readonly type: MetaTyped.IndexChangeMeta;
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
  readonly type: MetaTyped.LocalMeta;
  readonly mutationID: number;
  readonly mutatorName: string;
  readonly mutatorArgsJSON: ReadonlyJSONValue;
  readonly originalHash: string | null;
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
    assertString(v.originalHash);
  }
}

export type SnapshotMeta = BasisHash & {
  readonly type: MetaTyped.SnapshotMeta;
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
    case MetaTyped.IndexChangeMeta:
      assertIndexChangeMeta(v);
      break;
    case MetaTyped.LocalMeta:
      assertLocalMeta(v);
      break;
    case MetaTyped.SnapshotMeta:
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
  readonly valueHash: string;
};

function assertIndexRecord(v: unknown): asserts v is IndexRecord {
  assertObject(v);
  assertIndexDefinition(v.definition);
  assertString(v.valueHash);
}

const enum RefType {
  Strong,
  Weak,
}

export function newLocal(
  basisHash: string | null,
  mutationID: number,
  mutatorName: string,
  mutatorArgsJSON: ReadonlyJSONValue,
  originalHash: string | null,
  valueHash: string,
  indexes: IndexRecord[],
): Promise<Commit> {
  const localMeta: LocalMeta = {
    type: MetaTyped.LocalMeta,
    basisHash,
    mutationID,
    mutatorName,
    mutatorArgsJSON,
    originalHash,
  };
  return newImpl(
    asRef(basisHash, RefType.Strong),
    localMeta,
    asRef(valueHash, RefType.Strong),
    asRef(originalHash, RefType.Weak),
    indexes,
  );
}

export function newSnapshot(
  basisHash: string | null,
  lastMutationID: number,
  cookieJSON: ReadonlyJSONValue,
  valueHash: string,
  indexes: IndexRecord[],
): Promise<Commit> {
  const snapshotMeta: SnapshotMeta = {
    type: MetaTyped.SnapshotMeta,
    basisHash,
    lastMutationID,
    cookieJSON,
  };
  return newImpl(
    asRef(basisHash, RefType.Weak),
    snapshotMeta,
    asRef(valueHash, RefType.Strong),
    null,
    indexes,
  );
}

export function newIndexChange(
  basisHash: string | null,
  lastMutationID: number,
  valueHash: string,
  indexes: IndexRecord[],
): Promise<Commit> {
  const indexChangeMeta: IndexChangeMeta = {
    type: MetaTyped.IndexChangeMeta,
    basisHash,
    lastMutationID,
  };
  return newImpl(
    asRef(basisHash, RefType.Strong),
    indexChangeMeta,
    asRef(valueHash, RefType.Strong),
    null,
    indexes,
  );
}

export function fromChunk(chunk: Chunk): Commit {
  validateChunk(chunk);
  return new Commit(chunk);
}

function asRef(h: null, t: RefType): null;
function asRef(h: string, t: RefType): Ref;
function asRef(h: string | null, t: RefType): Ref | null;
function asRef(h: string | null, t: RefType): Ref | null {
  if (h === null) {
    return null;
  }
  return {t, h};
}

type Ref = {
  t: RefType;
  h: string;
};

async function newImpl(
  basisHash: Ref | null,
  meta: LocalMeta | SnapshotMeta | IndexChangeMeta,
  valueHash: Ref,
  originalHash: Ref | null,
  indexes: IndexRecord[],
): Promise<Commit> {
  const refs: (Ref | null)[] = [valueHash, basisHash, originalHash];
  const strongRefs = (
    refs.filter(r => r && r.t === RefType.Strong) as Ref[]
  ).map(r => r.h);
  for (const index of indexes) {
    strongRefs.push(index.valueHash);
  }

  const data: CommitData = {
    meta,
    valueHash: valueHash.h,
    indexes,
  };
  const chunk = Chunk.new(data, strongRefs);
  return new Commit(chunk);
}

export type CommitData = {
  readonly meta: Meta;
  readonly valueHash: string;
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
  assertString(valueHash);

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
    assertNotNull(valueHash);
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
  const basisHash = metaFB.basisHash();
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
  basisHash: string | null,
): IndexChangeMeta {
  const indexChangeMetaFB = fb.typed(
    new IndexChangeMetaFB(),
  ) as IndexChangeMetaFB;
  return {
    type: MetaTyped.IndexChangeMeta,
    basisHash,
    lastMutationID: indexChangeMetaFB.lastMutationId().toFloat64(),
  };
}

function localMetaFromFlatbuffer(
  fb: MetaFB,
  basisHash: string | null,
): LocalMeta {
  const localMetaFB = fb.typed(new LocalMetaFB()) as LocalMetaFB;
  const mutatorName = localMetaFB.mutatorName();
  if (!mutatorName) {
    throw new Error('Missing mutator name');
  }
  const mutatorArgsJSONArray = localMetaFB.mutatorArgsJsonArray();
  assertNotNull(mutatorArgsJSONArray);
  return {
    type: MetaTyped.LocalMeta,
    basisHash,
    mutationID: localMetaFB.mutationId().toFloat64(),
    mutatorName,
    mutatorArgsJSON: JSON.parse(utf8.decode(mutatorArgsJSONArray)),
    originalHash: localMetaFB.originalHash(),
  };
}

function snapshotMetaFromFlatbuffer(
  fb: MetaFB,
  basisHash: string | null,
): SnapshotMeta {
  const snapshotMetaFB = fb.typed(new SnapshotMetaFB()) as SnapshotMetaFB;
  const cookieJSONArray = snapshotMetaFB.cookieJsonArray();
  assertNotNull(cookieJSONArray);
  return {
    type: MetaTyped.SnapshotMeta,
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
      case MetaTyped.LocalMeta: {
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
          originalHash ? builder.createString(originalHash) : 0,
        );
        return [MetaTypedFB.LocalMeta, localMeta];
      }

      case MetaTyped.SnapshotMeta: {
        const {lastMutationID, cookieJSON} = data.meta;
        const cookieBytes = utf8.encode(JSON.stringify(cookieJSON));
        const snapshotMeta = SnapshotMetaFB.createSnapshotMeta(
          builder,
          builder.createLong(lastMutationID, 0),
          SnapshotMetaFB.createCookieJsonVector(builder, cookieBytes),
        );
        return [MetaTypedFB.SnapshotMeta, snapshotMeta];
      }

      case MetaTyped.IndexChangeMeta: {
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
    basisHash ? builder.createString(basisHash) : 0,
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
