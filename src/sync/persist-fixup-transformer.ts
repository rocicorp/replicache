import type * as kv from '../kv/mod';
import * as dag from '../dag/mod';
import type * as btree from '../btree/mod';
import type {HashType} from '../db/hash-type';
import * as db from '../db/mod';
import type {Hash} from '../hash';
import {assert} from '../asserts';

type OldHash = Hash;
type NewHash = Hash;
type Mappings = ReadonlyMap<OldHash, NewHash>;

/**
 * This transformer is used to fixup the hashes we got from the source dag (the
 * perdag in our case) and rewrite the required chunks in the destination dag
 * (the memdag).
 */
export class PersistFixupTransformer extends db.Transformer {
  private readonly _mappings: Mappings;

  constructor(dagWrite: dag.Write, mappings: Mappings) {
    super(dagWrite);
    this._mappings = mappings;
  }

  override async transformCommit(
    oldHash: OldHash,
    hashType?: HashType,
  ): Promise<NewHash> {
    const newHash = this._mappings.get(oldHash);
    if (newHash === undefined) {
      // If the hash is not in the mapping we do not need to recurse into the
      // subtree.
      return oldHash;
    }
    return super.transformCommit(oldHash, hashType);
  }

  override async transformBTreeNode(oldHash: OldHash): Promise<NewHash> {
    const newHash = this._mappings.get(oldHash);
    if (newHash === undefined) {
      // If the hash is not in the mapping we do not need to recurse into the
      // subtree.
      return oldHash;
    }
    return super.transformBTreeNode(oldHash);
  }

  override shouldForceWrite(h: OldHash): boolean {
    // If there is a mapping we need to write this chunk even if the data did
    // not change. This happens for BTree data nodes for example because the
    // hash it had in the memdag was using a temp hash but now we got a real
    // hash from the perdag.
    return this._mappings.has(h);
  }

  override async writeChunk<D extends kv.Value>(
    oldHash: OldHash,
    data: D,
    getRefs: (data: D) => readonly Hash[],
  ): Promise<Hash> {
    const newHash = this._mappings.get(oldHash);
    // We should not get here if there is no mapping.
    assert(newHash);
    const newChunk = dag.createChunkWithHash(newHash, data, getRefs(data));
    await this.dagWrite.putChunk(newChunk);
    return newHash;
  }
}
