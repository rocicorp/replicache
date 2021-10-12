import {expect, assert} from '@esm-bundle/chai';
import {Chunk} from '../dag/chunk';
import * as dag from '../dag/mod';
import {Hash, initHasher} from '../hash';
import type {ReadonlyJSONValue} from '../json';
import * as kv from '../kv/mod';
import {
  DataNode,
  findLeaf,
  InternalNode,
  Read,
  partition,
  Write,
  assertBTreeNode,
} from './node';

setup(async () => {
  await initHasher();
});

test('findLeaf', async () => {
  const kvStore = new kv.MemStore();
  const dagStore = new dag.Store(kvStore);

  function addHash(n: DataNode): DataNode & {hash: string} {
    const hash = Hash.of(JSON.stringify(n)).toString();
    return {...n, hash};
  }

  const leaf0: DataNode = {
    type: 'data',
    entries: [
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ],
  };

  const leaf1: DataNode = {
    type: 'data',
    entries: [
      ['d', 3],
      ['e', 4],
      ['f', 5],
    ],
  };
  const leaf2: DataNode = {
    type: 'data',
    entries: [
      ['g', 6],
      ['h', 7],
      ['i', 8],
    ],
  };

  let h0: string, h1: string, h2: string;

  let root: InternalNode;
  let rootHash: string;

  await dagStore.withWrite(async dagWrite => {
    const c0 = Chunk.new(leaf0, []);
    const c1 = Chunk.new(leaf1, []);
    const c2 = Chunk.new(leaf2, []);

    h0 = c0.hash;
    h1 = c1.hash;
    h2 = c2.hash;

    root = {
      type: 'internal',
      entries: [
        ['c', h0],
        ['f', h1],
        ['i', h2],
      ],
    };

    const rootChunk = Chunk.new(root, [h0, h1, h2]);
    rootHash = rootChunk.hash;

    await dagWrite.putChunk(c0);
    await dagWrite.putChunk(c1);
    await dagWrite.putChunk(c2);
    await dagWrite.putChunk(rootChunk);
    await dagWrite.setHead('test', rootHash);
    await dagWrite.commit();
  });

  await dagStore.withRead(async dagRead => {
    const source = new Read(rootHash, dagRead);

    const t = async (
      key: string,
      hash: string,
      source: Read,
      expected: DataNode,
    ) => {
      const actual = await findLeaf(key, hash, source);
      expect(actual.type).to.deep.equal(expected.type);
      expect(actual.entries).to.deep.equal(expected.entries);
    };

    await t('b', h0, source, leaf0);
    await t('a', h0, source, leaf0);
    await t('c', h0, source, leaf0);

    await t('a', rootHash, source, leaf0);
    await t('b', rootHash, source, leaf0);
    await t('c', rootHash, source, leaf0);
    await t('d', rootHash, source, leaf1);
    await t('e', rootHash, source, leaf1);
    await t('f', rootHash, source, leaf1);
    await t('g', rootHash, source, leaf2);
    await t('h', rootHash, source, leaf2);
    await t('i', rootHash, source, leaf2);
  });
});

type TreeData = {
  $type: 'internal' | 'data';
  [key: string]: TreeData | ReadonlyJSONValue;
};

async function makeTree(node: TreeData, dagWrite: dag.Write): Promise<string> {
  const entries: [string, ReadonlyJSONValue | string][] = Object.entries(
    node,
  ).filter(e => e[0] !== '$type');
  if (node.$type === 'data') {
    const dataNode: DataNode = {
      type: 'data',
      entries,
    };
    const chunk = Chunk.new(dataNode, []);
    await dagWrite.putChunk(chunk);
    return chunk.hash;
  }

  const ps = entries.map(async ([key, child]) => {
    const hash = await makeTree(child as TreeData, dagWrite);
    return [key, hash] as [string, string];
  });
  const entries2 = await Promise.all(ps);

  const internalNode: InternalNode = {
    type: 'internal',
    entries: entries2,
  };
  const refs = entries2.map(pair => pair[1]);
  const chunk = Chunk.new(internalNode, refs);
  await dagWrite.putChunk(chunk);
  return chunk.hash;
}

