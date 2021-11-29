import * as db from '../db/mod';
import type * as dag from '../dag/mod';
import type {Hash} from '../hash';
import {assert} from '../asserts';

export type GatheredChunks = ReadonlyMap<Hash, dag.Chunk>;

/**
 * This transformer is used to persist chunks coming from a source dag (aka
 * memdag) to a destination dag (aka perdag). The source chunks are passed into
 * the constructor and are also called the gathered chunks becasue they were
 * gathered on the source dag in a previous pass.
 */
export class PersistWriteTransformer<
  Tx = dag.Write,
> extends db.Transformer<Tx> {
  private readonly _gatheredChunks: GatheredChunks;

  /**
   * @param dagWrite The destination dag.
   * @param gatheredChunks The chunks that were gathered on the source dag in
   * a previous pass.
   */
  constructor(dagWrite: Tx, gatheredChunks: GatheredChunks) {
    super(dagWrite);
    this._gatheredChunks = gatheredChunks;
  }

  override shouldSkip(hash: Hash): boolean {
    // Skip all chunks that we did not get from the source.
    return !this._gatheredChunks.has(hash);
  }

  protected override shouldForceWrite(h: Hash): boolean {
    // We want to write the chunk to the destination dag even if the chunk did
    // not change because the computed hash on the source is different than the
    // one computed on the destination.
    return this._gatheredChunks.has(h);
  }

  protected override async getChunk(
    hash: Hash,
  ): Promise<dag.Chunk | undefined> {
    const gatheredChunk = this._gatheredChunks.get(hash);
    // We cannot get here is we did not gather a chunk for this hash.
    assert(gatheredChunk !== undefined);
    return gatheredChunk;
  }
}
