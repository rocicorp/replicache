import {expect} from '@esm-bundle/chai';
import {
  assertNotTempHash,
  emptyHash,
  hashOf,
  initHasher,
  isHash,
  isTempHash,
  nativeHashOf,
  newTempHash,
  parse,
} from './hash';
import type {ReadonlyJSONValue} from './json';

setup(async () => {
  await initHasher();
});

test('test of', () => {
  const h = hashOf('abc');
  expect(h).to.not.equal(emptyHash);
});

test('test native of', async () => {
  const h = await nativeHashOf('abc');
  expect(h).to.not.equal(emptyHash);

  const testData = ['abc', '', '\u0000', 'abc', '💩'];

  for (const s of testData) {
    const hash = hashOf(s);
    const nativeHash = await nativeHashOf(s);
    expect(hash).to.equal(nativeHash);
  }
});

test('isHash', async () => {
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

test('hashOf with different types', () => {
  const t = (v: ReadonlyJSONValue) => expect(isHash(hashOf(v))).to.be.true;

  t(1);
  t(1.1);
  t(true);
  t(false);
  t(null);
  t('');
  t('a');
  t('abc');
  t('abc\u0000');
  t([]);
  t([1, 2, 3]);
  t({});
  t({a: 1, b: 2});
});
