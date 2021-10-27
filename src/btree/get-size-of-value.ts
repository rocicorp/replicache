import type {ReadonlyJSONObject, ReadonlyJSONValue} from '../json';
import type {Entry} from './node';

const SIZE_TAG = 1;
const SIZE_INT32 = 4;
const SIZE_DOUBLE = 8;

/**
 * Gives a size of a value. The size is modelled after the size used by
 * Chromium/V8's structuredClone algorithm. It does not match exactly so the
 * size is just an approximation.
 * https://source.chromium.org/chromium/chromium/src/+/main:v8/src/objects/value-serializer.cc;l=102;drc=f0b6f7d12ea47ad7c08fb554f678c1e73801ca36;bpv=1;bpt=1
 * For example we follow JSC/Mozilla for ints and skip the varint encoding.
 *
 * Mozilla does things similarly. Main difference is that there is no varint
 * encoding and every value uses multiples of 64bits
 * https://searchfox.org/mozilla-central/source/js/src/vm/StructuredClone.cpp#94
 *
 * And JSC:
 * https://github.com/WebKit/WebKit/blob/main/Source/WebCore/bindings/js/SerializedScriptValue.cpp#L356
 * - Use 1 byte tag
 * - Numbers are either stored as Int32 or Float6
 */
export function getSizeOfValue(value: ReadonlyJSONValue): number {
  switch (typeof value) {
    case 'string':
      // Assumes all strings are one byte strings. V8 writes OneByteString and
      // TwoByteString. We could check the string but it would require iterating
      // over all the characters.
      return SIZE_TAG + SIZE_INT32 + value.length;
    case 'number':
      if (isSmi(value)) {
        if (value <= -(2 ** 30) || value >= 2 ** 30 - 1) {
          return SIZE_TAG + 5;
        }
        return SIZE_TAG + SIZE_INT32;
      }
      return SIZE_TAG + SIZE_DOUBLE;
    case 'boolean':
      return SIZE_TAG;
    case 'object':
      if (value === null) {
        return SIZE_TAG;
      }

      if (Array.isArray(value)) {
        let sum = 2 * SIZE_TAG + SIZE_INT32;
        for (const element of value) {
          sum += getSizeOfValue(element);
        }
        return sum;
      }

      {
        const val = value as ReadonlyJSONObject;
        let sum: number = SIZE_TAG;
        const keys = Object.keys(val);
        for (const k of keys) {
          const v = val[k];
          if (v !== undefined) {
            sum += getSizeOfValue(k) + getSizeOfValue(v);
          }
        }
        return sum + SIZE_INT32 + SIZE_TAG;
      }
  }

  throw new Error('invalid value');
}

function isSmi(value: number): boolean {
  return value === (value | 0);
}

export function getSizeOfNode(
  entries: Entry<string>[] | Entry<ReadonlyJSONValue>[],
): number {
  // See object above

  return NODE_HEADER_SIZE + getSizeOfValue(entries);
}

/**
 * The size of the header of a node. (If we had compile time
 * constants we would have used that).
 *
 * There is a test ensuring this is correct.
 */
export const NODE_HEADER_SIZE = 11;
