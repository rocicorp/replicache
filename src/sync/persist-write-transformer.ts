import * as db from '../db/mod';
import type * as dag from '../dag/mod';
import type {Hash} from '../hash';
import type {HashType} from '../db/hash-type';

export type GatheredChunks = ReadonlyMap<Hash, dag.Chunk>;

/**
 * This transformer is used to persist chunks coming from a source dag (aka
 * memdag) to a destination dag (aka perdag). The source chunks are passed into
 * the constructor and are also called the gathered chunks becasue they were
 * gathered on the source dag in a previous pass.
 */
export class PersistWriteTransformer extends db.Transformer {
  private readonly _gatheredChunks: GatheredChunks;

  /**
   * @param dagWrite The destination dag.
   * @param gatheredChunks The chunks that were gathered on the source dag in
   * a previous pass.
   */
  constructor(dagWrite: dag.Write, gatheredChunks: GatheredChunks) {
    super(dagWrite);
    this._gatheredChunks = gatheredChunks;
  }

  protected override shouldForceWrite(h: Hash): boolean {
    // We want to write the chunk to the destination dag even if the chunk did
    // not change because the computed hash on the source is different than the
    // one computed on the destination.
    return this._gatheredChunks.has(h);
  }

  protected override getChunk(hash: Hash): Promise<dag.Chunk | undefined> {
    const gatheredChunk = this._gatheredChunks.get(hash);
    return gatheredChunk
      ? Promise.resolve(gatheredChunk)
      : super.getChunk(hash);
  }

  override async transformCommit(
    hash: Hash,
    hashType?: HashType,
  ): Promise<Hash> {
    // Override to only transform the dag nodes we got from the source.
    if (this._gatheredChunks.has(hash)) {
      return super.transformCommit(hash, hashType);
    }
    return hash;
  }

  override async transformBTreeNode(hash: Hash): Promise<Hash> {
    // Override to only transform the dag nodes we got from the source.
    if (this._gatheredChunks.has(hash)) {
      return super.transformBTreeNode(hash);
    }
    return hash;
  }
}
