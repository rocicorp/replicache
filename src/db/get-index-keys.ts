import type {ReadonlyJSONValue} from '../json';
import {evaluateJSONPointer} from './evaluate-json-pointer';
import {encodeIndexKey} from './index-key.js';

/**
 *  Gets the set of index keys for a given primary key and value.
 */
export function getIndexKeys(
  primary: string,
  value: ReadonlyJSONValue,
  jsonPointer: string,
): string[] {
  const target = evaluateJSONPointer(value, jsonPointer);
  if (target === undefined) {
    throw new Error(`No value at path: ${jsonPointer}`);
  }

  function encode(secondary: unknown) {
    if (typeof secondary !== 'string') {
      throw new Error('Unsupported target type');
    }
    return encodeIndexKey([secondary, primary]);
  }

  if (Array.isArray(target)) {
    return target.map(encode);
  }
  return [encode(target)];
}
