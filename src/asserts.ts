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
  if (v == null) {
    // includes undefined too because `==`
    s += v;
  } else {
    s += `${typeof v} \`${v}\``;
  }
  return s + `, expected ${t}`;
}

export function throwInvalidType(v: unknown, t: string): never {
  throw new Error(invalidType(v, t));
}