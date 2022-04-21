/**
 * Merges an iterable on top of another iterable.
 *
 * The second iterable can support the concept of delete entries (tombstones)
 * and if the value of the second iterable is a delete value then the value is
 * not included in the resulting iterable.
 */
export async function* mergeAsyncIterables<A, B>(
  iterableBase: AsyncIterable<A>,
  iterableOverlay: AsyncIterable<B>,
  compare: (a: A, b: B) => number,
  isDelete: (b: B) => boolean,
): AsyncIterable<A | B> {
  const a = iterableBase[Symbol.asyncIterator]();
  const b = iterableOverlay[Symbol.asyncIterator]();

  let iterResultA = await a.next();
  let iterResultB = await b.next();

  while (true) {
    if (iterResultA.done) {
      if (iterResultB.done) {
        return;
      }
      const {value} = iterResultB;
      if (!isDelete(value)) {
        yield value;
      }
      iterResultB = await b.next();
      continue;
    }

    if (iterResultB.done) {
      yield iterResultA.value;
      iterResultA = await a.next();
      continue;
    }

    const ord = compare(iterResultA.value, iterResultB.value);
    if (ord === 0) {
      const {value} = iterResultB;
      if (!isDelete(value)) {
        yield value;
      }
      iterResultA = await a.next();
      iterResultB = await b.next();
    } else if (ord < 0) {
      yield iterResultA.value;
      iterResultA = await a.next();
    } else {
      const {value} = iterResultB;
      if (!isDelete(value)) {
        yield value;
      }
      iterResultB = await b.next();
    }
  }
}
