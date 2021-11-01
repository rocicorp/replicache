import {expect} from '@esm-bundle/chai';
import {
  assertNotTempHash,
  emptyHash,
  hashOf,
  initHasher,
  isHash,
  isTempHash,
  newTempHash,
  parse,
} from './hash';

setup(async () => {
  await initHasher();
});

test('test of', () => {
  const h = hashOf('abc');
  expect(h).to.not.equal(emptyHash);
});

test('isHash', () => {
  expect(isHash(emptyHash)).to.be.true;

  const h = hashOf('abc');
  expect(isHash(h)).to.be.true;
  expect(isHash(h + 'a')).to.be.false;
  expect(isHash(String(h).slice(0, -1))).to.be.false;
});

test('parse', () => {
  const h = hashOf('abc');
  expect(parse(String(emptyHash))).to.equal(emptyHash);
  expect(parse(String(h))).to.equal(h);
  expect(() => parse(h + 'a')).to.throw(Error);
  expect(() => parse(String(h).slice(0, -1))).to.throw(Error);
});

test('temp hash', () => {
  const t = newTempHash();
  const c = {hash: hashOf('dummy')};
  expect(String(t).length, 'temp hash length').to.equal(String(c.hash).length);
  expect(isTempHash(t)).to.equal(true);
  expect(isTempHash(c.hash)).to.equal(false);

  expect(() => assertNotTempHash(t)).to.throw();
});

test.skip('type checking only', () => {
  const h = hashOf('abc');
  // @ts-expect-error Should be an error
  const s: string = h;
  console.log(s);

  // @ts-expect-error Sould be an error
  const h2: Hash = 'abc';
  console.log(h2);
});
