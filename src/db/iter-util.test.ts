import {expect} from '@esm-bundle/chai';
import {take, takeWhile} from './iter-util';

test('take', () => {
  expect([...take(0, [1, 2, 3])]).to.deep.equal([]);
  expect([...take(1, [1, 2, 3])]).to.deep.equal([1]);
  expect([...take(3, [1, 2, 3])]).to.deep.equal([1, 2, 3]);
  expect([...take(4, [1, 2, 3])]).to.deep.equal([1, 2, 3]);
});

test('takeWhile', () => {
  expect([...takeWhile(x => x < 3, [1, 2, 3])]).to.deep.equal([1, 2]);
  expect([...takeWhile(x => x < 3, [1, 2, 3, 4])]).to.deep.equal([1, 2]);
  expect([...takeWhile(() => true, [1, 2, 3])]).to.deep.equal([1, 2, 3]);
  expect([...takeWhile(() => false, [1, 2, 3])]).to.deep.equal([]);
});
