import type {Hash} from '../hash';

export type HeadChange = {
  new: Hash | undefined;
  old: Hash | undefined;
};

export class GarbargeCollector {
  private readonly _setRefCount: (hash: Hash, count: number) => Promise<void>;
  private readonly _getRefCount: (hash: Hash) => Promise<number>;
  private readonly _deleteChunk: (hash: Hash) => Promise<void>;
  private readonly _getRefs: (
    hash: Hash,
  ) => Promise<readonly Hash[] | undefined>;

  constructor(
    setRefCount: (hash: Hash, count: number) => Promise<void>,
    getRefCount: (hash: Hash) => Promise<number>,
    deleteChunk: (hash: Hash) => Promise<void>,
    getRefs: (hash: Hash) => Promise<readonly Hash[] | undefined>,
  ) {
    this._setRefCount = setRefCount;
    this._getRefCount = getRefCount;
    this._deleteChunk = deleteChunk;
    this._getRefs = getRefs;
  }

  async collect(
    headChanges: Iterable<HeadChange>,
    newChunks: ReadonlySet<Hash>,
  ): Promise<void> {
    const mutableNewChunks = new Set(newChunks);
    // We increment all the ref counts before we do all the decrements. This
    // is so that we do not remove an item that goes from 1 -> 0 -> 1
    const newHeads: (Hash | undefined)[] = [];
    const oldHeads: (Hash | undefined)[] = [];
    for (const headChange of headChanges) {
      oldHeads.push(headChange.old);
      newHeads.push(headChange.new);
    }

    for (const n of newHeads) {
      if (n !== undefined) {
        await this.changeRefCount(n, 1, mutableNewChunks);
      }
    }

    for (const o of oldHeads) {
      if (o !== undefined) {
        await this.changeRefCount(o, -1, mutableNewChunks);
      }
    }

    // Now we go through the mutated chunks to see if any of them are still orphaned.
    const ps = [];
    for (const hash of newChunks) {
      const count = await this._getRefCount(hash);
      if (count === 0) {
        ps.push(this._deleteChunk(hash));
      }
    }
    await Promise.all(ps);
  }

  async changeRefCount(
    hash: Hash,
    delta: number,
    mutableNewChunks: Set<Hash>,
  ): Promise<void> {
    const oldCount = await this._getRefCount(hash);
    const newCount = oldCount + delta;

    if ((oldCount === 0 && delta === 1) || (oldCount === 1 && delta === -1)) {
      const refs = await this._getRefs(hash);
      if (refs !== undefined) {
        const ps = refs.map(ref =>
          this.changeRefCount(ref, delta, mutableNewChunks),
        );
        await Promise.all(ps);
      }
    }

    if (newCount === 0) {
      await this._deleteChunk(hash);
      mutableNewChunks.delete(hash);
    } else {
      await this._setRefCount(hash, newCount);
    }
  }
}
