import {assert} from '../asserts';
import {assertBTreeNode, isInternalNode} from '../btree/node';
import * as btree from '../btree/mod';
import {
  IndexChangeMeta,
  Meta,
  MetaTyped,
  SnapshotMeta,
  getRefs as getRefsFromCommitData,
  assertCommitData,
  LocalMeta,
  CommitData,
  IndexRecord,
} from './commit';
import type {Hash} from '../hash';
import type * as dag from '../dag/mod';
import type {ReadonlyJSONValue} from '../json';
import {HashType} from './hash-type';
import type {Value} from '../kv/store';

export class Transformer {
  readonly dagWrite: dag.Write;
  private readonly _transforming: Map<Hash, Promise<Hash>> = new Map();

  constructor(dagWrite: dag.Write) {
    this.dagWrite = dagWrite;
  }

  private _withTransformingCache(
    h: Hash,
    f: () => Promise<Hash>,
  ): Promise<Hash> {
    const newHash = this._transforming.get(h);
    if (newHash !== undefined) {
      return newHash;
    }

    const p = f();
    this._transforming.set(h, p);
    return p;
  }

  private _transformCommitWithCache(
    h: Hash,
    hashType = HashType.RequireStrong,
  ): Promise<Hash> {
    return this._withTransformingCache(h, () =>
      this.transformCommit(h, hashType),
    );
  }

  async transformCommit(
    h: Hash,
    hashType = HashType.RequireStrong,
  ): Promise<Hash> {
    const chunk = await this.getChunk(h);
    if (!chunk) {
      if (hashType === HashType.AllowWeak) {
        return h;
      }
      throw new Error(`Chunk ${h} not found`);
    }
    const {data} = chunk;
    assertCommitData(data);

    const newCommitData = await this._transformCommitData(data);
    return this._maybeWriteChunk(h, newCommitData, data, getRefsFromCommitData);
  }

  protected shouldForceWrite(_h: Hash): boolean {
    return false;
  }

  protected getChunk(h: Hash): Promise<dag.Chunk | undefined> {
    return this.dagWrite.getChunk(h);
  }

  private async _maybeWriteChunk<D extends Value>(
    h: Hash,
    newData: D,
    oldData: D,
    getRefs: (data: D) => readonly Hash[],
  ): Promise<Hash> {
    if (newData !== oldData || this.shouldForceWrite(h)) {
      return this.writeChunk(h, newData, getRefs);
    }
    return h;
  }

  async writeChunk<D extends Value>(
    _h: Hash,
    data: D,
    getRefs: (data: D) => readonly Hash[],
  ): Promise<Hash> {
    const newChunk = this.dagWrite.createChunk(data, getRefs(data));
    await this.dagWrite.putChunk(newChunk);
    return newChunk.hash;
  }

  private async _transformCommitData<M extends Meta>(
    data: CommitData<M>,
  ): Promise<CommitData<Meta>> {
    const meta = await this._transformCommitMeta(data.meta);
    const valueHash = await this._transformCommitValue(data.valueHash);
    const indexes = await this._transformIndexRecords(data.indexes);

    if (
      meta === data.meta &&
      valueHash === data.valueHash &&
      indexes === data.indexes
    ) {
      return data;
    }
    return {
      meta,
      valueHash,
      indexes,
    };
  }

  private _transformCommitMeta<M extends Meta>(meta: M): Promise<Meta> {
    switch (meta.type) {
      case MetaTyped.IndexChange:
        return this._transformIndexChangeMeta(meta);

      case MetaTyped.Local:
        return this._transformLocalMeta(meta);

      case MetaTyped.Snapshot:
        return this._transformSnapshot(meta);
    }
  }

  private _transformBasisHash(
    basisHash: Hash | null,
    hashType: HashType,
  ): Promise<Hash> | null {
    if (basisHash !== null) {
      return this._transformCommitWithCache(basisHash, hashType);
    }
    return null;
  }

  private async _transformSnapshot(meta: SnapshotMeta): Promise<SnapshotMeta> {
    // basisHash is weak for Snapshot Commits
    const basisHash = await this._transformBasisHash(
      meta.basisHash,
      HashType.AllowWeak,
    );
    if (basisHash === meta.basisHash) {
      return meta;
    }
    return {
      basisHash,
      type: meta.type,
      lastMutationID: meta.lastMutationID,
      cookieJSON: meta.cookieJSON,
    };
  }

