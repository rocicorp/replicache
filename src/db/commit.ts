import * as flatbuffers from 'flatbuffers';
import {Chunk} from '../dag/mod';
import type * as dag from '../dag/mod';
import {IndexDefinition as IndexDefinitionFB} from './generated/commit/index-definition';
import {LocalMeta as LocalMetaFB} from './generated/commit/local-meta';
import {Meta as MetaFB} from './generated/commit/meta';
import {MetaTyped as MetaTypedFB} from './generated/commit/meta-typed';
import {Commit as CommitFB} from './generated/commit/commit';
import {IndexRecord as IndexRecordFB} from './generated/commit/index-record';
import {SnapshotMeta as SnapshotMetaFB} from './generated/commit/snapshot-meta';
import {IndexChangeMeta as IndexChangeMetaFB} from './generated/commit/index-change-meta';
import type {ReadonlyJSONValue, JSONValue} from '../json';
import {assertInstanceof, assertNotNull, assertString} from '../asserts';
import * as utf8 from '../utf8';

export const DEFAULT_HEAD_NAME = 'main';

export class Commit {
  readonly chunk: Chunk;
  constructor(chunk: Chunk) {
    this.chunk = chunk;
  }

  commit(): CommitFB {
    const {data} = this.chunk;
    assertInstanceof(data, Uint8Array);
    const buf = new flatbuffers.ByteBuffer(data);
    return CommitFB.getRootAsCommit(buf);
  }

  meta(): Meta {
    // Already validated!
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return new Meta(this.commit().meta()!);
  }

  valueHash(): string {
    // Already validated!
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.commit().valueHash()!;
  }

  mutationID(): number {
    const meta = this.meta().typed();
    switch (meta.type) {
      case MetaTypedFB.IndexChangeMeta:
      case MetaTypedFB.SnapshotMeta:
        return meta.lastMutationID();
      case MetaTypedFB.LocalMeta:
        return meta.mutationID();
    }
  }

  nextMutationID(): number {
    return this.mutationID() + 1;
  }

  indexes(): IndexRecord[] {
    // TODO: Would be nice to return an iterator instead of allocating the temp vector here.
    const result = [];
    const commitFB = this.commit();
    for (let i = 0; i < commitFB.indexesLength(); i++) {
      const idx = commitFB.indexes(i);
      assertNotNull(idx);
      const definitionFB = idx.definition();
      assertNotNull(definitionFB);
      const jsonPointer = definitionFB.jsonPointer() ?? '';
      const name = definitionFB.name();
      assertString(name);
      const keyPrefix = definitionFB.keyPrefixArray();
      assertNotNull(keyPrefix);
      const definition: IndexDefinition = {
        name,
        keyPrefix: utf8.decode(keyPrefix),
        jsonPointer,
      };
      const valueHash = idx.valueHash();
      assertNotNull(valueHash);
      const index: IndexRecord = {
        definition,
        valueHash,
      };
      result.push(index);
    }
    return result;
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
  ): Promise<Commit[]> {
    const commits = await Commit.chain(fromCommitHash, dagRead);
    return commits.filter(c => c.meta().isLocal());
  }

  static async baseSnapshot(hash: string, dagRead: dag.Read): Promise<Commit> {
    let commit = await Commit.fromHash(hash, dagRead);
    while (!commit.meta().isSnapshot()) {
      const meta = commit.meta();
      const basisHash = meta.basisHash();
      if (basisHash === null) {
        throw new Error(`Commit ${commit.chunk.hash} has no basis`);
      }
      commit = await Commit.fromHash(basisHash, dagRead);
    }
    return commit;
  }

