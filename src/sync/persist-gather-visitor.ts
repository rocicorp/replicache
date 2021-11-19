import * as db from '../db/mod';
import {Hash, isTempHash} from '../hash';
import type * as dag from '../dag/mod';
import type * as btree from '../btree/mod';
import type {HashType} from '../db/visitor';

export class PersistGatherVisitor extends db.Visitor {
  private readonly _gatheredChunks: Map<Hash, dag.Chunk> = new Map();

  get gatheredChunks(): ReadonlyMap<Hash, dag.Chunk> {
    return this._gatheredChunks;
  }

  override async visitCommit(h: Hash, hashType?: HashType): Promise<void> {
    if (!isTempHash(h)) {
      // Not a temp hash, no need to visit anything else.
      return;
    }
    return super.visitCommit(h, hashType);
  }

  override async visitCommitChunk(
    chunk: dag.Chunk<db.CommitData>,
  ): Promise<void> {
    this._gatheredChunks.set(chunk.hash, chunk);
    return super.visitCommitChunk(chunk);
  }

  override async visitBTreeNode(h: Hash): Promise<void> {
    if (!isTempHash(h)) {
      // Not a temp hash, no need to visit anything else.
      return;
    }

    return super.visitBTreeNode(h);
  }

  override async visitBTreeNodeChunk(
    chunk: dag.Chunk<btree.Node>,
  ): Promise<void> {
    this._gatheredChunks.set(chunk.hash, chunk);
    return super.visitBTreeNodeChunk(chunk);
  }
}
