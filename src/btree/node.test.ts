import {expect, assert} from '@esm-bundle/chai';
import {Chunk} from '../dag/chunk';
import * as dag from '../dag/mod';
import type {ScanOptionsInternal} from '../db/scan';
import {emptyHash, Hash, initHasher} from '../hash';
import type {ReadonlyJSONValue} from '../json';
import * as kv from '../kv/mod';
import {
  DataNode,
  findLeaf,
  InternalNode,
  partition,
  assertBTreeNode,
  Entry,
  DiffResult,
  DiffResultOp,
  NODE_LEVEL,
  NODE_ENTRIES,
} from './node';
import {BTreeWrite} from './write';
import {BTreeRead} from './read';
import {getSizeOfValue} from './get-size-of-value';

setup(async () => {
  await initHasher();
});

test('findLeaf', async () => {
  const kvStore = new kv.MemStore();
  const dagStore = new dag.Store(kvStore);

  const leaf0: DataNode = [
    0,
    [
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ],
  ];

  const leaf1: DataNode = [
    0,
    [
      ['d', 3],
      ['e', 4],
      ['f', 5],
    ],
  ];
  const leaf2: DataNode = [
    0,
    [
      ['g', 6],
      ['h', 7],
      ['i', 8],
    ],
  ];

  let h0: Hash, h1: Hash, h2: Hash;

  let root: InternalNode;
  let rootHash: Hash;

  await dagStore.withWrite(async dagWrite => {
    const c0 = Chunk.new(leaf0, []);
    const c1 = Chunk.new(leaf1, []);
    const c2 = Chunk.new(leaf2, []);

    h0 = c0.hash;
    h1 = c1.hash;
    h2 = c2.hash;

    root = [
      1,
      [
        ['c', h0],
        ['f', h1],
        ['i', h2],
      ],
    ];

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
    const source = new BTreeRead(
      dagRead,
      rootHash,
      getEntrySize,
      chunkHeaderSize,
    );

    const t = async (
      key: string,
      hash: Hash,
      source: BTreeRead,
      expected: DataNode,
    ) => {
      const actual = await findLeaf(key, hash, source);
      expect(actual.level).to.deep.equal(expected[NODE_LEVEL]);
      expect(actual.entries).to.deep.equal(expected[NODE_ENTRIES]);
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
  $level: number;
  [key: string]: TreeData | ReadonlyJSONValue;
};

function makeTree(node: TreeData, dagStore: dag.Store): Promise<Hash> {
  return dagStore.withWrite(async dagWrite => {
    const [h] = await makeTreeInner(node, dagWrite);
    await dagWrite.setHead('test', h);
    await dagWrite.commit();
    return h;
  });

  async function makeTreeInner(
    node: TreeData,
    dagWrite: dag.Write,
  ): Promise<[Hash, number]> {
    const entries: [string, ReadonlyJSONValue | string][] = Object.entries(
      node,
    ).filter(e => e[0] !== '$level');
    if (node.$level === 0) {
      const dataNode: DataNode = [0, entries];
      const chunk = Chunk.new(dataNode, []);
      await dagWrite.putChunk(chunk);
      return [chunk.hash, 0];
    }

    let level = 0;
    const ps = entries.map(async ([key, child]) => {
      const [hash, lvl] = await makeTreeInner(child as TreeData, dagWrite);
      level = Math.max(level, lvl);
      return [key, hash] as [string, Hash];
    });
    const entries2 = await Promise.all(ps);

    const internalNode: InternalNode = [level + 1, entries2];
    const refs = entries2.map(pair => pair[1]);
    const chunk = Chunk.new(internalNode, refs);
    await dagWrite.putChunk(chunk);
    return [chunk.hash, level + 1];
  }
}

async function readTreeData(
  rootHash: Hash,
  dagRead: dag.Read,
): Promise<Record<string, ReadonlyJSONValue>> {
  const chunk = await dagRead.getChunk(rootHash);
  const node = chunk?.data;
  assertBTreeNode(node);
  let lastKey: string | undefined;
  const rv: Record<string, ReadonlyJSONValue> = {
    $level: node[NODE_LEVEL],
  };

  if (node[NODE_LEVEL] === 0) {
    for (const [k, v] of node[NODE_ENTRIES]) {
      if (lastKey !== undefined) {
        assert(lastKey < k);
        lastKey = k;
      }
      rv[k] = v;
    }
    return rv;
  }

  for (const [k, hash] of (node as InternalNode)[NODE_ENTRIES]) {
    if (lastKey !== undefined) {
      expect(lastKey < k);
      lastKey = k;
    }
    rv[k] = await readTreeData(hash, dagRead);
  }
  return rv;
}

async function expectTree(
  rootHash: Hash,
  dagStore: dag.Store,
  expected: TreeData,
) {
  await dagStore.withRead(async dagRead => {
    expect(await readTreeData(rootHash, dagRead)).to.deep.equal(expected);
  });
}

let minSize: number;
let maxSize: number;
let getEntrySize: <T>(e: Entry<T>) => number;
let chunkHeaderSize: number;

setup(() => {
  minSize = 2;
  maxSize = 4;
  getEntrySize = () => 1;
  chunkHeaderSize = 0;
});

function doRead<R>(
  rootHash: Hash,
  dagStore: dag.Store,
  fn: (r: BTreeRead) => R | Promise<R>,
): Promise<R> {
  return dagStore.withRead(async dagWrite => {
    const r = new BTreeRead(dagWrite, rootHash, getEntrySize, chunkHeaderSize);
    return await fn(r);
  });
}

function doWrite(
  rootHash: Hash,
  dagStore: dag.Store,
  fn: (w: BTreeWrite) => void | Promise<void>,
): Promise<Hash> {
  return dagStore.withWrite(async dagWrite => {
    const w = new BTreeWrite(
      dagWrite,
      rootHash,
      minSize,
      maxSize,
      getEntrySize,
      chunkHeaderSize,
    );
    await fn(w);
    const h = await w.flush();
    await dagWrite.setHead('test', h);
    await dagWrite.commit();
    return h;
  });
}

async function asyncIterToArray<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const rv: T[] = [];
  for await (const e of iter) {
    rv.push(e);
  }
  return rv;
}

test('empty read tree', async () => {
  const kvStore = new kv.MemStore();
  const dagStore = new dag.Store(kvStore);
  await dagStore.withRead(async dagRead => {
    const r = new BTreeRead(dagRead);
    expect(await r.get('a')).to.be.undefined;
    expect(await r.has('b')).to.be.false;
    expect(await asyncIterToArray(r.scan({}))).to.deep.equal([]);
  });
});

test('empty write tree', async () => {
  const kvStore = new kv.MemStore();
  const dagStore = new dag.Store(kvStore);

  await dagStore.withWrite(async dagWrite => {
    const w = new BTreeWrite(
      dagWrite,
      undefined,
      minSize,
      maxSize,
      getEntrySize,
      chunkHeaderSize,
    );
    expect(await w.get('a')).to.be.undefined;
    expect(await w.has('b')).to.be.false;
    expect(await asyncIterToArray(w.scan({}))).to.deep.equal([]);

    const h = await w.flush();
    expect(h).to.equal(emptyHash);
  });
  let rootHash = await dagStore.withWrite(async dagWrite => {
    const w = new BTreeWrite(
      dagWrite,
      undefined,
      minSize,
      maxSize,
      getEntrySize,
      chunkHeaderSize,
    );
    await w.put('a', 1);
    const h = await w.flush();
    expect(h).to.not.equal(emptyHash);
    await dagWrite.setHead('test', h);
    await dagWrite.commit();
    return h;
  });

  rootHash = await doWrite(rootHash, dagStore, async w => {
    expect(await w.del('a')).to.be.true;
  });

  // We do not restore back to empty hash when empty.
  expect(rootHash).to.not.equal(emptyHash);
});

test('get', async () => {
  const kvStore = new kv.MemStore();
  const dagStore = new dag.Store(kvStore);

  const tree: TreeData = {
    $level: 1,
    f: {
      $level: 0,
      b: 0,
      d: 1,
      f: 2,
    },
    l: {
      $level: 0,
      h: 3,
      j: 4,
      l: 5,
    },
    r: {
      $level: 0,
      n: 6,
      p: 7,
      r: 8,
    },
  };

  const rootHash = await makeTree(tree, dagStore);

  await dagStore.withRead(async dagRead => {
    const source = new BTreeRead(
      dagRead,
      rootHash,
      getEntrySize,
      chunkHeaderSize,
    );

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
    $level: 1,
    f: {
      $level: 0,
      b: 0,
      d: 1,
      f: 2,
    },
    l: {
      $level: 0,
      h: 3,
      j: 4,
      l: 5,
    },
    r: {
      $level: 0,
      n: 6,
      p: 7,
      r: 8,
    },
  };

  const rootHash = await makeTree(tree, dagStore);

  await dagStore.withRead(async dagRead => {
    const source = new BTreeRead(
      dagRead,
      rootHash,
      getEntrySize,
      chunkHeaderSize,
    );

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

  const t = (input: string[], expected: string[][]) => {
    expect(partition(input, getSize, 2, 4)).to.deep.equal(expected);
  };

  t([], []);
  t(['a'], [['a']]);
  t(['a', 'b'], [['a', 'b']]);
  t(['a', 'b', 'c'], [['a', 'b', 'c']]);
  t(
    ['a', 'b', 'c', 'd'],
    [
      ['a', 'b'],
      ['c', 'd'],
    ],
  );
  t(
    ['a', 'b', 'c', 'd', 'e'],
    [
      ['a', 'b'],
      ['c', 'd', 'e'],
    ],
  );
  t(
    ['a', 'b', 'c', 'd', 'e', 'f'],
    [
      ['a', 'b'],
      ['c', 'd'],
      ['e', 'f'],
    ],
  );
  t(['ab'], [['ab']]);
  t(['ab', 'cd'], [['ab'], ['cd']]);
  t(['ab', 'cd', 'ef'], [['ab'], ['cd'], ['ef']]);
  t(['ab', 'cd', 'e'], [['ab'], ['cd', 'e']]);
  t(['ab', 'c', 'de'], [['ab'], ['c', 'de']]);
  t(['a', 'bc', 'de'], [['a', 'bc'], ['de']]);
  t(['abc', 'de'], [['abc'], ['de']]);
  t(['abc', 'def'], [['abc'], ['def']]);
  t(['a', 'bcd', 'e'], [['a', 'bcd'], ['e']]);
  t(['ab', 'cde', 'f'], [['ab'], ['cde', 'f']]);
  t(['abc', 'd', 'efg'], [['abc'], ['d', 'efg']]);
  t(['abcd', 'e', 'f'], [['abcd'], ['e', 'f']]);
  t(['a', 'bcde', 'f'], [['a'], ['bcde'], ['f']]);
  t(['a', 'bcdef', 'g'], [['a'], ['bcdef'], ['g']]);
});

test('put', async () => {
  const kvStore = new kv.MemStore();
  const dagStore = new dag.Store(kvStore);

  const tree: TreeData = {
    $level: 0,
    b: 0,
    d: 1,
    f: 2,
  };

  let rootHash = await makeTree(tree, dagStore);

  rootHash = await doWrite(rootHash, dagStore, async w => {
    await w.put('a', 'aaa');

    expect(await w.get('a')).to.equal('aaa');
    expect(await w.get('b')).to.equal(0);
    await w.put('b', 'bbb');
    expect(await w.get('b')).to.equal('bbb');
  });

  await expectTree(rootHash, dagStore, {
    $level: 0,
    a: 'aaa',
    b: 'bbb',
    d: 1,
    f: 2,
  });

  rootHash = await doWrite(rootHash, dagStore, async w => {
    await w.put('c', 'ccc');
    expect(await w.get('a')).to.equal('aaa');
    expect(await w.get('b')).to.equal('bbb');
    expect(await w.get('c')).to.equal('ccc');
  });

  await expectTree(rootHash, dagStore, {
    $level: 1,
    b: {
      $level: 0,
      a: 'aaa',
      b: 'bbb',
    },
    f: {
      $level: 0,
      c: 'ccc',
      d: 1,
      f: 2,
    },
  });

  async function write(data: Record<string, ReadonlyJSONValue>) {
    rootHash = await dagStore.withWrite(async dagWrite => {
      const w = new BTreeWrite(
        dagWrite,
        rootHash,
        minSize,
        maxSize,
        getEntrySize,
        chunkHeaderSize,
      );
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

  await write({
    e: 'eee',
    f: 'fff',
    g: 'ggg',
    h: 'hhh',
    i: 'iii',
    j: 'jjj',
  });
  await expectTree(rootHash, dagStore, {
    $level: 1,
    b: {
      $level: 0,
      a: 'aaa',
      b: 'bbb',
    },
    d: {
      $level: 0,
      c: 'ccc',
      d: 1,
    },
    f: {
      $level: 0,
      e: 'eee',
      f: 'fff',
    },
    j: {
      $level: 0,
      g: 'ggg',
      h: 'hhh',
      i: 'iii',
      j: 'jjj',
    },
  });

  await write({
    k: 'kkk',
  });
  await expectTree(rootHash, dagStore, {
    $level: 2,
    d: {
      $level: 1,
      b: {
        $level: 0,
        a: 'aaa',
        b: 'bbb',
      },
      d: {
        $level: 0,
        c: 'ccc',
        d: 1,
      },
    },
    k: {
      $level: 1,
      f: {
        $level: 0,
        e: 'eee',
        f: 'fff',
      },
      h: {
        $level: 0,
        g: 'ggg',
        h: 'hhh',
      },
      k: {
        $level: 0,
        i: 'iii',
        j: 'jjj',
        k: 'kkk',
      },
    },
  });

  await write({
    q: 'qqq',
    m: 'mmm',
    l: 'lll',
    p: 'ppp',
    o: 'ooo',
    n: 'nnn',
  });
  await expectTree(rootHash, dagStore, {
    $level: 2,
    d: {
      $level: 1,
      b: {
        $level: 0,
        a: 'aaa',
        b: 'bbb',
      },
      d: {
        $level: 0,
        c: 'ccc',
        d: 1,
      },
    },
    h: {
      $level: 1,
      f: {
        $level: 0,
        e: 'eee',
        f: 'fff',
      },
      h: {
        $level: 0,
        g: 'ggg',
        h: 'hhh',
      },
    },
    q: {
      $level: 1,
      j: {
        $level: 0,
        i: 'iii',
        j: 'jjj',
      },
      l: {
        $level: 0,
        k: 'kkk',
        l: 'lll',
      },
      n: {
        $level: 0,
        m: 'mmm',
        n: 'nnn',
      },
      q: {
        $level: 0,
        o: 'ooo',
        p: 'ppp',
        q: 'qqq',
      },
    },
  });

  await write({
    boo: '👻',
  });
  await expectTree(rootHash, dagStore, {
    $level: 2,
    d: {
      $level: 1,
      b: {
        $level: 0,
        a: 'aaa',
        b: 'bbb',
      },
      d: {
        $level: 0,
        boo: '👻',
        c: 'ccc',
        d: 1,
      },
    },
    h: {
      $level: 1,
      f: {
        $level: 0,
        e: 'eee',
        f: 'fff',
      },
      h: {
        $level: 0,
        g: 'ggg',
        h: 'hhh',
      },
    },
    q: {
      $level: 1,
      j: {
        $level: 0,
        i: 'iii',
        j: 'jjj',
      },
      l: {
        $level: 0,
        k: 'kkk',
        l: 'lll',
      },
      n: {
        $level: 0,
        m: 'mmm',
        n: 'nnn',
      },
      q: {
        $level: 0,
        o: 'ooo',
        p: 'ppp',
        q: 'qqq',
      },
    },
  });

  await write({
    bx: true,
    bx2: false,
  });
  await expectTree(rootHash, dagStore, {
    $level: 2,
    d: {
      $level: 1,
      b: {
        $level: 0,
        a: 'aaa',
        b: 'bbb',
      },
      bx: {
        $level: 0,
        boo: '👻',
        bx: true,
      },
      d: {
        $level: 0,
        bx2: false,
        c: 'ccc',
        d: 1,
      },
    },
    h: {
      $level: 1,
      f: {
        $level: 0,
        e: 'eee',
        f: 'fff',
      },
      h: {
        $level: 0,
        g: 'ggg',
        h: 'hhh',
      },
    },
    q: {
      $level: 1,
      j: {
        $level: 0,
        i: 'iii',
        j: 'jjj',
      },
      l: {
        $level: 0,
        k: 'kkk',
        l: 'lll',
      },
      n: {
        $level: 0,
        m: 'mmm',
        n: 'nnn',
      },
      q: {
        $level: 0,
        o: 'ooo',
        p: 'ppp',
        q: 'qqq',
      },
    },
  });
});

test('del - single data node', async () => {
  const kvStore = new kv.MemStore();
  const dagStore = new dag.Store(kvStore);

  const tree: TreeData = {
    $level: 0,
    b: 0,
    d: 1,
    f: 2,
  };

  let rootHash = await makeTree(tree, dagStore);

  rootHash = await doWrite(rootHash, dagStore, async w => {
    expect(await w.del('a')).to.equal(false);
    expect(await w.del('d')).to.equal(true);
  });

  await expectTree(rootHash, dagStore, {
    $level: 0,
    b: 0,
    f: 2,
  });

  rootHash = await doWrite(rootHash, dagStore, async w => {
    expect(await w.del('f')).to.equal(true);
  });

  await expectTree(rootHash, dagStore, {
    $level: 0,
    b: 0,
  });

  rootHash = await doWrite(rootHash, dagStore, async w => {
    expect(await w.del('b')).to.equal(true);
  });

  await expectTree(rootHash, dagStore, {
    $level: 0,
  });
});

test('del - flatten', async () => {
  const kvStore = new kv.MemStore();
  const dagStore = new dag.Store(kvStore);

  // This tests that we can flatten "an invalid tree"

  {
    const tree: TreeData = {
      $level: 3,
      b: {
        $level: 2,
        b: {
          $level: 1,
          b: {
            $level: 0,
            a: 'aaa',
            b: 'bbb',
          },
        },
      },
    };

    let rootHash = await makeTree(tree, dagStore);

    rootHash = await doWrite(rootHash, dagStore, async w => {
      expect(await w.del('a')).to.equal(true);
    });

    await expectTree(rootHash, dagStore, {
      $level: 0,
      b: 'bbb',
    });
  }

  {
    const tree: TreeData = {
      $level: 3,
      b: {
        $level: 2,
        b: {
          $level: 1,
          b: {
            $level: 0,
            a: 'aaa',
            b: 'bbb',
          },
        },
      },
    };

    let rootHash = await makeTree(tree, dagStore);

    rootHash = await doWrite(rootHash, dagStore, async w => {
      expect(await w.del('b')).to.equal(true);
    });

    await expectTree(rootHash, dagStore, {
      $level: 0,
      a: 'aaa',
    });
  }
});

test('del - with internal nodes', async () => {
  const kvStore = new kv.MemStore();
  const dagStore = new dag.Store(kvStore);

  const tree: TreeData = {
    $level: 2,
    d: {
      $level: 1,
      b: {
        $level: 0,
        a: 'aaa',
        b: 'bbb',
      },
      d: {
        $level: 0,
        c: 'ccc',
        d: 'ddd',
      },
    },
    k: {
      $level: 1,
      f: {
        $level: 0,
        e: 'eee',
        f: 'fff',
      },
      h: {
        $level: 0,
        g: 'ggg',
        h: 'hhh',
      },
      k: {
        $level: 0,
        i: 'iii',
        j: 'jjj',
        k: 'kkk',
      },
    },
  };

  let rootHash = await makeTree(tree, dagStore);

  rootHash = await doWrite(rootHash, dagStore, async w => {
    expect(await w.del('k')).to.equal(true);
  });

  await expectTree(rootHash, dagStore, {
    $level: 2,
    d: {
      $level: 1,
      b: {
        $level: 0,
        a: 'aaa',
        b: 'bbb',
      },
      d: {
        $level: 0,
        c: 'ccc',
        d: 'ddd',
      },
    },
    j: {
      $level: 1,
      f: {
        $level: 0,
        e: 'eee',
        f: 'fff',
      },
      h: {
        $level: 0,
        g: 'ggg',
        h: 'hhh',
      },
      j: {
        $level: 0,
        i: 'iii',
        j: 'jjj',
      },
    },
  });

  rootHash = await doWrite(rootHash, dagStore, async w => {
    expect(await w.del('c')).to.equal(true);
  });

  await expectTree(rootHash, dagStore, {
    $level: 2,
    f: {
      $level: 1,
      d: {
        $level: 0,
        a: 'aaa',
        b: 'bbb',
        d: 'ddd',
      },
      f: {
        $level: 0,
        e: 'eee',
        f: 'fff',
      },
    },
    j: {
      $level: 1,
      h: {
        $level: 0,
        g: 'ggg',
        h: 'hhh',
      },
      j: {
        $level: 0,
        i: 'iii',
        j: 'jjj',
      },
    },
  });

  rootHash = await doWrite(rootHash, dagStore, async w => {
    expect(await w.del('e')).to.equal(true);
    expect(await w.del('f')).to.equal(true);
    expect(await w.del('g')).to.equal(true);
    expect(await w.del('h')).to.equal(true);
  });

  await expectTree(rootHash, dagStore, {
    $level: 1,
    d: {
      $level: 0,
      a: 'aaa',
      b: 'bbb',
      d: 'ddd',
    },
    j: {
      $level: 0,
      i: 'iii',
      j: 'jjj',
    },
  });

  rootHash = await doWrite(rootHash, dagStore, async w => {
    expect(await w.del('a')).to.equal(true);
    expect(await w.del('b')).to.equal(true);
  });

  await expectTree(rootHash, dagStore, {
    $level: 0,
    d: 'ddd',
    i: 'iii',
    j: 'jjj',
  });

  rootHash = await doWrite(rootHash, dagStore, async w => {
    expect(await w.del('i')).to.equal(true);
    expect(await w.del('j')).to.equal(true);
  });

  await expectTree(rootHash, dagStore, {
    $level: 0,
    d: 'ddd',
  });

  rootHash = await doWrite(rootHash, dagStore, async w => {
    expect(await w.del('d')).to.equal(true);
  });

  await expectTree(rootHash, dagStore, {
    $level: 0,
  });
});

test('put - invalid', async () => {
  const kvStore = new kv.MemStore();
  const dagStore = new dag.Store(kvStore);

  // This tests that we can do puts on "an invalid tree"

  const tree: TreeData = {
    $level: 2,
    b: {
      $level: 2,
      b: {
        $level: 0,
        b: 'bbb',
      },
    },
  };

  let rootHash = await makeTree(tree, dagStore);

  rootHash = await doWrite(rootHash, dagStore, async w => {
    await w.put('c', 'ccc');
  });

  await expectTree(rootHash, dagStore, {
    $level: 2,
    c: {
      $level: 1,
      c: {
        $level: 0,
        b: 'bbb',
        c: 'ccc',
      },
    },
  });
});

test('put/del - getSize', async () => {
  minSize = 24;
  maxSize = minSize * 2;
  getEntrySize = getSizeOfValue;

  const kvStore = new kv.MemStore();
  const dagStore = new dag.Store(kvStore);

  // This tests that we can do puts on "an invalid tree"

  const tree: TreeData = {
    $level: 0,
  };

  let rootHash = await makeTree(tree, dagStore);

  rootHash = await doWrite(rootHash, dagStore, async w => {
    await w.put('aaaa', 'a1');
  });

  expect(getSizeOfValue('aaaa')).to.equal(9);
  expect(getSizeOfValue('a1')).to.equal(7);
  expect(getEntrySize(['aaaa', 'a1'])).to.equal(22);
  await expectTree(rootHash, dagStore, {
    $level: 0,
    aaaa: 'a1',
  });

  rootHash = await doWrite(rootHash, dagStore, async w => {
    await w.put('c', '');
  });
  expect(getEntrySize(['c', ''])).to.equal(17);
  await expectTree(rootHash, dagStore, {
    $level: 0,
    aaaa: 'a1',
    c: '',
  });

  rootHash = await doWrite(rootHash, dagStore, async w => {
    await w.put('b', 'b234');
  });
  expect(getEntrySize(['b', 'b234'])).to.equal(21);
  await expectTree(rootHash, dagStore, {
    $level: 1,

    b: {
      $level: 0,
      aaaa: 'a1',
      b: 'b234',
    },
    c: {
      $level: 0,
      c: '',
    },
  });

  rootHash = await doWrite(rootHash, dagStore, async w => {
    await w.del('b');
  });
  await expectTree(rootHash, dagStore, {
    $level: 0,
    aaaa: 'a1',
    c: '',
  });
});

test('scan', async () => {
  const t = async (
    entries: Entry<ReadonlyJSONValue>[],
    options: ScanOptionsInternal = {},
    expectedEntries = entries,
  ) => {
    const kvStore = new kv.MemStore();
    const dagStore = new dag.Store(kvStore);

    const tree: TreeData = {
      $level: 0,
    };

    let rootHash = await makeTree(tree, dagStore);

    rootHash = await doWrite(rootHash, dagStore, async w => {
      for (const [k, v] of entries) {
        await w.put(k, v);
      }
    });

    await doRead(rootHash, dagStore, async r => {
      const res: Entry<ReadonlyJSONValue>[] = [];
      for await (const e of r.scan(options)) {
        res.push(e);
      }

      expect(res).to.deep.equal(expectedEntries);
    });
  };

  await t([]);
  await t([['a', 1]]);
  await t([
    ['a', 1],
    ['b', 2],
  ]);
  await t([
    ['a', 1],
    ['b', 2],
    ['c', 3],
  ]);
  await t([
    ['a', 1],
    ['b', 2],
    ['c', 3],
    ['d', 4],
  ]);
  await t([
    ['a', 1],
    ['b', 2],
    ['c', 3],
    ['d', 4],
    ['e', 5],
  ]);

  await t(
    [
      ['a', 1],
      ['b', 2],
      ['c', 3],
      ['d', 4],
      ['e', 5],
    ],
    {limit: 0},
    [],
  );
  await t(
    [
      ['a', 1],
      ['b', 2],
      ['c', 3],
      ['d', 4],
      ['e', 5],
    ],
    {limit: 1},
    [['a', 1]],
  );
  await t(
    [
      ['a', 1],
      ['b', 2],
      ['c', 3],
      ['d', 4],
      ['e', 5],
    ],
    {limit: 2},
    [
      ['a', 1],
      ['b', 2],
    ],
  );

  await t(
    [
      ['a', 0],
      ['aa', 1],
      ['aaa', 2],
      ['aab', 3],
      ['ab', 4],
      ['b', 5],
    ],
    {prefix: 'aa'},
    [
      ['aa', 1],
      ['aaa', 2],
      ['aab', 3],
    ],
  );

  for (let limit = 4; limit >= 0; limit--) {
    await t(
      [
        ['a', 0],
        ['aa', 1],
        ['aaa', 2],
        ['aab', 3],
        ['ab', 4],
        ['b', 5],
      ],
      {prefix: 'aa', limit},
      [
        ['aa', 1],
        ['aaa', 2],
        ['aab', 3],
      ].slice(0, limit) as Entry<number>[],
    );
  }

  for (let limit = 3; limit >= 0; limit--) {
    await t(
      [
        ['a', 0],
        ['aa', 1],
        ['aaa', 2],
        ['aab', 3],
        ['ab', 4],
        ['b', 5],
      ],
      {prefix: 'aa', startKey: 'aaa', limit},
      [
        ['aaa', 2],
        ['aab', 3],
      ].slice(0, limit) as Entry<number>[],
    );
  }

  await t(
    [
      ['a', 1],
      ['b', 2],
      ['c', 3],
      ['d', 4],
      ['e', 5],
    ],
    {limit: -1},
    [],
  );

  await t(
    [
      ['a', 1],
      ['b', 2],
      ['c', 3],
      ['d', 4],
      ['e', 5],
    ],
    {prefix: 'f'},
    [],
  );

  await t(
    [
      ['a', 1],
      ['b', 2],
      ['c', 3],
      ['d', 4],
      ['e', 5],
    ],
    {startKey: 'f'},
    [],
  );

  await t(
    [
      ['a', 1],
      ['b', 2],
      ['c', 3],
      ['d', 4],
      ['e', 5],
    ],
    {startKey: 'e'},
    [['e', 5]],
  );
});

test('diff', async () => {
  const t = async (
    oldEntries: Entry<ReadonlyJSONValue>[],
    newEntries: Entry<ReadonlyJSONValue>[],
    expectedDiff: DiffResult<ReadonlyJSONValue>[],
  ) => {
    const kvStore = new kv.MemStore();
    const dagStore = new dag.Store(kvStore);

    const [oldHash, newHash] = await dagStore.withWrite(async dagWrite => {
      const oldTree = new BTreeWrite(
        dagWrite,
        undefined,
        minSize,
        maxSize,
        getEntrySize,
        chunkHeaderSize,
      );
      for (const entry of oldEntries) {
        await oldTree.put(entry[0], entry[1]);
      }

      const newTree = new BTreeWrite(
        dagWrite,
        undefined,
        minSize,
        maxSize,
        getEntrySize,
        chunkHeaderSize,
      );
      for (const entry of newEntries) {
        await newTree.put(entry[0], entry[1]);
      }

      const oldHash = await oldTree.flush();
      const newHash = await newTree.flush();

      await dagWrite.setHead('test/old', oldHash);
      await dagWrite.setHead('test/new', newHash);
      await dagWrite.commit();

      return [oldHash, newHash];
    });

    await dagStore.withRead(async dagRead => {
      const oldTree = new BTreeRead(
        dagRead,
        oldHash,
        getEntrySize,
        chunkHeaderSize,
      );
      const newTree = new BTreeRead(
        dagRead,
        newHash,
        getEntrySize,
        chunkHeaderSize,
      );

      const actual = [];
      for await (const diffRes of newTree.diff(oldTree)) {
        actual.push(diffRes);
      }
      expect(actual).to.deep.equal(expectedDiff);
    });
  };

  await t([], [], []);

  await t([['a', 0]], [], [{op: DiffResultOp.Delete, key: 'a', oldValue: 0}]);
  await t([], [['a', 0]], [{op: DiffResultOp.Add, key: 'a', newValue: 0}]);
  await t([['a', 0]], [['a', 0]], []);
  await t(
    [['a', 0]],
    [['a', 1]],
    [{op: DiffResultOp.Change, key: 'a', oldValue: 0, newValue: 1}],
  );

  await t(
    [
      ['b', 1],
      ['d', 2],
    ],
    [
      ['d', 2],
      ['f', 3],
    ],
    [
      {op: DiffResultOp.Delete, key: 'b', oldValue: 1},
      {op: DiffResultOp.Add, key: 'f', newValue: 3},
    ],
  );

  await t(
    [
      ['b', 1],
      ['d', 2],
      ['e', 4],
    ],
    [
      ['d', 22],
      ['f', 3],
    ],
    [
      {op: DiffResultOp.Delete, key: 'b', oldValue: 1},
      {op: DiffResultOp.Change, key: 'd', oldValue: 2, newValue: 22},
      {op: DiffResultOp.Delete, key: 'e', oldValue: 4},
      {op: DiffResultOp.Add, key: 'f', newValue: 3},
    ],
  );

  await t(
    [
      ['b', 1],
      ['d', 2],
      ['e', 4],
      ['h', 5],
      ['i', 6],
      ['j', 7],
      ['k', 8],
      ['l', 9],
    ],
    [
      ['d', 22],
      ['f', 3],
    ],
    [
      {op: DiffResultOp.Delete, key: 'b', oldValue: 1},
      {op: DiffResultOp.Change, key: 'd', oldValue: 2, newValue: 22},
      {op: DiffResultOp.Delete, key: 'e', oldValue: 4},
      {op: DiffResultOp.Add, key: 'f', newValue: 3},

      {op: DiffResultOp.Delete, key: 'h', oldValue: 5},
      {op: DiffResultOp.Delete, key: 'i', oldValue: 6},
      {op: DiffResultOp.Delete, key: 'j', oldValue: 7},
      {op: DiffResultOp.Delete, key: 'k', oldValue: 8},
      {op: DiffResultOp.Delete, key: 'l', oldValue: 9},
    ],
  );

  await t(
    [
      ['b', 1],
      ['b1', 11],
      ['d', 2],
      ['d1', 12],
      ['e', 4],
      ['e1', 14],
      ['h', 5],
      ['h1', 15],
      ['i', 6],
      ['i1', 16],
      ['j', 7],
      ['j1', 17],
      ['k', 8],
      ['k1', 18],
      ['l', 9],
      ['l1', 19],
    ],
    [
      ['l1', 19],
      ['l', 9],
      ['k1', 18],
      // ['k', 8],
      ['j1', 17],
      ['j', 7],
      ['i1', 16],
      ['i', 6],
      ['h1', 15],
      ['h', 5],
      ['e1', 141],
      ['e', 0],
      ['d1', 0],
      ['d', 0],
      ['b2', 0],
      ['b1', 0],
      ['b', 1],
    ],
    [
      {
        key: 'b1',
        newValue: 0,
        oldValue: 11,
        op: DiffResultOp.Change,
      },
      {
        key: 'b2',
        newValue: 0,
        op: DiffResultOp.Add,
      },
      {
        key: 'd',
        newValue: 0,
        oldValue: 2,
        op: DiffResultOp.Change,
      },
      {
        key: 'd1',
        newValue: 0,
        oldValue: 12,
        op: DiffResultOp.Change,
      },
      {
        key: 'e',
        newValue: 0,
        oldValue: 4,
        op: DiffResultOp.Change,
      },
      {
        key: 'e1',
        newValue: 141,
        oldValue: 14,
        op: DiffResultOp.Change,
      },
      {
        key: 'k',
        oldValue: 8,
        op: DiffResultOp.Delete,
      },
    ],
  );
});
