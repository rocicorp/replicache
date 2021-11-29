import * as dag from '../dag/mod';
import type {Hash} from '../hash';
import type {Value} from '../kv/mod';
import type {MaybePromise} from '../replicache';
import {WriteTransformer} from './write-transformer';

export type GatheredChunks = ReadonlyMap<Hash, dag.Chunk>;
export type FixedChunks = ReadonlyMap<Hash, dag.Chunk>;

/**
 * This transformer computes the hashes
 */
export class ComputeHashTransformer extends WriteTransformer<null> {
  private readonly _fixedChunks: Map<Hash, dag.Chunk> = new Map();
  private readonly _hashFunc: (value: Value) => MaybePromise<Hash>;

  /**
   * @param dagWrite The destination dag.
   * @param gatheredChunks The chunks that were gathered on the source dag in
   * a previous pass.
   */
  constructor(
    gatheredChunks: GatheredChunks,
    hashFunc: (value: Value) => MaybePromise<Hash>,
  ) {
    super(null, gatheredChunks);
    this._hashFunc = hashFunc;
  }

  get fixedChunks(): FixedChunks {
    return this._fixedChunks;
  }

  protected override async writeChunk<D extends Value>(
    _h: Hash,
    data: D,
    getRefs: (data: D) => readonly Hash[],
  ): Promise<Hash> {
    const hash = await this._hashFunc(data);
    const chunk = dag.createChunkWithHash(hash, data, getRefs(data));
    this._fixedChunks.set(hash, chunk);
    return hash;
  }
}
