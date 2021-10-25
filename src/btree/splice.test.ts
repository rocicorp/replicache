import {expect} from '@esm-bundle/chai';
import {computeSplice, Splice} from './splice';
import type {ReadonlyEntry} from './node';

test('splice', () => {
  const t = <T>(
    previous: ReadonlyEntry<T>[],
    current: ReadonlyEntry<T>[],
    expected: Splice[],
  ) => {
    expect([...computeSplice(previous, current)]).to.deep.equal(expected);
  };

  t([['a', 0]], [['a', 0]], []);
  t([['a', 0]], [['a', 1]], [[0, 1, 1, 0]]);
  t([['a', 0]], [], [[0, 1, 0, 0]]);
  t([], [['a', 0]], [[0, 0, 1, 0]]);

  t([['a', 0]], [['b', 1]], [[0, 1, 1, 0]]);

  t(
    [
      ['a', 0],
      ['b', 1],
      ['c', 2],
      ['d', 3],
      ['e', 4],
    ],
    [
      ['a', 0],
      ['b', 1],
      ['c', 22],
      ['d', 3],
      ['e', 4],
    ],
    [[2, 1, 1, 2]],
  );

  t(
    [
      ['a', 0],
      ['b', 1],
      ['c', 2],
      ['d', 3],
      ['e', 4],
    ],
    [
      ['a', 0],
      ['b', 1],
      ['d', 3],
      ['e', 4],
    ],
    [[2, 1, 0, 0]],
  );

  t(
    [
      ['a', 0],
      ['b', 1],
      ['d', 3],
      ['e', 4],
    ],
    [
      ['a', 0],
      ['b', 1],
      ['c', 2],
      ['d', 3],
      ['e', 4],
    ],
    [[2, 0, 1, 2]],
  );

  t(
    [
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ],
    [
      ['a', 0],
      ['b', 1],
    ],
    [[2, 1, 0, 0]],
  );

  t(
    [
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ],
    [
      ['b', 1],
      ['c', 2],
    ],
    [[0, 1, 0, 0]],
  );

  t(
    [
      ['a', 0],
      ['b', 1],
    ],
    [
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ],
    [[2, 0, 1, 2]],
  );

  t(
    [
      ['b', 1],
      ['c', 2],
    ],
    [
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ],
    [[0, 0, 1, 0]],
  );

  t(
    [
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ],
    [
      ['a', 10],
      ['b', 11],
      ['c', 12],
    ],
    [[0, 3, 3, 0]],
  );

  t(
    [['b', 1]],
    [
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ],
    [
      [0, 0, 1, 0],
      [1, 0, 1, 2],
    ],
  );

  t(
    [
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ],
    [['b', 1]],
    [
      [0, 1, 0, 0],
      [2, 1, 0, 0],
    ],
  );

  t(
    [
      ['b', 1],
      ['d', 3],
    ],
    [
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ],
    [
      [0, 0, 1, 0],
      [1, 1, 1, 2],
    ],
  );

  t(
    [
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ],
    [
      ['b', 1],
      ['d', 3],
    ],
    [
      [0, 1, 0, 0],
      [2, 1, 1, 1],
    ],
  );

  t(
    [
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ],
    [
      ['b', 1],
      ['d', 3],
      ['e', 4],
    ],
    [
      [0, 1, 0, 0],
      [2, 1, 2, 1],
    ],
  );

  t(
    [
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ],
    [
      ['b', 3],
      ['c', 4],
    ],
    [[0, 3, 2, 0]],
  );
});

test('splice roundtrip', () => {
  const t = <T>(
    arr: readonly ReadonlyEntry<T>[],
    start: number,
    deleteCount: number,
    ...items: readonly ReadonlyEntry<T>[]
  ) => {
    const current = arr.slice();
    current.splice(start, deleteCount, ...items);
    const res = [...computeSplice(arr, current)];
    const expected: Splice[] = [
      [start, deleteCount, items.length, items.length === 0 ? 0 : start],
    ];
    expect(res).to.deep.equal(expected);
  };

  t(
    [
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ],
    1,
    1,
  );
  t(
    [
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ],
    1,
    1,
    ['b', 3],
  );
  t(
    [
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ],
    1,
    1,
    ['b', 3],
    ['b2', 33],
  );
  t(
    [
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ],
    1,
    0,
    ['a2', 3],
  );
  t(
    [
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ],
    1,
    0,
    ['a2', 3],
    ['a3', 4],
  );
});
