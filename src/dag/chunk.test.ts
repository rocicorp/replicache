import {expect} from '@esm-bundle/chai';
import {initHasher} from '../hash';
import {Chunk} from './chunk';

setup(async () => {
  await initHasher();
});

test('round trip', async () => {
  const t = (hash: string, data: Uint8Array, refs: string[]) => {
    const c = Chunk.new(data, refs);
    expect(c.hash).to.equal(hash);
    expect(c.data).to.deep.equal(data);
    expect(c.meta).to.deep.equal(refs);

    const buf = c.meta;
    const c2 = Chunk.read(hash, data, buf);
    expect(c).to.deep.equal(c2);
  };

  t('pu1u2dbutusbrsak518dcrc00vb21p05', new Uint8Array([]), []);
  t('n0i4q0k9g7b97brr8llfhrt4pbb3qa1e', new Uint8Array([0]), ['r1']);
  t('g19moobgrm32dn083bokhksuobulq28c', new Uint8Array([0, 1]), ['r1', 'r2']);
});

test('equals', async () => {
  const eq = (a: Chunk, b: Chunk) => {
    expect(a).to.deep.equal(b);
  };

  const neq = (a: Chunk, b: Chunk) => {
    expect(a).to.not.deep.equal(b);
  };

  eq(Chunk.new(new Uint8Array([]), []), Chunk.new(new Uint8Array([]), []));
  neq(Chunk.new(new Uint8Array([1]), []), Chunk.new(new Uint8Array([]), []));
  neq(Chunk.new(new Uint8Array([0]), []), Chunk.new(new Uint8Array([1]), []));

  eq(Chunk.new(new Uint8Array([1]), []), Chunk.new(new Uint8Array([1]), []));
  eq(
    Chunk.new(new Uint8Array([]), ['a']),
    Chunk.new(new Uint8Array([]), ['a']),
  );
  eq(
    Chunk.new(new Uint8Array([1]), ['a']),
    Chunk.new(new Uint8Array(new Uint8Array([0, 1]).buffer, 1), ['a']),
  );

  neq(
    Chunk.new(new Uint8Array([]), ['a']),
    Chunk.new(new Uint8Array([]), ['b']),
  );
  neq(
    Chunk.new(new Uint8Array([]), ['a']),
    Chunk.new(new Uint8Array([]), ['a', 'b']),
  );
});
