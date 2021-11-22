import * as db from '../db/mod';
import type * as dag from '../dag/mod';
import type {Hash} from '../hash';
import type {HashType} from '../db/hash-type';

export type GatheredChunks = ReadonlyMap<Hash, dag.Chunk>;

export class PersistWriteTransformer extends db.Transformer {
  private readonly _gatheredChunks: GatheredChunks;

  constructor(dagWrite: dag.Write, gatheredChunks: GatheredChunks) {
    super(dagWrite);
    this._gatheredChunks = gatheredChunks;
  }

  protected override shouldForceWrite(h: Hash): boolean {
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
    if (this._gatheredChunks.has(hash)) {
      return super.transformCommit(hash, hashType);
    }
    return hash;
  }

  override async transformBTreeNode(hash: Hash): Promise<Hash> {
    if (this._gatheredChunks.has(hash)) {
      return super.transformBTreeNode(hash);
    }
    return hash;
  }
}
