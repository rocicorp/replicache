import type {IHasher} from 'hash-wasm/dist/lib/WASMInterface';
import type {ReadonlyJSONObject, ReadonlyJSONValue} from './json';
import * as utf8 from './utf8';

const trueTag = new Uint8Array([1]);
const falseTag = new Uint8Array([2]);
const nullTag = new Uint8Array([3]);
const stringTag = new Uint8Array([4]);
const numberTag = new Uint8Array([5]);
const arrayTag = new Uint8Array([6]);
const objectTag = new Uint8Array([7]);

const float64Array = new Float64Array(1);
const float64View = new Uint8Array(float64Array.buffer);

const uint32Array = new Uint32Array(1);

export function hashJSON(value: ReadonlyJSONValue, hasher: IHasher): void {
  switch (typeof value) {
    case 'boolean':
      hasher.update(value ? trueTag : falseTag);
      break;
    case 'number':
      updateNumber(value, hasher);
      break;
    case 'string':
      updateString(value, hasher);
      break;

    case 'object': {
      if (value === null) {
        hasher.update(nullTag);
        break;
      }
      if (Array.isArray(value)) {
        updateArray(value, hasher);
        break;
      }

      updateObject(value as ReadonlyJSONObject, hasher);
      break;
    }

    default:
      throw new Error(`Invalid type: ${typeof value}`);
  }
}

function updateNumber(n: number, hasher: IHasher) {
  hasher.update(numberTag);
  float64Array[0] = n;
  hasher.update(float64View);
}

function updateUint32(n: number, hasher: IHasher) {
  uint32Array[0] = n;
  hasher.update(uint32Array);
}

function updateString(s: string, hasher: IHasher) {
  hasher.update(stringTag);
  updateUint32(s.length, hasher);
  const bytes = utf8.encode(s);
  hasher.update(bytes);
}

function updateArray(value: ReadonlyJSONValue[], hasher: IHasher) {
  hasher.update(arrayTag);
  updateUint32(value.length, hasher);
  for (const v of value) {
    hashJSON(v, hasher);
  }
}

function updateObject(value: ReadonlyJSONObject, hasher: IHasher) {
  hasher.update(objectTag);
  const keys = Object.keys(value);
  updateUint32(keys.length, hasher);
  for (const key of keys) {
    const v = value[key];
    if (v !== undefined) {
      updateString(key, hasher);
      hashJSON(v, hasher);
    }
  }
}
