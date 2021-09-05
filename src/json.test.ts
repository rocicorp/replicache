import {assert, expect} from '@esm-bundle/chai';
import {deepEqual, deepFreeze} from './json';
import type {JSONValue} from './json';

const {fail} = assert;

test('JSON deep equal', () => {
  const t = (
    a: JSONValue | undefined,
    b: JSONValue | undefined,
    expected = true,
  ) => {
    const res = deepEqual(a, b);
    if (res !== expected) {
      fail(
        JSON.stringify(a) + (expected ? ' === ' : ' !== ') + JSON.stringify(b),
      );
    }
  };

  const oneLevelOfData = [
    0,
    1,
    2,
    3,
    456789,
    true,
    false,
    null,
    '',
    'a',
    'b',
    'cdefefsfsafasdadsaas',
    [],
    {},
    {x: 4, y: 5, z: 6},
    [7, 8, 9],
  ] as const;

  const testData = [
    ...oneLevelOfData,
    [...oneLevelOfData],
    Object.fromEntries(oneLevelOfData.map(v => [JSON.stringify(v), v])),
  ];

  for (let i = 0; i < testData.length; i++) {
    for (let j = 0; j < testData.length; j++) {
      const a = testData[i];
      // "clone" to ensure we do not end up with a and b being the same object.
      const b = JSON.parse(JSON.stringify(testData[j]));
      t(a, b, i === j);
    }
  }

  t({a: 1, b: 2}, {b: 2, a: 1});
});

test('JSON deepFreeze', async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj: any = deepFreeze({obj: {}, arr: []});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arr: any = deepFreeze([{}, []]);
  expect(() => (obj.foo = 'bar')).throws();
  expect(() => (obj.obj.foo = 'bar')).throws();
  expect(() => (obj.arr[0] = 'bar')).throws();
  expect(() => (arr[0] = 'bar')).throws();
  expect(() => (arr[0].foo = 'bar')).throws();
  expect(() => (arr[1][0] = 'bar')).throws();
});
