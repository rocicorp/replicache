import {expect} from '@esm-bundle/chai';
import {hashOf, initHasher} from '../hash';
import {chunkDataKey, chunkMetaKey, chunkRefCountKey, headKey} from './key';

setup(async () => {
  await initHasher();
});

test('toString', () => {
  const hashEmptyString = hashOf('');
  const hashA = hashOf('a');
  const hashAB = hashOf('ab');
  expect(chunkDataKey(hashEmptyString)).to.equal(`c/${hashEmptyString}/d`);
  expect(chunkDataKey(hashA)).to.equal(`c/${hashA}/d`);
  expect(chunkDataKey(hashAB)).to.equal(`c/${hashAB}/d`);
  expect(chunkMetaKey(hashEmptyString)).to.equal(`c/${hashEmptyString}/m`);
  expect(chunkMetaKey(hashA)).to.equal(`c/${hashA}/m`);
  expect(chunkMetaKey(hashAB)).to.equal(`c/${hashAB}/m`);
  expect(chunkRefCountKey(hashEmptyString)).to.equal(`c/${hashEmptyString}/r`);
  expect(chunkRefCountKey(hashA)).to.equal(`c/${hashA}/r`);
  expect(chunkRefCountKey(hashAB)).to.equal(`c/${hashAB}/r`);
  expect(headKey('')).to.equal(`h/`);
  expect(headKey('a')).to.equal(`h/a`);
  expect(headKey('ab')).to.equal(`h/ab`);
});