  static snapshotMetaParts(
    c: Commit,
  ): [lastMutationID: number, cookie: JSONValue] {
    const m = c.meta().typed();
    if (m.type === MetaTypedFB.SnapshotMeta) {
      return [m.lastMutationID(), m.cookieJSONValue()];
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
    while (!commit.meta().isSnapshot()) {
      const meta = commit.meta();
      const basisHash = meta.basisHash();
      if (basisHash === null) {
        throw new Error(`Commit ${commit.chunk.hash} has no basis`);
      }
      commits.push(commit);
      commit = await Commit.fromHash(basisHash, dagRead);
    }
    if (!commit.meta().isSnapshot()) {
      throw new Error(`End of chain ${commit.chunk.hash} is not a snapshot`);
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

// TODO(arv): Consider flattening Meta and (LocalMeta | ...)
export class Meta {
  readonly fb: MetaFB;

  constructor(fb: MetaFB) {
    this.fb = fb;
  }

  basisHash(): string | null {
    return this.fb.basisHash();
  }

  typed(): IndexChangeMeta | LocalMeta | SnapshotMeta {
    switch (this.fb.typedType()) {
      case MetaTypedFB.NONE:
        throw new Error('unreachable');
      case MetaTypedFB.IndexChangeMeta:
        return new IndexChangeMeta(this.fb.typed(new IndexChangeMetaFB()));
      case MetaTypedFB.LocalMeta:
        return new LocalMeta(this.fb.typed(new LocalMetaFB()));
      case MetaTypedFB.SnapshotMeta:
        return new SnapshotMeta(this.fb.typed(new SnapshotMetaFB()));
    }
  }

  isSnapshot(): boolean {
    return this.fb.typedType() === MetaTypedFB.SnapshotMeta;
  }

  isLocal(): boolean {
    return this.fb.typedType() === MetaTypedFB.LocalMeta;
  }
}

export class IndexChangeMeta {
  readonly type = MetaTypedFB.IndexChangeMeta;
  readonly fb: IndexChangeMetaFB;
  constructor(fb: IndexChangeMetaFB) {
    this.fb = fb;
  }

  lastMutationID(): number {
    return this.fb.lastMutationId().toFloat64();
  }
}

export class LocalMeta {
  readonly type = MetaTypedFB.LocalMeta;
  readonly fb: LocalMetaFB;
  constructor(fb: LocalMetaFB) {
    this.fb = fb;
  }

  mutationID(): number {
    return this.fb.mutationId().toFloat64();
  }

  mutatorName(): string {
    // Already validated!
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.fb.mutatorName()!;
  }

  mutatorArgsJSON(): JSONValue {
    // Already validated!
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return JSON.parse(utf8.decode(this.fb.mutatorArgsJsonArray()!));
  }

  originalHash(): string | undefined {
    // original_hash is legitimately optional, it's only present if the
    // local commit was rebased.
    return this.fb.originalHash() ?? undefined;
  }
}

export class SnapshotMeta {
  readonly type = MetaTypedFB.SnapshotMeta;
  readonly fb: SnapshotMetaFB;
  constructor(fb: SnapshotMetaFB) {
    this.fb = fb;
  }

  lastMutationID(): number {
    return this.fb.lastMutationId().toFloat64();
  }

  cookieJSON(): Uint8Array {
    // Already validated!
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.fb.cookieJsonArray()!;
  }

  cookieJSONValue(): JSONValue {
    return JSON.parse(utf8.decode(this.cookieJSON()));
  }
}

export type IndexDefinition = {
  name: string;
  // keyPrefix describes a subset of the primary key to index
  keyPrefix: string;
  // jsonPointer describes the (sub-)value to index (secondary index)
  jsonPointer: string;
};

export type IndexRecord = {
  definition: IndexDefinition;
  valueHash: string;
};

const enum RefType {
  Strong,
  Weak,
}

export function newLocal(
  basisHash: string | undefined,
  mutationID: number,
  mutatorName: string,
  mutatorArgsJSON: ReadonlyJSONValue,
  originalHash: string | undefined,
  valueHash: string,
  indexes: IndexRecord[],
): Promise<Commit> {
  const builder = new flatbuffers.Builder();
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

  return newImpl(
    builder,
    asRef(basisHash, RefType.Strong),
    MetaTypedFB.LocalMeta,
    localMeta,
    asRef(valueHash, RefType.Strong),
    asRef(originalHash, RefType.Weak),
    indexes,
  );
}

export function newSnapshot(
  basisHash: string | undefined,
  lastMutationID: number,
  cookieJSON: ReadonlyJSONValue,
  valueHash: string,
  indexes: IndexRecord[],
): Promise<Commit> {
  const builder = new flatbuffers.Builder();
  const cookieBytes = utf8.encode(JSON.stringify(cookieJSON));
  const snapshotMeta = SnapshotMetaFB.createSnapshotMeta(
    builder,
    builder.createLong(lastMutationID, 0),
    SnapshotMetaFB.createCookieJsonVector(builder, cookieBytes),
  );
  return newImpl(
    builder,
    asRef(basisHash, RefType.Weak),
    MetaTypedFB.SnapshotMeta,
    snapshotMeta,
    asRef(valueHash, RefType.Strong),
    undefined,
    indexes,
  );
}

export function newIndexChange(
  basisHash: string | undefined,
  lastMutationID: number,
  valueHash: string,
  indexes: IndexRecord[],
): Promise<Commit> {
  const builder = new flatbuffers.Builder();
  const indexChangeMeta = IndexChangeMetaFB.createIndexChangeMeta(
    builder,
    builder.createLong(lastMutationID, 0),
  );
  return newImpl(
    builder,
    asRef(basisHash, RefType.Strong),
    MetaTypedFB.IndexChangeMeta,
    indexChangeMeta,
    asRef(valueHash, RefType.Strong),
    undefined,
    indexes,
  );
}

export function fromChunk(chunk: Chunk): Commit {
  const {data} = chunk;
  assertInstanceof(data, Uint8Array);
  validate(data);
  return new Commit(chunk);
}

function asRef(h: undefined, t: RefType): undefined;
function asRef(h: string, t: RefType): Ref;
function asRef(h: string | undefined, t: RefType): Ref | undefined;
function asRef(h: string | undefined, t: RefType): Ref | undefined {
  if (h === undefined) {
    return undefined;
  }
  return {t, h};
}

type Ref = {
  t: RefType;
  h: string;
};

async function newImpl(
  builder: flatbuffers.Builder,
  basisHash: Ref | undefined,
  unionType: MetaTypedFB,
  unionValue: number,
  valueHash: Ref,
  originalHash: Ref | undefined,
  indexes: IndexRecord[],
): Promise<Commit> {
  const meta = MetaFB.createMeta(
    builder,
    basisHash ? builder.createString(basisHash.h) : 0,
    unionType,
    unionValue,
  );

  const indexRecordsFB = [];
  for (const index of indexes) {
    const indexDefinition = IndexDefinitionFB.createIndexDefinition(
      builder,
      builder.createString(index.definition.name),
      IndexDefinitionFB.createKeyPrefixVector(
        builder,
        utf8.encode(index.definition.keyPrefix),
      ),
      builder.createString(index.definition.jsonPointer),
    );

    const indexRecord = IndexRecordFB.createIndexRecord(
      builder,
      indexDefinition,
      builder.createString(index.valueHash),
    );
    indexRecordsFB.push(indexRecord);
  }

  const commitFB = CommitFB.createCommit(
    builder,
    meta,
    builder.createString(valueHash.h),
    CommitFB.createIndexesVector(builder, indexRecordsFB),
  );

  builder.finish(commitFB);
  const data = builder.asUint8Array();

  const refs: (Ref | undefined)[] = [valueHash, basisHash, originalHash];
  const strongRefs = (
    refs.filter(r => r && r.t === RefType.Strong) as Ref[]
  ).map(r => r.h);
  for (const index of indexes) {
    strongRefs.push(index.valueHash);
  }

  const chunk = Chunk.new(data, strongRefs);
  return new Commit(chunk);
}

function validate(data: Uint8Array) {
  const buf = new flatbuffers.ByteBuffer(data);
  const root = CommitFB.getRootAsCommit(buf);
  if (root.valueHash() === null) {
    throw new Error('Missing value hash');
  }
  const meta = root.meta();
  if (!meta) {
    throw new Error('Missing meta');
  }

  // basis_hash is optional -- the first commit lacks a basis

  switch (meta.typedType()) {
    case MetaTypedFB.NONE:
      throw new Error('Unknown meta type');
    case MetaTypedFB.IndexChangeMeta:
      validateIndexChangeMeta(meta.typed(new IndexChangeMetaFB()));
      break;
    case MetaTypedFB.LocalMeta:
      validateLocalMeta(meta.typed(new LocalMetaFB()));
      break;
    case MetaTypedFB.SnapshotMeta:
      validateSnapshotMeta(meta.typed(new SnapshotMetaFB()));
      break;
  }

  // Indexes is optional
  const seen = new Set();
  const indexesLength = root.indexesLength();
  for (let i = 0; i < indexesLength; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const index = root.indexes(i)!;
    validateIndex(index);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const name = index!.definition()!.name()!;
    if (seen.has(name)) {
      throw new Error(`Duplicate index ${name}`);
    }
    seen.add(name);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function validateIndexChangeMeta(_meta: IndexChangeMetaFB) {
  // Note: indexes are already validated for all commit types. Only additional
  // things to validate are:
  //   - last_mutation_id is equal to the basis
  //   - value_hash has not been changed
  // However we don't have a write transaction this deep, so these validated at
  // commit time.
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function validateLocalMeta(meta: LocalMetaFB) {
  // JS impl of Flatbuffers does not distinguish between null and empty string.
  if (meta.mutatorName(flatbuffers.Encoding.UTF8_BYTES) === null) {
    throw new Error('Missing mutator name');
  }
  // JS impl of Flatbuffers does not distinguish between null and empty string.
  // if (meta.mutatorArgsJsonLength() === 0) {
  //   throw new Error('Missing mutator args JSON');
  // }
}

function validateSnapshotMeta(meta: SnapshotMetaFB) {
  const cookieJSON = meta.cookieJsonArray();
  if (cookieJSON === null) {
    throw new Error('Missing cookie');
  }
  const s = utf8.decode(cookieJSON);
  JSON.parse(s);
}

function validateIndex(index: IndexRecordFB) {
  const d = index.definition();
  if (!d) {
    throw new Error('Missing index definition');
  }
  validateIndexDefinition(d);
  // No need to decode yet.
  if (index.valueHash(flatbuffers.Encoding.UTF8_BYTES) === null) {
    throw new Error('Missing value hash');
  }
}

function validateIndexDefinition(d: IndexDefinitionFB) {
  if (d.name(flatbuffers.Encoding.UTF8_BYTES) === null) {
    throw new Error('Missing index name');
  }

  // JS impl of Flatbuffers does not distinguish between missing and empty vector.
  // if (d.keyPrefixLength() === 0) {
  //   throw new Error('Missing key prefix');
  // }

  // JS impl of Flatbuffers does not distinguish between missin and empty string.
  // if (d.jsonPointer(flatbuffers.Encoding.UTF8_BYTES) === null) {
  //   throw new Error('Missing index path');
  // }
}
