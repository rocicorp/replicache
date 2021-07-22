import {expect} from '@esm-bundle/chai';
import {Chunk} from './chunk.js';

test('round trip', async () => {
  const t = async (hash: string, data: Uint8Array, refs: string[]) => {
    const c = await Chunk.new(data, refs);
    expect(c.hash).to.equal(hash);
    expect(c.data).to.deep.equal(data);
    if (refs.length === 0) {
      expect(c.refs().next()).to.deep.equal({done: true, value: undefined});
    } else {
      expect([...c.refs()]).to.deep.equal(refs);
    }

    const buf = c.meta;
    const c2 = Chunk.read(hash, data, buf);
    expect(c).to.deep.equal(c2);
  };

  await t('pu1u2dbutusbrsak518dcrc00vb21p05', new Uint8Array([]), []);
  await t('n0i4q0k9g7b97brr8llfhrt4pbb3qa1e', new Uint8Array([0]), ['r1']);
  await t('g19moobgrm32dn083bokhksuobulq28c', new Uint8Array([0, 1]), [
    'r1',
    'r2',
  ]);
});

test('equals', async () => {
  const eq = (a: Chunk, b: Chunk) => {
    expect(a).to.deep.equal(b);
    expect(a.equals(b)).to.be.true;
  };

  const neq = (a: Chunk, b: Chunk) => {
    expect(a).to.not.deep.equal(b);
    expect(a.equals(b)).to.be.false;
  };

  eq(
    await Chunk.new(new Uint8Array([]), []),
    await Chunk.new(new Uint8Array([]), []),
  );
  neq(
    await Chunk.new(new Uint8Array([1]), []),
    await Chunk.new(new Uint8Array([]), []),
  );
  neq(
    await Chunk.new(new Uint8Array([0]), []),
    await Chunk.new(new Uint8Array([1]), []),
  );

  eq(
    await Chunk.new(new Uint8Array([1]), []),
    await Chunk.new(new Uint8Array([1]), []),
  );
  eq(
    await Chunk.new(new Uint8Array([]), ['a']),
    await Chunk.new(new Uint8Array([]), ['a']),
  );
  eq(
    await Chunk.new(new Uint8Array([1]), ['a']),
    await Chunk.new(new Uint8Array(new Uint8Array([0, 1]).buffer, 1), ['a']),
  );

  neq(
    await Chunk.new(new Uint8Array([]), ['a']),
    await Chunk.new(new Uint8Array([]), ['b']),
  );
  neq(
    await Chunk.new(new Uint8Array([]), ['a']),
    await Chunk.new(new Uint8Array([]), ['a', 'b']),
  );
});
