import {expect} from '@esm-bundle/chai';
import {Hash, initHasher} from './hash';

setup(async () => {
  await initHasher();
});

test('test of', async () => {
  const h = Hash.empty();
  expect(h.isEmpty()).to.be.true;
  expect(h.toString()).to.equal('00000000000000000000000000000000');

  const h2 = Hash.of({a: 42});
  expect(h2.isEmpty()).to.be.false;
  expect(h2.toString()).to.equal('uhnlsjog0k9lbrdre5v1booq5j1sjebe');

  const h3 = Hash.parse('uhnlsjog0k9lbrdre5v1booq5j1sjebe');
  expect(h3.toString()).to.equal(h2.toString());
  expect(h3).to.deep.equal(h2);
});
