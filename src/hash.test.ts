import {expect} from '@esm-bundle/chai';
import {emptyHashString, hashOf, initHasher, isHash} from './hash';

setup(async () => {
  await initHasher();
});

test('test of', async () => {
  const h = hashOf('abc');
  expect(h).to.not.equal(emptyHashString);

  expect(isHash(emptyHashString)).to.be.true;
  expect(isHash(h)).to.be.true;
  expect(isHash(h + 'a')).to.be.false;
  expect(isHash(h.slice(0, -1))).to.be.false;
});
