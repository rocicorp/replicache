import {expect} from '@esm-bundle/chai';
import {Hash, hashOf, initHasher, parse} from '../hash';
import type {Value} from '../kv/store';
import {defaultChunkHasher, createChunk, readChunk} from './chunk';
import type {Chunk} from './chunk';

setup(async () => {
  await initHasher();
});

test('round trip', async () => {
  const t = (hash: Hash, data: Value, refs: Hash[]) => {
    const c = createChunk(data, refs, defaultChunkHasher);
    expect(c.hash).to.equal(hash);
    expect(c.data).to.deep.equal(data);
    expect(c.meta).to.deep.equal(refs);

    const buf = c.meta;
    const c2 = readChunk(hash, data, buf);
    expect(c).to.deep.equal(c2);
  };

  t(parse('m9diij5krqr9t80a9guf649p0i01mo0l'), [], []);
  t(parse('i4ua4lkdobnv4u5rdenb9jfumr4ru3k7'), [0], [hashOf('r1')]);
  t(
    parse('1rk961et3nqfi61oceeh6nc0sirin2lv'),
    [0, 1],
    [hashOf('r1'), hashOf('r2')],
  );
});

test('equals', async () => {
  const eq = (a: Chunk, b: Chunk) => {
    expect(a).to.deep.equal(b);
  };

  const neq = (a: Chunk, b: Chunk) => {
    expect(a).to.not.deep.equal(b);
  };

  const newChunk = (data: Value, refs: Hash[]) => {
    return createChunk(data, refs, defaultChunkHasher);
  };

  eq(newChunk([], []), newChunk([], []));
  neq(newChunk([1], []), newChunk([], []));
  neq(newChunk([0], []), newChunk([1], []));

  eq(newChunk([1], []), newChunk([1], []));
  eq(newChunk([], [hashOf('a')]), newChunk([], [hashOf('a')]));

  neq(newChunk([], [hashOf('a')]), newChunk([], [hashOf('b')]));
  neq(newChunk([], [hashOf('a')]), newChunk([], [hashOf('a'), hashOf('b')]));
});
