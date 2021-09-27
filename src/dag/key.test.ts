import {expect} from '@esm-bundle/chai';
import {chunkDataKey, chunkMetaKey, chunkRefCountKey, headKey} from './key';

test('toString', () => {
  expect(chunkDataKey('')).to.equal('c//d');
  expect(chunkDataKey('a')).to.equal('c/a/d');
  expect(chunkDataKey('ab')).to.equal('c/ab/d');
  expect(chunkMetaKey('')).to.equal('c//m');
  expect(chunkMetaKey('a')).to.equal('c/a/m');
  expect(chunkMetaKey('ab')).to.equal('c/ab/m');
  expect(chunkRefCountKey('')).to.equal('c//r');
  expect(chunkRefCountKey('a')).to.equal('c/a/r');
  expect(chunkRefCountKey('ab')).to.equal('c/ab/r');
  expect(headKey('')).to.equal('h/');
  expect(headKey('a')).to.equal('h/a');
  expect(headKey('ab')).to.equal('h/ab');
});
