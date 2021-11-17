import {assert} from '../asserts';
import {assertBTreeNode} from '../btree/mod';
import {
  assertCommitData,
  CommitData,
  IndexChangeMeta,
  IndexRecord,
  LocalMeta,
  Meta,
  MetaTyped,
  SnapshotMeta,
} from './commit';
import type * as dag from '../dag/mod';
import {emptyHash, Hash} from '../hash';
import {DataNode, InternalNode, isInternalNode} from '../btree/node';

export class Visitor {
  readonly dagRead: dag.Read;
  private _visitedHashes: Set<Hash> = new Set();

  constructor(dagRead: dag.Read) {
    this.dagRead = dagRead;
  }

  async visitCommit(h: Hash, allowWeak = false): Promise<void> {
    if (this._visitedHashes.has(h)) {
      return;
    }
    this._visitedHashes.add(h);

    const chunk = await this.dagRead.getChunk(h);
    if (!chunk) {
      if (allowWeak) {
        return;
      }
      throw new Error(`Chunk ${h} not found`);
    }

    const {data} = chunk;
    assertCommitData(data);
    await this.visitCommitChunk(chunk as dag.Chunk<CommitData>);
  }

  async visitCommitChunk(chunk: dag.Chunk<CommitData>): Promise<void> {
    const {data} = chunk;
    await Promise.all([
      this.visitCommitMeta(data.meta),
      this.visitCommitValue(data.valueHash),
      this.visitCommitIndexes(data.indexes),
    ]);
  }

  visitCommitMeta(meta: Meta): Promise<void> {
    switch (meta.type) {
      case MetaTyped.IndexChange:
        return this.visitIndexChangeMeta(meta);

      case MetaTyped.Local:
        return this.visitLocalMeta(meta);

      case MetaTyped.Snapshot:
        return this.visitSnapshot(meta);
    }
  }

  private async _visitBasisHash(
    basisHash: Hash | null,
    allowWeak: boolean,
  ): Promise<void> {
    if (basisHash !== null) {
      await this.visitCommit(basisHash, allowWeak);
    }
  }

  async visitSnapshot(meta: SnapshotMeta): Promise<void> {
    // basisHash is weak for Snapshot Commits
    await this._visitBasisHash(meta.basisHash, true);
  }

  async visitLocalMeta(meta: LocalMeta): Promise<void> {
    await this._visitBasisHash(meta.basisHash, false);
    if (meta.originalHash !== null) {
      await this.visitCommit(meta.originalHash, false);
    }
  }

  visitIndexChangeMeta(meta: IndexChangeMeta): Promise<void> {
    return this._visitBasisHash(meta.basisHash, false);
  }

  visitCommitValue(valueHash: Hash): Promise<void> {
    return this.visitBTreeNode(valueHash);
  }

  async visitBTreeNode(h: Hash): Promise<void> {
    // we use the emptyHash for an empty btree
    if (h === emptyHash) {
      return;
    }

    if (this._visitedHashes.has(h)) {
      return;
    }
    this._visitedHashes.add(h);

    const chunk = await this.dagRead.getChunk(h);
    assert(chunk);
    const {data} = chunk;
    assertBTreeNode(data);

    await this.visitBTreeNodeChunk(chunk as dag.Chunk<InternalNode | DataNode>);
  }

  async visitBTreeNodeChunk(
    chunk: dag.Chunk<InternalNode | DataNode>,
  ): Promise<void> {
    const {data} = chunk;
    if (isInternalNode(data)) {
      await this.visitBTreeInternalNode(chunk as dag.Chunk<InternalNode>);
    } else {
      await this.visitBTreeDataNode(chunk as dag.Chunk<DataNode>);
    }
  }

  async visitBTreeInternalNode(chunk: dag.Chunk<InternalNode>): Promise<void> {
    const {data} = chunk;
    await Promise.all(
      data[1].map(entry => this.visitBTreeNode(entry[1] as Hash)),
    );
  }

  async visitBTreeDataNode(_chunk: dag.Chunk<DataNode>): Promise<void> {
    // empty
  }

  async visitCommitIndexes(indexes: readonly IndexRecord[]): Promise<void> {
    await Promise.all(
      indexes.map(async index => this.visitBTreeNode(index.valueHash)),
    );
  }
}
