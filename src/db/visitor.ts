import {assert} from '../asserts';
import {assertBTreeNode} from '../btree/mod';
import {
  assertCommitData,
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

    await this.visitCommitMeta(data.meta);
    await this.visitCommitValue(data.valueHash);
    await this.visitCommitIndexes(data.indexes);
  }

  async visitCommitMeta(meta: Meta): Promise<void> {
    switch (meta.type) {
      case MetaTyped.IndexChange:
        await this.visitIndexChangeMeta(meta);
        break;

      case MetaTyped.Local:
        await this.visitLocalMeta(meta);
        break;

      case MetaTyped.Snapshot:
        await this.visitSnapshot(meta);
        break;
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

  async visitIndexChangeMeta(meta: IndexChangeMeta): Promise<void> {
    await this._visitBasisHash(meta.basisHash, false);
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
    if (isInternalNode(data)) {
      await this.visitBTreeInternalNode(data);
    } else {
      await this.visitBTreeDataNode(data);
    }
  }

  async visitBTreeInternalNode(node: InternalNode): Promise<void> {
    await Promise.all(
      node[1].map(entry => this.visitBTreeNode(entry[1] as Hash)),
    );
  }

  async visitBTreeDataNode(_node: DataNode): Promise<void> {
    // empty
  }

  async visitCommitIndexes(indexes: readonly IndexRecord[]): Promise<void> {
    await Promise.all(
      indexes.map(async index => this.visitBTreeNode(index.valueHash)),
    );
  }
}