async function readTreeData(
  rootHash: string,
  dagRead: dag.Read,
): Promise<Record<string, ReadonlyJSONValue>> {
  const chunk = await dagRead.getChunk(rootHash);
  const node = chunk?.data;
  assertBTreeNode(node);
  let lastKey: string | undefined;
  const rv: Record<string, ReadonlyJSONValue> = {
    $type: node.type,
  };
  if (node.type === 'data') {
    for (const [k, v] of (node as DataNode).entries) {
      if (lastKey !== undefined) {
        assert(lastKey < k);
        lastKey = k;
      }
      rv[k] = v;
    }
    return rv;
  }

  for (const [k, hash] of (node as InternalNode).entries) {
    if (lastKey !== undefined) {
      expect(lastKey < k);
      lastKey = k;
    }
    rv[k] = await readTreeData(hash, dagRead);
  }
  return rv;
}

function doWrite(
  rootHash: string,
  dagStore: dag.Store,
  fn: (w: Write) => void | Promise<void>,
): Promise<string> {
  return dagStore.withWrite(async dagWrite => {
    const w = new Write(rootHash, dagWrite, 2, 4);
    await fn(w);
    const h = await w.flush();
    await dagWrite.setHead('test', h);
    await dagWrite.commit();
    return h;
  });
}

test('get', async () => {
  const kvStore = new kv.MemStore();
  const dagStore = new dag.Store(kvStore);

  const tree: TreeData = {
    $type: 'internal',
    f: {
      $type: 'data',
      b: 0,
      d: 1,
      f: 2,
    },
    l: {
      $type: 'data',
      h: 3,
      j: 4,
      l: 5,
    },
    r: {
      $type: 'data',
      n: 6,
      p: 7,
      r: 8,
    },
  };

  const rootHash = await dagStore.withWrite(async dagWrite => {
    const h = await makeTree(tree, dagWrite);
    await dagWrite.setHead('test', h);
    await dagWrite.commit();
    return h;
  });

  await dagStore.withRead(async dagRead => {
    const source = new Read(rootHash, dagRead);

    expect(await source.get('b')).to.equal(0);
    expect(await source.get('d')).to.equal(1);
    expect(await source.get('f')).to.equal(2);
    expect(await source.get('h')).to.equal(3);
    expect(await source.get('j')).to.equal(4);
    expect(await source.get('l')).to.equal(5);
    expect(await source.get('n')).to.equal(6);
    expect(await source.get('p')).to.equal(7);
    expect(await source.get('r')).to.equal(8);

    expect(await source.get('a')).to.equal(undefined);
    expect(await source.get('c')).to.equal(undefined);
    expect(await source.get('e')).to.equal(undefined);
    expect(await source.get('g')).to.equal(undefined);
    expect(await source.get('i')).to.equal(undefined);
    expect(await source.get('k')).to.equal(undefined);
    expect(await source.get('m')).to.equal(undefined);
    expect(await source.get('o')).to.equal(undefined);
    expect(await source.get('q')).to.equal(undefined);
    expect(await source.get('s')).to.equal(undefined);
  });
});

test('has', async () => {
  const kvStore = new kv.MemStore();
  const dagStore = new dag.Store(kvStore);

  const tree: TreeData = {
    $type: 'internal',
    f: {
      $type: 'data',
      b: 0,
      d: 1,
      f: 2,
    },
    l: {
      $type: 'data',
      h: 3,
      j: 4,
      l: 5,
    },
    r: {
      $type: 'data',
      n: 6,
      p: 7,
      r: 8,
    },
  };

  const rootHash = await dagStore.withWrite(async dagWrite => {
    const h = await makeTree(tree, dagWrite);
    await dagWrite.setHead('test', h);
    await dagWrite.commit();
    return h;
  });

  await dagStore.withRead(async dagRead => {
    const source = new Read(rootHash, dagRead);

    expect(await source.has('b')).to.be.true;
    expect(await source.has('d')).to.be.true;
    expect(await source.has('f')).to.be.true;
    expect(await source.has('h')).to.be.true;
    expect(await source.has('j')).to.be.true;
    expect(await source.has('l')).to.be.true;
    expect(await source.has('n')).to.be.true;
    expect(await source.has('p')).to.be.true;
    expect(await source.has('r')).to.be.true;

    expect(await source.has('a')).to.be.false;
    expect(await source.has('c')).to.be.false;
    expect(await source.has('e')).to.be.false;
    expect(await source.has('g')).to.be.false;
    expect(await source.has('i')).to.be.false;
    expect(await source.has('k')).to.be.false;
    expect(await source.has('m')).to.be.false;
    expect(await source.has('o')).to.be.false;
    expect(await source.has('q')).to.be.false;
    expect(await source.has('s')).to.be.false;
  });
});

