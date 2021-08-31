import {expect} from '@esm-bundle/chai';
import {Hash, initHasher} from './hash';
import * as utf8 from './utf8';

setup(async () => {
  await initHasher();
});

test('test of', async () => {
  const h = Hash.empty();
  expect(h.isEmpty()).to.be.true;
  expect(h.toString()).to.equal('00000000000000000000000000000000');

  const h2 = Hash.of(utf8.encode('abc'));
  expect(h2.isEmpty()).to.be.false;
  expect(h2.toString()).to.equal('rmnjb8cjc5tblj21ed4qs821649eduie');

  const h3 = Hash.parse('rmnjb8cjc5tblj21ed4qs821649eduie');
  expect(h3.toString()).to.equal(h2.toString());
  expect(h3).to.deep.equal(h2);
});
