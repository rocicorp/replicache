import type {ReadonlyJSONObject, ReadonlyJSONValue} from '../json';

/**
 * Gives a size of a value. The size is pretty arbitrary, but it is used to
 * decide where to split the btree nodes.
 */

export function getSizeOfValue(value: ReadonlyJSONValue): number {
  // The following outlines how Chromium serializes values for structuredClone.
  // https://source.chromium.org/chromium/chromium/src/+/main:v8/src/objects/value-serializer.cc;l=102;drc=f0b6f7d12ea47ad7c08fb554f678c1e73801ca36;bpv=1;bpt=1
  // We do not need to match that exactly but it would be good to be close.
  switch (typeof value) {
    case 'string':
      return value.length;
    case 'number':
      return 8;
    case 'boolean':
      return 1;
    case 'object':
      if (value === null) {
        return 1;
      }
      if (Array.isArray(value)) {
        return (
          value.reduce((a, v) => a + getSizeOfValue(v), 0) +
          getSizeOfValue(value.length)
        );
      }
      {
        const val = value as ReadonlyJSONObject;
        const keys = Object.keys(val);
        let sum = getSizeOfValue(keys.length);
        for (const k of Object.keys(val)) {
          sum += getSizeOfValue(k);
          const v = val[k];
          if (v !== undefined) {
            sum += getSizeOfValue(v);
          }
        }
        return sum;
      }
  }

  throw new Error('invalid value');
}