test('partition', () => {
  const getSize = (v: string) => v.length;
  expect(
    partition(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'], getSize, 2, 4),
  ).to.deep.equal([['a', 'b', 'c', 'd'], ['e', 'f', 'g', 'h'], ['i']]);

  expect(
    partition(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], getSize, 2, 4),
  ).to.deep.equal([
    ['a', 'b', 'c', 'd'],
    ['e', 'f', 'g', 'h'],
  ]);

  expect(partition(['ab', 'cd', 'ef', 'gh', 'i'], getSize, 2, 4)).to.deep.equal(
    [['ab', 'cd'], ['ef', 'gh'], ['i']],
  );

  expect(partition(['a', 'bc', 'de', 'fg', 'hi'], getSize, 2, 4)).to.deep.equal(
    [['a', 'bc'], ['de', 'fg'], ['hi']],
  );

  expect(partition(['abcde', 'fg', 'hi'], getSize, 2, 4)).to.deep.equal([
    ['abcde'],
    ['fg', 'hi'],
  ]);
});

test('set', async () => {
  const kvStore = new kv.MemStore();
  const dagStore = new dag.Store(kvStore);

  const tree: TreeData = {
    $type: 'internal',
    f: {
      $type: 'data',
      b: 0,
      d: 1,
      f: 2,
    },
  };

  let rootHash = await dagStore.withWrite(async dagWrite => {
    const h = await makeTree(tree, dagWrite);
    await dagWrite.setHead('test', h);
    await dagWrite.commit();
    return h;
  });

  rootHash = await dagStore.withWrite(async dagWrite => {
    const w = new Write(rootHash, dagWrite, 2, 4);
    await w.put('a', 'aaa');

    expect(await w.get('a')).to.equal('aaa');
    expect(await w.get('b')).to.equal(0);
    await w.put('b', 'bbb');
    expect(await w.get('b')).to.equal('bbb');
    const h = await w.flush();
    await dagWrite.setHead('test', h);
    await dagWrite.commit();
    return h;
  });

  await dagStore.withRead(async dagRead => {
    expect(await readTreeData(rootHash, dagRead)).to.deep.equal({
      $type: 'internal',
      f: {
        $type: 'data',
        a: 'aaa',
        b: 'bbb',
        d: 1,
        f: 2,
      },
    });
  });

  rootHash = await dagStore.withWrite(async dagWrite => {
    const w = new Write(rootHash, dagWrite, 2, 4);
    await w.put('c', 'ccc');
    expect(await w.get('a')).to.equal('aaa');
    expect(await w.get('b')).to.equal('bbb');
    expect(await w.get('c')).to.equal('ccc');
    const h = await w.flush();
    await dagWrite.setHead('test', h);
    await dagWrite.commit();
    return h;
  });

  async function write(data: Record<string, ReadonlyJSONValue>) {
    rootHash = await dagStore.withWrite(async dagWrite => {
      const w = new Write(rootHash, dagWrite, 2, 4);
      for (const [k, v] of Object.entries(data)) {
        await w.put(k, v);
        expect(await w.get(k)).to.equal(v);
        expect(await w.has(k)).to.equal(true);
      }
      const h = await w.flush();
      for (const [k, v] of Object.entries(data)) {
        expect(await w.get(k)).to.equal(v);
        expect(await w.has(k)).to.equal(true);
      }

      await dagWrite.setHead('test', h);
      await dagWrite.commit();

      for (const [k, v] of Object.entries(data)) {
        expect(await w.get(k)).to.equal(v);
        expect(await w.has(k)).to.equal(true);
      }

      return h;
    });
  }

  await write({e: 'eee', f: 'fff', g: 'ggg', h: 'hhh', i: 'iii'});
  await dagStore.withRead(async dagRead => {
    expect(await readTreeData(rootHash, dagRead)).to.deep.equal({
      $type: 'internal',
      d: {
        $type: 'data',
        a: 'aaa',
        b: 'bbb',
        c: 'ccc',
        d: 1,
      },
      f: {
        $type: 'data',
        e: 'eee',
        f: 'fff',
      },
      i: {
        $type: 'data',
        g: 'ggg',
        h: 'hhh',
        i: 'iii',
      },
    });
  });

  await write({
    j: 'jjj',
    k: 'kkk',
    l: 'lll',
    m: 'mmm',
    n: 'nnn',
    o: 'ooo',
    p: 'ppp',
  });
  await dagStore.withRead(async dagRead => {
    expect(await readTreeData(rootHash, dagRead)).to.deep.equal({
      $type: 'internal',
      d: {
        $type: 'data',
        a: 'aaa',
        b: 'bbb',
        c: 'ccc',
        d: 1,
      },
      h: {
        $type: 'data',
        e: 'eee',
        f: 'fff',
        g: 'ggg',
        h: 'hhh',
      },
      l: {
        $type: 'data',
        i: 'iii',
        j: 'jjj',
        k: 'kkk',
        l: 'lll',
      },
      p: {
        $type: 'data',
        m: 'mmm',
        n: 'nnn',
        o: 'ooo',
        p: 'ppp',
      },
    });
  });

  await write({
    q: 'qqq',
  });
  await dagStore.withRead(async dagRead => {
    expect(await readTreeData(rootHash, dagRead)).to.deep.equal({
      $type: 'internal',
      h: {
        $type: 'internal',
        d: {
          $type: 'data',
          a: 'aaa',
          b: 'bbb',
          c: 'ccc',
          d: 1,
        },
        h: {
          $type: 'data',
          e: 'eee',
          f: 'fff',
          g: 'ggg',
          h: 'hhh',
        },
      },
      q: {
        $type: 'internal',
        l: {
          $type: 'data',
          i: 'iii',
          j: 'jjj',
          k: 'kkk',
          l: 'lll',
        },
        n: {
          $type: 'data',
          m: 'mmm',
          n: 'nnn',
        },
        q: {
          $type: 'data',
          o: 'ooo',
          p: 'ppp',
          q: 'qqq',
        },
      },
    });
  });

  await write({
    a: [1, 2],
  });
  await dagStore.withRead(async dagRead => {
    expect(await readTreeData(rootHash, dagRead)).to.deep.equal({
      $type: 'internal',
      h: {
        $type: 'internal',
        d: {
          $type: 'data',
          a: [1, 2],
          b: 'bbb',
          c: 'ccc',
          d: 1,
        },
        h: {
          $type: 'data',
          e: 'eee',
          f: 'fff',
          g: 'ggg',
          h: 'hhh',
        },
      },
      q: {
        $type: 'internal',
        l: {
          $type: 'data',
          i: 'iii',
          j: 'jjj',
          k: 'kkk',
          l: 'lll',
        },
        n: {
          $type: 'data',
          m: 'mmm',
          n: 'nnn',
        },
        q: {
          $type: 'data',
          o: 'ooo',
          p: 'ppp',
          q: 'qqq',
        },
      },
    });
  });

  await write({
    boo: '👻',
  });
  await dagStore.withRead(async dagRead => {
    expect(await readTreeData(rootHash, dagRead)).to.deep.equal({
      $type: 'internal',
      h: {
        $type: 'internal',
        boo: {
          $type: 'data',
          a: [1, 2],
          b: 'bbb',
          boo: '👻',
        },
        d: {
          $type: 'data',
          c: 'ccc',
          d: 1,
        },
        h: {
          $type: 'data',
          e: 'eee',
          f: 'fff',
          g: 'ggg',
          h: 'hhh',
        },
      },
      q: {
        $type: 'internal',
        l: {
          $type: 'data',
          i: 'iii',
          j: 'jjj',
          k: 'kkk',
          l: 'lll',
        },
        n: {
          $type: 'data',
          m: 'mmm',
          n: 'nnn',
        },
        q: {
          $type: 'data',
          o: 'ooo',
          p: 'ppp',
          q: 'qqq',
        },
      },
    });
  });

  await write({
    bx: true,
    bx2: false,
  });
  await dagStore.withRead(async dagRead => {
    expect(await readTreeData(rootHash, dagRead)).to.deep.equal({
      $type: 'internal',
      h: {
        $type: 'internal',
        bx: {
          $type: 'data',
          a: [1, 2],
          b: 'bbb',
          boo: '👻',
          bx: true,
        },
        d: {
          $type: 'data',
          bx2: false,
          c: 'ccc',
          d: 1,
        },
        h: {
          $type: 'data',
          e: 'eee',
          f: 'fff',
          g: 'ggg',
          h: 'hhh',
        },
      },
      q: {
        $type: 'internal',
        l: {
          $type: 'data',
          i: 'iii',
          j: 'jjj',
          k: 'kkk',
          l: 'lll',
        },
        n: {
          $type: 'data',
          m: 'mmm',
          n: 'nnn',
        },
        q: {
          $type: 'data',
          o: 'ooo',
          p: 'ppp',
          q: 'qqq',
        },
      },
    });
  });
});

