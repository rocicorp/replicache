import {assertNumber} from '../asserts';
import type {Hash} from '../hash';

export type HeadChange = {
  new: Hash | undefined;
  old: Hash | undefined;
};

export type RefCountUpdates = Map<Hash, number>;
type LoadedRefCountPromises = Map<Hash, Promise<number>>;

export interface GarbageCollectionDelegate {
  getRefCount: (hash: Hash) => Promise<number>;
  getRefs: (hash: Hash) => Promise<readonly Hash[] | undefined>;
}

/**
 * Computes how ref counts should be updated when a dag write is commited.
 * Does not modify the dag store.
 * @param headChanges Heads that were changed by the dag write.
 * @param putChunks Chunks that were put by the dag write.
 * @param delegate Delegate used for loading ref information from the dag store.
 * @returns Map from chunk Hash to new ref count.  Chunks with a new ref count of 0 should
 * be deleted.  All hashes in `putChunks` will have an entry (which may be zero if the
 * newly put chunk is not reachable from any head).
 */
export async function computeRefCountUpdates(
  headChanges: Iterable<HeadChange>,
  putChunks: ReadonlySet<Hash>,
  delegate: GarbageCollectionDelegate,
): Promise<RefCountUpdates> {
  // We increment all the ref counts before we do all the decrements. This
  // is so that we do not remove an item that goes from 1 -> 0 -> 1
  const newHeads: Hash[] = [];
  const oldHeads: Hash[] = [];
  for (const changedHead of headChanges) {
    changedHead.old && oldHeads.push(changedHead.old);
    changedHead.new && newHeads.push(changedHead.new);
  }

  const refCountUpdates: RefCountUpdates = new Map();
  // This map is used to ensure we do not load the ref count key more than once.
  // Once it is loaded we only operate on a cache of the ref counts.
  const loadedRefCountPromises: LoadedRefCountPromises = new Map();

  for (const n of newHeads) {
    await changeRefCount(
      n,
      1,
      refCountUpdates,
      loadedRefCountPromises,
      delegate,
    );
  }

  for (const o of oldHeads) {
    await changeRefCount(
      o,
      -1,
      refCountUpdates,
      loadedRefCountPromises,
      delegate,
    );
  }

  // Now we go through the new chunks to see if any of them are still orphaned.
  await Promise.all(
    Array.from(putChunks.values(), hash =>
      ensureRefCountLoaded(
        hash,
        refCountUpdates,
        loadedRefCountPromises,
        delegate,
      ),
    ),
  );

  return refCountUpdates;
}

async function changeRefCount(
  hash: Hash,
  delta: number,
  refCountUpdates: RefCountUpdates,
  loadedRefCountPromises: LoadedRefCountPromises,
  delegate: GarbageCollectionDelegate,
): Promise<void> {
  // First make sure that we have the ref count in the cache. This is async
  // because it might need to load the ref count from the store (via the delegate).
  //
  // Once we have loaded the ref count all the updates to it are sync to
  // prevent race conditions.
  await ensureRefCountLoaded(
    hash,
    refCountUpdates,
    loadedRefCountPromises,
    delegate,
  );

  if (updateRefCount(hash, delta, refCountUpdates)) {
    const refs = await delegate.getRefs(hash);
    if (refs !== undefined) {
      const ps = refs.map(ref =>
        changeRefCount(
          ref,
          delta,
          refCountUpdates,
          loadedRefCountPromises,
          delegate,
        ),
      );
      await Promise.all(ps);
    }
  }
}

function ensureRefCountLoaded(
  hash: Hash,
  refCountUpdates: RefCountUpdates,
  loadedRefCountPromises: LoadedRefCountPromises,
  delegate: GarbageCollectionDelegate,
): Promise<number> {
  // Only get the ref count once.
  let p = loadedRefCountPromises.get(hash);
  if (p === undefined) {
    p = (async () => {
      const value = await delegate.getRefCount(hash);
      refCountUpdates.set(hash, value);
      return value;
    })();
    loadedRefCountPromises.set(hash, p);
  }
  return p;
}

function updateRefCount(
  hash: Hash,
  delta: number,
  refCountUpdates: RefCountUpdates,
): boolean {
  const oldCount = refCountUpdates.get(hash);
  assertNumber(oldCount);
  refCountUpdates.set(hash, oldCount + delta);
  return (oldCount === 0 && delta === 1) || (oldCount === 1 && delta === -1);
}
