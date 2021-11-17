import * as db from '../db/mod';
import {Hash, isTempHash} from '../hash';
import type * as dag from '../dag/mod';
import type * as btree from '../btree/mod';
import type {ReadonlyJSONValue} from '../json';

export class PersistGatherVisitor extends db.Visitor {
  private readonly _gatheredChunks: Map<Hash, dag.Chunk> = new Map();

  get gatheredChunks(): ReadonlyMap<Hash, dag.Chunk> {
    return this._gatheredChunks;
  }

  override async visitCommitChunk(
    chunk: dag.Chunk<db.CommitData>,
  ): Promise<void> {
    if (this._visitChunk(chunk)) {
      // Recurse down the tree
      return super.visitCommitChunk(chunk);
    }
    // Not a temp hash, no need to visit anything else.
  }

  override async visitBTreeNodeChunk(
    chunk: dag.Chunk<btree.Node>,
  ): Promise<void> {
    if (this._visitChunk(chunk)) {
      return super.visitBTreeNodeChunk(chunk);
    }
  }

  private _visitChunk(chunk: dag.Chunk<ReadonlyJSONValue>): boolean {
    if (isTempHash(chunk.hash)) {
      // If this is a temp hash, then this is a chunk that has not yet been persisted.
      this._gatheredChunks.set(chunk.hash, chunk);
      return true;
    }
    return false;
  }
}