  private async _transformLocalMeta(meta: LocalMeta): Promise<LocalMeta> {
    const basisHash = await this._transformBasisHash(
      meta.basisHash,
      HashType.RequireStrong,
    );
    // originalHash is weak for Local Commits
    const originalHash =
      meta.originalHash &&
      (await this._transformCommitWithCache(
        meta.originalHash,
        HashType.AllowWeak,
      ));
    if (basisHash === meta.basisHash && originalHash === meta.originalHash) {
      return meta;
    }
    return {
      basisHash,
      type: meta.type,
      mutationID: meta.mutationID,
      mutatorName: meta.mutatorName,
      mutatorArgsJSON: meta.mutatorArgsJSON,
      originalHash,
    };
  }

  private async _transformIndexChangeMeta(
    meta: IndexChangeMeta,
  ): Promise<IndexChangeMeta> {
    const basisHash = await this._transformBasisHash(
      meta.basisHash,
      HashType.RequireStrong,
    );
    if (basisHash === meta.basisHash) {
      return meta;
    }
    return {
      basisHash,
      type: meta.type,
      lastMutationID: meta.lastMutationID,
    };
  }

  private _transformCommitValue(valueHash: Hash): Promise<Hash> {
    return this._transformBTreeNodeWithCache(valueHash);
  }

  private _transformBTreeNodeWithCache(h: Hash): Promise<Hash> {
    return this._withTransformingCache(h, () => this.transformBTreeNode(h));
  }

  async transformBTreeNode(h: Hash): Promise<Hash> {
    const chunk = await this.getChunk(h);
    assert(chunk, `Missing chunk: ${h}`);
    const {data} = chunk;
    assertBTreeNode(data);

    const newData = await this.transformBTreeNodeData(data);
    return this._maybeWriteChunk(h, newData, data, btree.getRefs);
  }

  transformBTreeNodeData(data: btree.DataNode): Promise<btree.DataNode>;
  transformBTreeNodeData(data: btree.InternalNode): Promise<btree.InternalNode>;
  async transformBTreeNodeData(data: btree.Node): Promise<btree.Node> {
    const level = data[0];
    const entries = data[1];
    let newEntries: btree.Node[1];
    if (isInternalNode(data)) {
      newEntries = await this._transformBTreeInternalEntries(
        entries as btree.InternalNode[1],
      );
    } else {
      newEntries = await this._transformBTreeDataEntries(entries);
    }
    if (newEntries === entries) {
      return data;
    }

    // Changed. Need to create a new chunk.
    return [level, newEntries];
  }

  async transformBTreeDataEntry(
    entry: btree.Entry<ReadonlyJSONValue>,
  ): Promise<btree.Entry<ReadonlyJSONValue>> {
    return entry;
  }

  private async _transformBTreeDataEntries(
    entries: readonly btree.Entry<ReadonlyJSONValue>[],
  ): Promise<readonly btree.Entry<ReadonlyJSONValue>[]> {
    return this._transformArray(entries, e => this.transformBTreeDataEntry(e));
  }

  async transformBTreeInternalEntry(
    entry: btree.Entry<Hash>,
  ): Promise<btree.Entry<Hash>> {
    const hash = await this._transformBTreeNodeWithCache(entry[1]);
    if (hash === entry[1]) {
      return entry;
    }
    return [entry[0], hash];
  }

  private async _transformBTreeInternalEntries(
    entries: readonly btree.Entry<Hash>[],
  ): Promise<readonly btree.Entry<Hash>[]> {
    return this._transformArray(entries, e =>
      this.transformBTreeInternalEntry(e),
    );
  }

  private async _transformArray<T>(
    values: readonly T[],
    itemTransform: (item: T) => Promise<T>,
  ): Promise<readonly T[]> {
    const newValues = await Promise.all(values.map(itemTransform));
    for (let i = 0; i < newValues.length; i++) {
      if (values[i] !== newValues[i]) {
        return newValues;
      }
    }
    return values;
  }

  private _transformIndexRecords(
    indexes: readonly IndexRecord[],
  ): Promise<readonly IndexRecord[]> {
    return this._transformArray(indexes, i => this.transformIndexRecord(i));
  }

  async transformIndexRecord(index: IndexRecord): Promise<IndexRecord> {
    const valueHash = await this._transformBTreeNodeWithCache(index.valueHash);
    if (valueHash === index.valueHash) {
      return index;
    }
    return {
      definition: index.definition,
      valueHash,
    };
  }
}
