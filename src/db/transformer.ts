import {assert} from '../asserts';
import {
  assertBTreeNode,
  DataNode,
  Entry,
  getRefs as getRefsFromBTreeNode,
  InternalNode,
} from '../btree/node';
import {IndexChangeMeta, Meta, MetaTyped, SnapshotMeta} from './commit';
import * as db from './mod';
import {assertCommitData} from './mod';
import {emptyHash, Hash} from '../hash';
import {Chunk} from '../dag/chunk';
import type {Write} from '../dag/write';
import type {ReadonlyJSONValue} from '../json';

export class Transformer {
  readonly write: Write;
  private readonly _transforming: Map<Hash, Promise<Hash>> = new Map();

  constructor(write: Write) {
    this.write = write;
  }

  transformCommit(h: Hash, allowWeak = false): Promise<Hash> {
    const newHash = this._transforming.get(h);
    if (newHash !== undefined) {
      return newHash;
    }

    const inner = async () => {
      const chunk = await this.write.getChunk(h);
      if (!chunk) {
        if (allowWeak) {
          return h;
        }
        throw new Error(`Chunk ${h} not found`);
      }
      const {data} = chunk;
      assertCommitData(data);

      const newCommit = await this.transformCommitData(data);
      if (newCommit === data) {
        return h;
      }

      // Changed. Need to create a new chunk.
      const newChunk = db.chunkFromCommitData(newCommit);
      await this.write.putChunk(newChunk);
      return newChunk.hash;
    };

    const promise = inner();
    this._transforming.set(h, promise);
    return promise;
  }

  async transformCommitData(data: db.CommitData): Promise<db.CommitData> {
    const meta = await this.transformCommitMeta(data.meta);
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

  transformCommitMeta(meta: Meta): Promise<Meta> {
    switch (meta.type) {
      case MetaTyped.IndexChange:
        return this.transformIndexChangeMeta(meta);

      case MetaTyped.Local:
        return this.transformLocalMeta(meta);

      case MetaTyped.Snapshot:
        return this.transformSnapshot(meta);
    }
  }

  private _transformBasisHash(
    basisHash: Hash | null,
    allowWeak: boolean,
  ): Promise<Hash> | null {
    if (basisHash !== null) {
      return this.transformCommit(basisHash, allowWeak);
    }
    return null;
  }

  async transformSnapshot(meta: SnapshotMeta): Promise<SnapshotMeta> {
    // basisHash is weak for Snapshot Commits
    const basisHash = await this._transformBasisHash(meta.basisHash, true);
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

  async transformLocalMeta(meta: db.LocalMeta): Promise<db.LocalMeta> {
    const basisHash = await this._transformBasisHash(meta.basisHash, false);
    // originalHash is weak for Local Commits
    const originalHash =
      meta.originalHash &&
      (await this.transformCommit(meta.originalHash, true));
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

  async transformIndexChangeMeta(
    meta: IndexChangeMeta,
  ): Promise<IndexChangeMeta> {
    const basisHash = await this._transformBasisHash(meta.basisHash, false);
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
    return this.transformBTreeNode(valueHash);
  }

  async transformBTreeNode(h: Hash): Promise<Hash> {
    if (h === emptyHash) {
      return h;
    }

    const newHash = this._transforming.get(h);
    if (newHash !== undefined) {
      return newHash;
    }

    const inner = async () => {
      const chunk = await this.write.getChunk(h);
      assert(chunk, `Missing chunk: ${h}`);
      const {data} = chunk;
      assertBTreeNode(data);

      const newData = await this.transformBTreeNodeData(data);
      if (data === newData) {
        return h;
      }

      // Changed. Need to create a new chunk.
      const refs = getRefsFromBTreeNode(newData);
      const newChunk = Chunk.new(newData, refs);
      await this.write.putChunk(newChunk);
      return newChunk.hash;
    };

    const promise = inner();
    this._transforming.set(h, promise);
    return promise;
  }

  transformBTreeNodeData(data: DataNode): Promise<DataNode>;
  transformBTreeNodeData(data: InternalNode): Promise<InternalNode>;
  async transformBTreeNodeData(
    data: DataNode | InternalNode,
  ): Promise<DataNode | InternalNode> {
    const level = data[0];
    const entries = data[1];
    let newEntries: (DataNode | InternalNode)[1];
    if (level === 0) {
      newEntries = await this._transformBTreeDataEntries(entries);
    } else {
      newEntries = await this._transformBTreeInternalEntries(
        entries as InternalNode[1],
      );
    }
    if (newEntries === entries) {
      return data;
    }

    // Changed. Need to create a new chunk.
    return [level, newEntries];
  }

  async transformBTreeDataEntry(
    entry: Entry<ReadonlyJSONValue>,
  ): Promise<Entry<ReadonlyJSONValue>> {
    return entry;
  }

  private async _transformBTreeDataEntries(
    entries: readonly Entry<ReadonlyJSONValue>[],
  ): Promise<readonly Entry<ReadonlyJSONValue>[]> {
    return this._transformArray(entries, this.transformBTreeDataEntry);
  }

  async transformBTreeInternalEntry(entry: Entry<Hash>): Promise<Entry<Hash>> {
    const hash = await this.transformBTreeNode(entry[1]);
    if (hash === entry[1]) {
      return entry;
    }
    return [entry[0], hash];
  }

  private async _transformBTreeInternalEntries(
    entries: readonly Entry<Hash>[],
  ): Promise<readonly Entry<Hash>[]> {
    return this._transformArray(entries, this.transformBTreeInternalEntry);
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
    indexes: readonly db.IndexRecord[],
  ): Promise<readonly db.IndexRecord[]> {
    return this._transformArray(indexes, index =>
      this.transformIndexRecord(index),
    );
  }

  async transformIndexRecord(index: db.IndexRecord): Promise<db.IndexRecord> {
    const valueHash = await this.transformBTreeNode(index.valueHash);
    if (valueHash === index.valueHash) {
      return index;
    }
    return {
      definition: index.definition,
      valueHash,
    };
  }
}