test('del - single data node', async () => {
  const kvStore = new kv.MemStore();
  const dagStore = new dag.Store(kvStore);

  const tree: TreeData = {
    $type: 'internal',
    f: {
      $type: 'data',
      b: 0,
      d: 1,
      f: 2,
    },
  };

  let rootHash = await dagStore.withWrite(async dagWrite => {
    const h = await makeTree(tree, dagWrite);
    await dagWrite.setHead('test', h);
    await dagWrite.commit();
    return h;
  });

  rootHash = await doWrite(rootHash, dagStore, async w => {
    expect(await w.del('a')).to.equal(false);
    expect(await w.del('d')).to.equal(true);
  });

  await dagStore.withRead(async dagRead => {
    expect(await readTreeData(rootHash, dagRead)).to.deep.equal({
      $type: 'internal',
      f: {
        $type: 'data',
        b: 0,
        f: 2,
      },
    });
  });

  rootHash = await doWrite(rootHash, dagStore, async w => {
    expect(await w.del('f')).to.equal(true);
  });

  await dagStore.withRead(async dagRead => {
    expect(await readTreeData(rootHash, dagRead)).to.deep.equal({
      $type: 'internal',
      b: {
        $type: 'data',
        b: 0,
      },
    });
  });

  rootHash = await dagStore.withWrite(async dagWrite => {
    const w = new Write(rootHash, dagWrite, 2, 4);
    expect(await w.del('b')).to.equal(true);

    const h = await w.flush();
    await dagWrite.setHead('test', h);
    await dagWrite.commit();
    return h;
  });

  await dagStore.withRead(async dagRead => {
    expect(await readTreeData(rootHash, dagRead)).to.deep.equal({
      $type: 'internal',
    });
  });
});

