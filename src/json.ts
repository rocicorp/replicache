import {throwInvalidType} from './asserts.js';

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
  a: JSONValue | undefined,
  b: JSONValue | undefined,
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

  // We know b is an object here but type inference is not smart enough.
  b = b as JSONObject;

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false;
  }

  for (const key of aKeys) {
    if (!deepEqual(a[key], b[key])) {
      return false;
    }
  }
  return true;
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
  for (const val of Object.values(v)) {
    // we allow undefined values because in TypeScript there is no way to
    // express optional missing properties vs properties with the value
    // undefined.
    if (val !== undefined) {
      assertJSONValue(val);
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
