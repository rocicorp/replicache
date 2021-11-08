import {expect} from '@esm-bundle/chai';
import {range, rangeRight} from './range';

test('range works with explicit step', () => {
  expect(range(0, 5, 1)).to.deep.equal([0, 1, 2, 3, 4]);
  expect(range(0, -5, -1)).to.deep.equal([0, -1, -2, -3, -4]);
  expect(range(0, 5, 3)).to.deep.equal([0, 3]);
  expect(range(0, -5, -3)).to.deep.equal([0, -3]);
  expect(range(0, 50, 10)).to.deep.equal([0, 10, 20, 30, 40]);
  expect(range(0, -50, -10)).to.deep.equal([0, -10, -20, -30, -40]);
  expect(range(22, 55, 7)).to.deep.equal([22, 29, 36, 43, 50]);
  expect(range(-22, -55, -7)).to.deep.equal([-22, -29, -36, -43, -50]);
});

test('range infers step of 1 if endExclusive is greater than startInclusive', () => {
  expect(range(0, 5)).to.deep.equal([0, 1, 2, 3, 4]);
  expect(range(5, 10)).to.deep.equal([5, 6, 7, 8, 9]);
  expect(range(-5, 10)).to.deep.equal([
    -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
  ]);
});

test('range infers step of -1 if endExclusive is less than startInclusive', () => {
  expect(range(0, -5)).to.deep.equal([0, -1, -2, -3, -4]);
  expect(range(-5, -10)).to.deep.equal([-5, -6, -7, -8, -9]);
  expect(range(5, -10)).to.deep.equal([
    5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7, -8, -9,
  ]);
});

test('range returns empty array when startInclusive and endExclusive are equal', () => {
  expect(range(0, 0)).to.deep.equal([]);
  expect(range(0, 0, 2)).to.deep.equal([]);
  expect(range(5, 5)).to.deep.equal([]);
  expect(range(5, 5, 2)).to.deep.equal([]);
  expect(range(-5, -5)).to.deep.equal([]);
  expect(range(-5, -5, 2)).to.deep.equal([]);
});

test('range returns empty array when passed a step of 0', () => {
  expect(range(0, 5, 0)).to.deep.equal([]);
  expect(range(0, -5, 0)).to.deep.equal([]);
  expect(range(22, 55, 0)).to.deep.equal([]);
  expect(range(-22, -55, 0)).to.deep.equal([]);
});

test('range returns empty array when passed a step with a sign that would result in an infinite range', () => {
  expect(range(0, 5, -1)).to.deep.equal([]);
  expect(range(0, -5, 1)).to.deep.equal([]);
  expect(range(22, 55, -7)).to.deep.equal([]);
  expect(range(-22, -55, 7)).to.deep.equal([]);
});

test('rangeRight works with explicit step', () => {
  expect(range(0, 50, 10)).to.deep.equal([0, 10, 20, 30, 40]);
  expect(range(0, -50, -10)).to.deep.equal([0, -10, -20, -30, -40]);
});

test('rangeRight infers step of 1 if endExclusive is greater than startInclusive', () => {
  expect(rangeRight(5)).to.deep.equal([0, 1, 2, 3, 4]);
});

test('rangeRight infers step of -1 if endExclusive is less than 0', () => {
  expect(rangeRight(-5)).to.deep.equal([0, -1, -2, -3, -4]);
});
