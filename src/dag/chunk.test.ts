import {expect} from '@esm-bundle/chai';
import {initHasher} from '../hash';
import type {Value} from '../kv/store';
import {Chunk} from './chunk';

setup(async () => {
  await initHasher();
});

test('round trip', async () => {
  const t = (hash: string, data: Value, refs: string[]) => {
    const c = Chunk.new(data, refs);
    expect(c.hash).to.equal(hash);
    expect(c.data).to.deep.equal(data);
    expect(c.meta).to.deep.equal(refs);

    const buf = c.meta;
    const c2 = Chunk.read(hash, data, buf);
    expect(c).to.deep.equal(c2);
  };

  t('m9diij5krqr9t80a9guf649p0i01mo0l', [], []);
  t('i4ua4lkdobnv4u5rdenb9jfumr4ru3k7', [0], ['r1']);
  t('1rk961et3nqfi61oceeh6nc0sirin2lv', [0, 1], ['r1', 'r2']);
});

test('equals', async () => {
  const eq = (a: Chunk, b: Chunk) => {
    expect(a).to.deep.equal(b);
  };

  const neq = (a: Chunk, b: Chunk) => {
    expect(a).to.not.deep.equal(b);
  };

  eq(Chunk.new([], []), Chunk.new([], []));
  neq(Chunk.new([1], []), Chunk.new([], []));
  neq(Chunk.new([0], []), Chunk.new([1], []));

  eq(Chunk.new([1], []), Chunk.new([1], []));
  eq(Chunk.new([], ['a']), Chunk.new([], ['a']));

  neq(Chunk.new([], ['a']), Chunk.new([], ['b']));
  neq(Chunk.new([], ['a']), Chunk.new([], ['a', 'b']));
});
