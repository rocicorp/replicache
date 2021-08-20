export function* takeWhile<T>(
  fn: (item: T) => boolean,
  it: Iterable<T>,
): Generator<T> {
  for (const item of it) {
    if (fn(item)) {
      yield item;
    } else {
      break;
    }
  }
}

export function* take<T>(count: number, it: Iterable<T>): Generator<T> {
  for (const item of it) {
    if (count <= 0) {
      break;
    }
    yield item;
    --count;
  }
}
