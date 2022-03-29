import type {LogContext} from '@rocicorp/logger';
import type {ReadonlyJSONValue} from '../json';
import type {BTreeWrite} from '../btree/mod';
import {getIndexKeys} from './get-index-keys';
import {IndexOperation} from './index-operation';

// Index or de-index a single primary entry.

export async function indexValue(
  lc: LogContext,
  index: BTreeWrite,
  op: IndexOperation,
  key: string,
  val: ReadonlyJSONValue,
  jsonPointer: string,
): Promise<void> {
  try {
    for (const entry of getIndexKeys(key, val, jsonPointer)) {
      switch (op) {
        case IndexOperation.Add:
          await index.put(entry, val);
          break;
        case IndexOperation.Remove:
          await index.del(entry);
          break;
      }
    }
  } catch (e) {
    // Right now all the errors that index_value() returns are customers dev
    // problems: either the value is not json, the pointer is into nowhere, etc.
    // So we ignore them.
    lc.info?.('Not indexing value', val, ':', e);
  }
}
