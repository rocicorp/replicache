import {asyncIterableToArray} from '../async-iterable-to-array.js';
import type {DiffOperation} from './node.js';
import type {BTreeRead} from './read';

export async function diff(
  oldMap: BTreeRead,
  newMap: BTreeRead,
): Promise<DiffOperation[]> {
  // Return an array to ensure we do not compute the diff more than once.
  return asyncIterableToArray(newMap.diff(oldMap));
}
