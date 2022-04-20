import {asyncIterableToArray} from '../async-iterable-to-array.js';
import type {ReadonlyJSONValue} from '../json.js';
import type {DiffResult} from './node.js';
import type {BTreeRead} from './read';

export async function diff(
  oldMap: BTreeRead,
  newMap: BTreeRead,
): Promise<DiffResult<ReadonlyJSONValue>[]> {
  // TODO(arv): Consider returning the AsyncIterator instead of arrays
  // TODO(arv): Is this file needed?
  return asyncIterableToArray(newMap.diff(oldMap));
}
