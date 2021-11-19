type Truthy<T> = T extends null | undefined | false | '' | 0 ? never : T;

export function assert<T>(
  b: T,
  msg = 'Assertion failed',
): asserts b is Truthy<T> {
  if (!b) {
    throw new Error(msg);
  }
}

export function assertString(v: unknown): asserts v is string {
  assertType(v, 'string');
}

export function assertNumber(v: unknown): asserts v is number {
  assertType(v, 'number');
}

function assertType(v: unknown, t: string) {
  if (typeof v !== t) {
    throwInvalidType(v, t);
  }
}

export function assertObject(v: unknown): asserts v is Record<string, unknown> {
  if (v === null) {
    throwInvalidType(v, 'object');
  }
  assertType(v, 'object');
}

export function assertArray(v: unknown): asserts v is unknown[] {
  if (!Array.isArray(v)) {
    throwInvalidType(v, 'array');
  }
}

export function invalidType(v: unknown, t: string): string {
  let s = 'Invalid type: ';
  if (v === null || v === undefined) {
    s += v;
  } else {
    s += `${typeof v} \`${v}\``;
  }
  return s + `, expected ${t}`;
}

export function throwInvalidType(v: unknown, t: string): never {
  throw new Error(invalidType(v, t));
}

export function assertNotNull<T>(v: T | null): asserts v is T {
  if (v === null) {
    throw new Error('Expected non-null value');
  }
}

export function assertNotUndefined<T>(v: T | undefined): asserts v is T {
  if (v === undefined) {
    throw new Error('Expected non undefined value');
  }
}

export function assertInstanceof<T>(
  v: unknown,
  t: new (...args: unknown[]) => T,
): asserts v is T {
  if (!(v instanceof t)) {
    throw new Error(`Expected instanceof ${t.name}`);
  }
}

export function assertUint8Array(v: unknown): asserts v is Uint8Array {
  assertInstanceof(v, Uint8Array);
}
