import {assert} from './asserts.js';
import type {Diff, DiffOperation} from './btree/node.js';
import type {Hash} from './hash.js';
import type {DiffsMap} from './sync/pull.js';

/**
 * Function that gets passed into [[Replicache.watch]] and gets called when the
 * data in Replicache changes.
 */
export type WatchCallback = (
  diff: Diff,
  oldRootHash: string,
  newRootHash: string,
) => void;

export type WatchCallbackEntry = {cb: WatchCallback; prefix: string};

/**
 * Options for [[watch]].
 */
export interface WatchOptions {
  /**
   * When provided, the watch is limited to changes where the key starts with prefix.
   */
  prefix?: string;
}

/**
 * This manages the watch function of Replicache.
 */
export class Watcher {
  private readonly _callbacks: Set<WatchCallbackEntry> = new Set();

  add(cb: WatchCallback, options?: WatchOptions) {
    const entry: WatchCallbackEntry = {cb, prefix: options?.prefix ?? ''};
    this._callbacks.add(entry);
    return () => {
      this._callbacks.delete(entry);
    };
  }

  fire(diffs: DiffsMap, oldRoot: Hash | undefined, newRoot: Hash): void {
    const diff = diffs.get('');
    if (!diff) {
      return;
    }

    const matching = findMatchingWatchers(diff, this._callbacks);

    // oldRoot is undefined before we have any diffs but as soon as we have a
    // diff it must have been diffed with something.
    assert(oldRoot);

    for (const entry of matching) {
      if (entry[1].length > 0) {
        entry[0].cb(
          entry[1],
          oldRoot as unknown as string,
          newRoot as unknown as string,
        );
      }
    }
  }
}

export function findMatchingWatchers(
  diff: Diff,
  callbacks: Iterable<WatchCallbackEntry>,
): Map<WatchCallbackEntry, Diff> {
  // We keep track of potential matching watchers. As we find matching watchers
  // we remove the watcher from this set. When this set becomes empty we can
  // stop looking.
  const potentialWatchers = new Set(callbacks);

  const foundMatchingWatchers = new Map<WatchCallbackEntry, DiffOperation[]>();

  for (const entry of callbacks) {
    if (entry.prefix === '') {
      // Will have the same diff.
      foundMatchingWatchers.set(entry, diff as DiffOperation[]);
      potentialWatchers.delete(entry);
    } else {
      // We will build up the diff later.
      foundMatchingWatchers.set(entry, []);
    }
  }

  for (const op of diff) {
    for (const entry of potentialWatchers) {
      if (op.key.startsWith(entry.prefix)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        foundMatchingWatchers.get(entry)!.push(op);
      } else if (op.key > entry.prefix) {
        potentialWatchers.delete(entry);
        if (potentialWatchers.size === 0) {
          return foundMatchingWatchers;
        }
      }
    }
  }

  return foundMatchingWatchers;
}