test('del - with internal nodes', async () => {
  const kvStore = new kv.MemStore();
  const dagStore = new dag.Store(kvStore);

  const tree: TreeData = {
    $type: 'internal',
    h: {
      $type: 'internal',
      d: {
        $type: 'data',
        a: 'a',
        b: 'b',
        c: 'c',
        d: 1,
      },
      h: {
        $type: 'data',
        e: 'e',
        f: 'f',
        g: 'g',
        h: 'h',
      },
    },
    q: {
      $type: 'internal',
      l: {
        $type: 'data',
        i: 'i',
        j: 'j',
        k: 'k',
        l: 'l',
      },
      n: {
        $type: 'data',
        m: 'm',
        n: 'n',
      },
      q: {
        $type: 'data',
        o: 'o',
        p: 'p',
        q: 'q',
      },
    },
  };

  let rootHash = await dagStore.withWrite(async dagWrite => {
    const h = await makeTree(tree, dagWrite);
    await dagWrite.setHead('test', h);
    await dagWrite.commit();
    return h;
  });

  rootHash = await doWrite(rootHash, dagStore, async w => {
    expect(await w.del('n')).to.equal(true);
  });

  await dagStore.withRead(async dagRead => {
    expect(await readTreeData(rootHash, dagRead)).to.deep.equal({
      $type: 'internal',
      h: {
        $type: 'internal',
        d: {
          $type: 'data',
          a: 'a',
          b: 'b',
          c: 'c',
          d: 1,
        },
        h: {
          $type: 'data',
          e: 'e',
          f: 'f',
          g: 'g',
          h: 'h',
        },
      },
      q: {
        $type: 'internal',
        l: {
          $type: 'data',
          i: 'i',
          j: 'j',
          k: 'k',
          l: 'l',
        },
        m: {
          $type: 'data',
          m: 'm',
        },
        q: {
          $type: 'data',
          o: 'o',
          p: 'p',
          q: 'q',
        },
      },
    });
  });

  rootHash = await doWrite(rootHash, dagStore, async w => {
    expect(await w.del('m')).to.equal(true);
  });

  await dagStore.withRead(async dagRead => {
    expect(await readTreeData(rootHash, dagRead)).to.deep.equal({
      $type: 'internal',
      q: {
        $type: 'internal',
        d: {
          $type: 'data',
          a: 'a',
          b: 'b',
          c: 'c',
          d: 1,
        },
        h: {
          $type: 'data',
          e: 'e',
          f: 'f',
          g: 'g',
          h: 'h',
        },
        l: {
          $type: 'data',
          i: 'i',
          j: 'j',
          k: 'k',
          l: 'l',
        },
        q: {
          $type: 'data',
          o: 'o',
          p: 'p',
          q: 'q',
        },
      },
    });
  });

  rootHash = await doWrite(rootHash, dagStore, async w => {
    expect(await w.del('e')).to.equal(true);
    expect(await w.del('f')).to.equal(true);
    expect(await w.del('g')).to.equal(true);
    expect(await w.del('h')).to.equal(true);
  });

  await dagStore.withRead(async dagRead => {
    expect(await readTreeData(rootHash, dagRead)).to.deep.equal({
      $type: 'internal',
      q: {
        $type: 'internal',
        d: {
          $type: 'data',
          a: 'a',
          b: 'b',
          c: 'c',
          d: 1,
        },
        l: {
          $type: 'data',
          i: 'i',
          j: 'j',
          k: 'k',
          l: 'l',
        },
        q: {
          $type: 'data',
          o: 'o',
          p: 'p',
          q: 'q',
        },
      },
    });
  });

  rootHash = await doWrite(rootHash, dagStore, async w => {
    expect(await w.del('a')).to.equal(true);
    expect(await w.del('b')).to.equal(true);
    expect(await w.del('c')).to.equal(true);
    expect(await w.del('d')).to.equal(true);
  });

  await dagStore.withRead(async dagRead => {
    expect(await readTreeData(rootHash, dagRead)).to.deep.equal({
      $type: 'internal',
      q: {
        $type: 'internal',
        l: {
          $type: 'data',
          i: 'i',
          j: 'j',
          k: 'k',
          l: 'l',
        },
        q: {
          $type: 'data',
          o: 'o',
          p: 'p',
          q: 'q',
        },
      },
    });
  });

  // rootHash = await doWrite(rootHash, dagStore, async w => {
  //   expect(await w.del('b')).to.equal(true);
  //   expect(await w.del('f')).to.equal(true);
  // });

  // await dagStore.withRead(async dagRead => {
  //   expect(await readTreeData(rootHash, dagRead)).to.deep.equal({
  //     $type: 'internal',
  //   });
  // });
});
