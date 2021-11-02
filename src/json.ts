import {throwInvalidType} from './asserts';
import {hasOwn} from './has-own';

/** The values that can be represented in JSON */
export type JSONValue =
  | null
  | string
  | boolean
  | number
  | Array<JSONValue>
  | JSONObject;

/**
 * A JSON object. We allow undefined values because in TypeScript there is no
 * way to express optional missing properties vs properties with the value
 * `undefined`.
 */
export type JSONObject = Partial<{[key: string]: JSONValue}>;

/** Like [[JSONValue]] but deeply readonly */
export type ReadonlyJSONValue =
  | null
  | string
  | boolean
  | number
  | ReadonlyArray<ReadonlyJSONValue>
  | ReadonlyJSONObject;

/** Like [[JSONObject]] but deeply readonly */
export type ReadonlyJSONObject = Partial<{
  readonly [key: string]: ReadonlyJSONValue;
}>;

/**
 * Checks deep equality of two JSON value with (almost) same semantics as
 * `JSON.stringify`. The only difference is that with `JSON.stringify` the
 * ordering of the properties in an object/map/dictionary matters. In
 * [[deepEqual]] the following two values are consider equal, even though the
 * strings JSON.stringify would produce is different:
 *
 * ```js
 * assert(deepEqual(t({a: 1, b: 2}, {b: 2, a: 1}))
 * ```
 */
export function deepEqual(
  a: ReadonlyJSONValue | undefined,
  b: ReadonlyJSONValue | undefined,
): boolean {
  if (a === b) {
    return true;
  }

  if (typeof a !== typeof b) {
    return false;
  }

  switch (typeof a) {
    case 'boolean':
    case 'number':
    case 'string':
      return false;
  }

  // a cannot be undefined here because either a and b are undefined or their
  // types are different.
  //eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
  a = a!;

  // 'object'
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) {
      return false;
    }
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  if (a === null || b === null) {
    return false;
  }

  if (Array.isArray(b)) {
    return false;
  }

  // We know a and b are objects here but type inference is not smart enough.
  a = a as ReadonlyJSONObject;
  b = b as ReadonlyJSONObject;

  // We use for-in loops instead of for of Object.keys() to make sure deepEquals
  // does not allocate any objects.

  let aSize = 0;
  for (const key in a) {
    if (hasOwn(a, key)) {
      if (!deepEqual(a[key], b[key])) {
        return false;
      }
      aSize++;
    }
  }

  let bSize = 0;
  for (const key in b) {
    if (hasOwn(b, key)) {
      bSize++;
    }
  }

  return aSize === bSize;
}

export function deepClone(value: ReadonlyJSONValue): JSONValue {
  const seen: Array<ReadonlyJSONObject | ReadonlyArray<ReadonlyJSONValue>> = [];
  return internalDeepClone(value, seen);
}

export function internalDeepClone(
  value: ReadonlyJSONValue,
  seen: Array<ReadonlyJSONObject | ReadonlyArray<ReadonlyJSONValue>>,
): JSONValue {
  switch (typeof value) {
    case 'boolean':
    case 'number':
    case 'string':
    case 'undefined':
      return value;
    case 'object': {
      if (value === null) {
        return null;
      }
      if (seen.includes(value)) {
        throw new Error('Cyclic object');
      }
      seen.push(value);
      if (Array.isArray(value)) {
        const rv = value.map(v => internalDeepClone(v, seen));
        seen.pop();
        return rv;
      }

      const obj: JSONObject = {};

      for (const k in value) {
        if (hasOwn(value, k)) {
          const v = (value as ReadonlyJSONObject)[k];
          if (v !== undefined) {
            obj[k] = internalDeepClone(v, seen);
          }
        }
      }
      seen.pop();
      return obj;
    }

    default:
      throw new Error(`Invalid type: ${typeof value}`);
  }
}

export function assertJSONValue(v: unknown): asserts v is JSONValue {
  switch (typeof v) {
    case 'boolean':
    case 'number':
    case 'string':
      return;
    case 'object':
      if (v === null) {
        return;
      }
      if (Array.isArray(v)) {
        return assertJSONArray(v);
      }
      return assertJSONObject(v as Record<string, unknown>);
  }
  throwInvalidType(v, 'JSON value');
}

function assertJSONObject(v: Record<string, unknown>): asserts v is JSONObject {
  for (const k in v) {
    if (hasOwn(v, k)) {
      const val = v[k];
      // we allow undefined values because in TypeScript there is no way to
      // express optional missing properties vs properties with the value
      // undefined.
      if (val !== undefined) {
        assertJSONValue(v[k]);
      }
    }
  }
}
function assertJSONArray(v: unknown[]): asserts v is JSONValue[] {
  for (let i = 0; i < v.length; i++) {
    const val = v[i];
    if (val !== undefined) {
      assertJSONValue(val);
    }
  }
}
