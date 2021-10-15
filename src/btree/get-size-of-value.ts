import {size} from 'lodash';
import type {ReadonlyJSONObject, ReadonlyJSONValue} from '../json';

const SIZE_TAG = 1;
const SIZE_UINT32 = 4;
const SIZE_DOUBLE = 8;

const SMI_ONE_BYTE = 128; // 2 ** 7
const SMI_TWO_BYTES = 16384; // 2 ** 14
const SMI_THREE_BYTES = 2097152; // 2 ** 21
const SMI_FOUR_BYTES = 268435456; // 2 ** 28

/**
 * Gives a size of a value. The size is modelled after the size used by
 * Chromium/V8's structuredClone algorithm. It does not match exactly so the
 * size is just an approximation.
 *
 *  https://source.chromium.org/chromium/chromium/src/+/main:v8/src/objects/value-serializer.cc;l=102;drc=f0b6f7d12ea47ad7c08fb554f678c1e73801ca36;bpv=1;bpt=1
 */
export function getSizeOfValue(value: ReadonlyJSONValue): number {
  switch (typeof value) {
    case 'string':
      // Assumes all strings are one byte strings. V8 writes OneByteString and
      // TwoByteString. We could check the string but it would require iterating
      // over all the characters.
      return SIZE_TAG + sizeOfVarInt(value.length) + value.length;
    case 'number':
      if (isSmi(value)) {
        if (value <= -(2 ** 30) || value >= 2 ** 30 - 1) {
          return SIZE_TAG + 5;
        }
        return SIZE_TAG + sizeOfVarInt(zigZagEncode(value));
      }
      return SIZE_TAG + SIZE_DOUBLE;
    case 'boolean':
      return SIZE_TAG;
    case 'object':
      if (value === null) {
        return SIZE_TAG;
      }

      if (Array.isArray(value)) {
        return (
          SIZE_TAG +
          sizeOfVarInt(value.length) +
          value.reduce((a, v) => a + getSizeOfValue(v), 0) +
          SIZE_TAG
        );
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
        return sum + sizeOfVarInt(keys.length) + SIZE_TAG;
      }
  }

  throw new Error('invalid value');
}

export function zigZagEncode(n: number): number {
  // Assumes this is not called with non smis
  return (n << 1) ^ (n >> 31);
}

export function sizeOfVarInt(n: number): number {
  if (n >= 1 << 28) {
    return 5;
  }

  for (let i = 1; i < 5; i++) {
    if (n < 1 << (7 * i)) {
      return i;
    }
  }

  throw new Error('unreachable');
}

function isSmi(value: number): boolean {
  return value === (value | 0);
}
