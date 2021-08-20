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
