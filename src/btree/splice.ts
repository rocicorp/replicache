import type {ReadonlyEntry} from './node';

export type Splice = [at: number, removed: number, added: number, from: number];

const SPLICE_UNASSIGNED = -1;
export const SPLICE_AT = 0;
export const SPLICE_REMOVED = 1;
export const SPLICE_ADDED = 2;
export const SPLICE_FROM = 3;

const KEY = 0;
const VALUE = 1;

export function* computeSplice<T>(
  previous: readonly ReadonlyEntry<T>[],
  current: readonly ReadonlyEntry<T>[],
): Generator<Splice, void> {
  let previousIndex = 0;
  let currentIndex = 0;
  let splice: Splice | undefined;

  while (previousIndex < previous.length && currentIndex < current.length) {
    if (previous[previousIndex][KEY] === current[currentIndex][KEY]) {
      if (previous[previousIndex][VALUE] === current[currentIndex][VALUE]) {
        if (splice) {
          if (splice[SPLICE_FROM] === SPLICE_UNASSIGNED) {
            splice[SPLICE_FROM] = 0;
          }
          yield splice;
          splice = undefined;
        }
      } else {
        if (!splice) {
          splice = [currentIndex, 0, 0, SPLICE_UNASSIGNED];
        }
        splice[SPLICE_ADDED]++;
        splice[SPLICE_REMOVED]++;
        if (splice[SPLICE_FROM] === SPLICE_UNASSIGNED) {
          splice[SPLICE_FROM] = currentIndex;
        }
      }
      previousIndex++;
      currentIndex++;
    } else if (previous[previousIndex][KEY] < current[currentIndex][KEY]) {
      // previous was removed
      if (!splice) {
        splice = [previousIndex, 0, 0, SPLICE_UNASSIGNED];
      }
      splice[SPLICE_REMOVED]++;

      previousIndex++;
    } else {
      if (!splice) {
        splice = [previousIndex, 0, 0, SPLICE_UNASSIGNED];
      }
      splice[SPLICE_ADDED]++;
      if (splice[SPLICE_FROM] === SPLICE_UNASSIGNED) {
        splice[SPLICE_FROM] = currentIndex;
      }

      currentIndex++;
    }
  }

  if (currentIndex < current.length) {
    if (!splice) {
      splice = [previousIndex, 0, 0, SPLICE_UNASSIGNED];
    }
    splice[SPLICE_ADDED] += current.length - currentIndex;
    if (splice[SPLICE_FROM] === SPLICE_UNASSIGNED) {
      splice[SPLICE_FROM] = currentIndex;
    }
  }

  if (previousIndex < previous.length) {
    if (!splice) {
      splice = [previousIndex, 0, 0, SPLICE_UNASSIGNED];
    }
    splice[SPLICE_REMOVED] += previous.length - previousIndex;
  }

  if (splice) {
    if (splice[SPLICE_FROM] === SPLICE_UNASSIGNED) {
      splice[SPLICE_FROM] = 0;
    }
    yield splice;
  }
}
