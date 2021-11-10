import {expect} from '@esm-bundle/chai';
import {Hash, hashOf, initHasher, parse} from '../hash';
import type {Value} from '../kv/store';
import {Chunk} from './chunk';
import {ChunkType} from './chunk-type';

setup(async () => {
  await initHasher();
});

test('round trip', async () => {
  const t = (hash: Hash, data: Value, refs: Hash[]) => {
    const c = Chunk.new(ChunkType.Test, [data, refs]);
    expect(c.type).to.equal(ChunkType.Test);
    expect(c.hash).to.equal(hash);
    expect(c.data).to.deep.equal([data, refs]);
    expect(c.refs).to.deep.equal(refs);

    const c2 = Chunk.read(hash, ChunkType.Test, c.data);
    expect(c).to.deep.equal(c2);
  };

  t(parse('2tqfsum3maphmjig4hh7fr45ma4hi19a'), [], []);
  t(parse('idqm898b8v6lo1lvvefodnap4rclet3h'), [0], [hashOf('r1')]);
  t(
    parse('o5ab0t8b68ac9f29jdkrghf9obbinkto'),
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

  eq(Chunk.new(ChunkType.Test, [[], []]), Chunk.new(ChunkType.Test, [[], []]));
  neq(
    Chunk.new(ChunkType.Test, [[1], []]),
    Chunk.new(ChunkType.Test, [[], []]),
  );
  neq(
    Chunk.new(ChunkType.Test, [[0], []]),
    Chunk.new(ChunkType.Test, [[1], []]),
  );

  eq(
    Chunk.new(ChunkType.Test, [[1], []]),
    Chunk.new(ChunkType.Test, [[1], []]),
  );
  eq(
    Chunk.new(ChunkType.Test, [[], [hashOf('a')]]),
    Chunk.new(ChunkType.Test, [[], [hashOf('a')]]),
  );

  neq(
    Chunk.new(ChunkType.Test, [[], [hashOf('a')]]),
    Chunk.new(ChunkType.Test, [[], [hashOf('b')]]),
  );
  neq(
    Chunk.new(ChunkType.Test, [[], [hashOf('a')]]),
    Chunk.new(ChunkType.Test, [[], [hashOf('a'), hashOf('b')]]),
  );
});
