import {
  assertJSONValue,
  JSONValue,
  ReadonlyJSONObject,
  ReadonlyJSONValue,
} from '../json';
import * as dag from '../dag/mod';
import {stringCompare} from '../prolly/string-compare';
import {assertArray, assertObject, assertString} from '../asserts';

export type Entry<V> = [key: string, value: V];
export type ReadonlyEntry<V> = readonly [key: string, value: V];

type BaseNode<V> = {
  readonly entries: Entry<V>[];
};

export type InternalNode = BaseNode<string> & {
  readonly type: 'internal';
};

export type DataNode = BaseNode<ReadonlyJSONValue> & {
  readonly type: 'data';
};

export type BTreeNode =
  | {
      type: 'internal';
      entries: InternalNode['entries'];
    }
  | {type: 'data'; entries: DataNode['entries']};

export class Read {
  rootHash: string;
  private readonly _dagRead: dag.Read;

  readonly minSize: number;
  readonly maxSize: number;

  constructor(
    root: string,
    dagRead: dag.Read,
    minSize = 32,
    maxSize = minSize * 2,
  ) {
    this.rootHash = root;
    this._dagRead = dagRead;
    this.minSize = minSize;
    this.maxSize = maxSize;
  }

  async getNode(hash: Hash): Promise<DataNodeImpl | InternalNodeImpl> {
    const chunk = await this._dagRead.getChunk(hash);
    if (chunk === undefined) {
      throw new Error(`Missing chunk for ${hash}`);
    }
    const {data} = chunk;
    assertBTreeNode(data);
    const {type, entries} = data;
    if (data.type === 'data') {
      data.entries;
    }
    return newImpl(type, entries, hash);
  }

  async get(key: string): Promise<ReadonlyJSONValue | undefined> {
    const leaf = await findLeaf(key, this.rootHash, this);
    const index = binarySearch(key, leaf.entries);
    if (index < 0) {
      return undefined;
    }
    return leaf.entries[index][1];
  }

  async has(key: string): Promise<boolean> {
    const leaf = await findLeaf(key, this.rootHash, this);
    return binarySearch(key, leaf.entries) >= 0;
  }

  async isEmpty(): Promise<boolean> {
    const node = await this.getNode(this.rootHash);
    return node.entries.length === 0;
  }
}

// Usually the implementation of Chunk[Source|Sink] will be dag.[Read|Write].
// It can be backed by mem kv, or by idb, or by something fancier like
// a lru cache in front of idb.
interface ChunkSource {
  getNode(hash: Hash): Promise<DataNodeImpl | InternalNodeImpl>;
}

export async function findLeaf(
  key: string,
  hash: Hash,
  source: ChunkSource,
): Promise<DataNodeImpl> {
  const node = await source.getNode(hash);
  if (node.type === 'data') {
    return node as DataNodeImpl;
  }
  const internalNode = node as InternalNodeImpl;
  let index = binarySearch(key, internalNode.entries);
  if (index < 0) {
    // not found
    index = ~index;
  }
  if (index === internalNode.entries.length) {
    index--;
  }
  const entry = internalNode.entries[index]; // + (found ? 0 : 1)];
  return findLeaf(key, entry[1], source);
}

function binarySearch<V>(
  key: string,
  entries: readonly ReadonlyEntry<V>[],
): number {
  let size = entries.length;
  if (size === 0) {
    return ~0;
  }
  let base = 0;

  while (size > 1) {
    const half = Math.floor(size / 2);
    const mid = base + half;
    // mid is always in [0, size), that means mid is >= 0 and < size.
    // mid >= 0: by definition
    // mid < size: mid = size / 2 + size / 4 + size / 8 ...
    const entry = entries[mid];
    const cmp = stringCompare(entry[0], key);
    base = cmp > 0 ? base : mid;
    size -= half;
  }

  // base is always in [0, size) because base <= mid.
  const entry = entries[base];
  const cmp = stringCompare(entry[0], key);
  if (cmp === 0) {
    return base;
  }
  const index = base + (cmp === -1 ? 1 : 0);
  return ~index;
}

export function assertBTreeNode(v: unknown): asserts v is BTreeNode {
  assertObject(v);
  assertString(v.type);

  function assertEntry(
    v: unknown,
    f:
      | ((v: unknown) => asserts v is string)
      | ((v: unknown) => asserts v is JSONValue),
  ): asserts v is Entry<string | JSONValue> {
    assertArray(v);
    assertString(v[0]);
    f(v[1]);
  }

  assertArray(v.entries);
  if (v.type === 'internal') {
    v.entries.forEach(e => assertEntry(e, assertString));
  } else if (v.type === 'data') {
    v.entries.forEach(e => assertEntry(e, assertJSONValue));
  } else {
    throw new Error('invalid type');
  }
}

type Hash = string;

export class Write extends Read {
  private readonly _modified: Map<string, DataNodeImpl | InternalNodeImpl> =
    new Map();

  private readonly _dagWrite: dag.Write;

  constructor(
    root: Hash,
    dagWrite: dag.Write,
    minSize?: number,
    maxSize?: number,
  ) {
    super(root, dagWrite, minSize, maxSize);
    this._dagWrite = dagWrite;
  }

  async getNode(hash: string): Promise<DataNodeImpl | InternalNodeImpl> {
    const node = this._modified.get(hash);
    if (node) {
      return node;
    }
    return super.getNode(hash);
  }

  private _addToModified(node: DataNodeImpl | InternalNodeImpl): void {
    this._modified.set(node.hash, node);
  }

  newInternalNodeImpl(entries: Entry<string>[]): InternalNodeImpl {
    const n = new InternalNodeImpl(entries, newTempHash());
    this._addToModified(n);
    return n;
  }

  newDataNodeImpl(entries: Entry<ReadonlyJSONValue>[]): DataNodeImpl {
    const n = new DataNodeImpl(entries, newTempHash());
    this._addToModified(n);
    return n;
  }

  newNodeImpl(type: 'data', entries: Entry<ReadonlyJSONValue>[]): DataNodeImpl;
  newNodeImpl(type: 'internal', entries: Entry<string>[]): InternalNodeImpl;
  newNodeImpl(
    type: 'internal' | 'data',
    entries: Entry<string>[] | Entry<ReadonlyJSONValue>[],
  ): InternalNodeImpl | DataNodeImpl;
  newNodeImpl(
    type: 'internal' | 'data',
    entries: Entry<string>[] | Entry<ReadonlyJSONValue>[],
  ): InternalNodeImpl | DataNodeImpl {
    return type === 'internal'
      ? this.newInternalNodeImpl(entries as Entry<string>[])
      : this.newDataNodeImpl(entries);
  }

  getSize(): number {
    return 1;
  }

  async put(key: string, value: ReadonlyJSONValue): Promise<void> {
    const oldRootNode = await this.getNode(this.rootHash);
    const rootNode = await oldRootNode.set(key, value, this);

    // We do the rebalancing in the parent so we need to do it here as well.
    if (rootNode.entries.length > this.maxSize) {
      const partitions = partition(
        rootNode.entries,
        this.getSize,
        this.minSize,
        this.maxSize,
      );
      const entries: Entry<string>[] = partitions.map(entries => {
        const node = this.newNodeImpl(rootNode.type, entries);
        return [node.maxKey(), node.hash];
      });
      const newRoot = this.newInternalNodeImpl(entries);
      this.rootHash = newRoot.hash;
      return;
    }

    this.rootHash = rootNode.hash;
  }

  async del(key: string): Promise<boolean> {
    const oldRootNode = await this.getNode(this.rootHash);

    const newRootNode = await oldRootNode.del(key, this);

    // No need to rebalance here since if root gets too small there is nothing
    // we can do about that.

    const found = newRootNode !== oldRootNode;
    if (found) {
      this.rootHash = newRootNode.hash;
    }

    return found;
  }

  async flush(): Promise<string> {
    const walk = (hash: Hash, newChunks: dag.Chunk[]): string => {
      const node = this._modified.get(hash);
      if (node === undefined) {
        assertNotTempHash(hash);
        // Not modified, use the original.
        return hash;
      }
      if (node.type === 'data') {
        const chunk = dag.Chunk.new(node.toChunkData(), []);
        newChunks.push(chunk);
        return chunk.hash;
      }
      const refs: string[] = [];

      const internalNode = node as InternalNodeImpl;

      for (const entry of internalNode.entries) {
        const childHash = entry[1];
        const newChildHash = walk(childHash, newChunks);
        if (newChildHash !== childHash) {
          // MUTATES the node!
          entry[1] = newChildHash;
        }
        refs.push(newChildHash);
      }
      const chunk = dag.Chunk.new(internalNode.toChunkData(), refs);
      newChunks.push(chunk);
      return chunk.hash;
    };

    const newChunks: dag.Chunk[] = [];
    const newRoot = walk(this.rootHash, newChunks);
    await Promise.all(newChunks.map(chunk => this._dagWrite.putChunk(chunk)));

    return newRoot;
  }
}

abstract class NodeImpl<
  Value extends Hash | ReadonlyJSONValue,
  Type extends 'data' | 'internal',
> {
  entries: Entry<Value>[];
  readonly type: Type;
  hash: Hash;

  constructor(type: Type, entries: Entry<Value>[], hash: Hash) {
    this.type = type;
    this.entries = entries;
    this.hash = hash;
  }

  abstract set(
    key: string,
    value: Value,
    tree: Write,
  ): Promise<NodeImpl<Value, Type>>;

  abstract del(key: string, tree: Write): Promise<NodeImpl<Value, Type>>;

  maxKey(): string {
    return this.entries[this.entries.length - 1][0];
  }

  toChunkData(): DataNode | InternalNode {
    return {type: this.type, entries: this.entries} as DataNode | InternalNode;
  }

  getChunkSize(): number {
    return getSizeOfValue(this.toChunkData());
  }
}

class DataNodeImpl extends NodeImpl<ReadonlyJSONValue, 'data'> {
  constructor(entries: Entry<ReadonlyJSONValue>[], hash: Hash) {
    super('data', entries, hash);
  }

  async set(
    key: string,
    value: ReadonlyJSONValue,
    tree: Write,
  ): Promise<DataNodeImpl> {
    let deleteCount: number;
    let i = binarySearch(key, this.entries);
    if (i < 0) {
      // Not found, insert.
      i = ~i;
      deleteCount = 0;
    } else {
      deleteCount = 1;
    }
    const entries: Entry<ReadonlyJSONValue>[] = readonlySplice(
      this.entries,
      i,
      deleteCount,
      [key, value],
    );
    return tree.newDataNodeImpl(entries);
  }

  async del(key: string, tree: Write): Promise<DataNodeImpl> {
    const i = binarySearch(key, this.entries);
    if (i < 0) {
      // Not found. Return this without changes.
      return this;
    }

    // Found. Create new node
    const entries = readonlySplice(this.entries, i, 1);
    return tree.newDataNodeImpl(entries);
  }
}

function readonlySplice<T>(
  array: ReadonlyArray<T>,
  start: number,
  deleteCount: number,
  ...items: T[]
) {
  const arr = array.slice(0, start);
  arr.push(...items, ...array.slice(start + deleteCount));
  return arr;
}

function* joinIterables<T>(...iters: Iterable<T>[]) {
  for (const iter of iters) {
    yield* iter;
  }
}

class InternalNodeImpl extends NodeImpl<Hash, 'internal'> {
  constructor(entries: Entry<Hash>[], hash: Hash) {
    super('internal', entries, hash);
  }

  async set(
    key: string,
    value: ReadonlyJSONValue,
    tree: Write,
  ): Promise<InternalNodeImpl> {
    let i = binarySearch(key, this.entries);
    if (i < 0) {
      i = ~i;
      if (i >= this.entries.length) {
        i = this.entries.length - 1;
      }
    }

    const childHash = this.entries[i][1];
    const oldChildNode = await tree.getNode(childHash);

    const childNode = await oldChildNode.set(key, value, tree);

    let entries: Entry<string>[];

    if (childNode.entries.length > tree.maxSize) {
      let values: Iterable<Entry<string> | Entry<ReadonlyJSONValue>>;
      let startIndex: number;
      let removeCount: number;
      if (i > 0) {
        const hash = this.entries[i - 1][1];
        const previousSibling = await tree.getNode(hash);
        values = joinIterables(previousSibling.entries, childNode.entries);
        startIndex = i - 1;
        removeCount = 2;
      } else if (i < this.entries.length - 1) {
        const hash = this.entries[i + 1][1];
        const nextSibling = await tree.getNode(hash);
        values = joinIterables(childNode.entries, nextSibling.entries);
        startIndex = i;
        removeCount = 2;
      } else {
        values = childNode.entries;
        startIndex = i;
        removeCount = 1;
      }

      const partitions = partition(
        values,
        tree.getSize,
        tree.minSize,
        tree.maxSize,
      );
      const newEntries: Entry<string>[] = partitions.map(entries => {
        const node = tree.newNodeImpl(childNode.type, entries);
        return [node.maxKey(), node.hash];
      });
      entries = readonlySplice(
        this.entries,
        startIndex,
        removeCount,
        ...newEntries,
      );
    } else {
      // USE_SIZE
      // Once we use size of value the size can shrink and we can go below minSize

      entries = readonlySplice(this.entries, i, 1, [
        childNode.maxKey(),
        childNode.hash,
      ]);
    }
    return tree.newInternalNodeImpl(entries);
  }

  async del(key: string, tree: Write): Promise<InternalNodeImpl> {
    let i = binarySearch(key, this.entries);
    if (i < 0) {
      i = ~i;

      if (i >= this.entries.length) {
        i = this.entries.length - 1;
      }
    }

    const childHash = this.entries[i][1];
    const oldChildNode = await tree.getNode(childHash);

    const childNode = await oldChildNode.del(key, tree);
    if (childNode === oldChildNode) {
      return this;
    }

    if (childNode.entries.length === 0) {
      // USE_SIZE
      const entries = readonlySplice(this.entries, i, 1);
      return tree.newInternalNodeImpl(entries);
    }

    let entries = [...this.entries];

    // The child node is still a good size.
    if (childNode.entries.length > tree.minSize) {
      // USE_SIZE

      // No merging needed.
      entries[i] = [childNode.maxKey(), childNode.hash];
      return tree.newInternalNodeImpl(entries);
    }

    // Child node size is too small.
    if (i > 0) {
      // check if we can merge with left
      const otherHash = entries[i - 1][1];
      const previousSibling = await tree.getNode(otherHash);

      const partitions = partition(
        joinIterables(previousSibling.entries, childNode.entries),
        tree.getSize,
        tree.minSize,
        tree.maxSize,
      );

      if (partitions.length === 1) {
        // Remove previous sibling and move all of its entries to the child node.
        // TS cannot know other and childNode are the same type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        childNode.entries.unshift(...(previousSibling.entries as any[]));
        entries[i] = [childNode.maxKey(), childNode.hash];
        entries.splice(i - 1, 1);
      } else if (partitions.length === 2) {
        if (previousSibling.entries.length !== partitions[0].length) {
          const p =
            previousSibling.type === 'data'
              ? tree.newDataNodeImpl(partitions[0])
              : tree.newInternalNodeImpl(partitions[0] as Entry<string>[]);
          entries[i - 1] = [p.maxKey(), p.hash];
        }

        childNode.entries = partitions[1];
        entries[i] = [childNode.maxKey(), childNode.hash];
      } else {
        throw new Error('unexpected partition length');
      }
    } else if (i < entries.length - 1) {
      // check if we can merge with right
      const otherHash = entries[i + 1][1];
      const nextSibling = await tree.getNode(otherHash);

      const partitions = partition(
        joinIterables(childNode.entries, nextSibling.entries),
        tree.getSize,
        tree.minSize,
        tree.maxSize,
      );

      if (partitions.length === 1) {
        // Move all to the next sibling
        // TS cannot know other and childNode are the same type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        childNode.entries.push(...(nextSibling.entries as any[]));
        entries[i] = [childNode.maxKey(), childNode.hash];
        entries.splice(i + 1, 1);
      } else if (partitions.length === 2) {
        childNode.entries = partitions[0];
        entries[i] = [childNode.maxKey(), childNode.hash];
        if (nextSibling.entries.length !== partitions[1].length) {
          const n =
            nextSibling.type === 'data'
              ? tree.newDataNodeImpl(partitions[1])
              : tree.newInternalNodeImpl(partitions[1] as Entry<string>[]);
          entries[i + 1] = [n.maxKey(), n.hash];
        }
      } else {
        throw new Error('unexpected partition length');
      }
    } else if (i === 0 && entries.length === 1) {
      if (childNode.type === 'internal') {
        // Remove one layer of internal nodes.
        entries = childNode.entries;
      } else {
        entries[i] = [childNode.maxKey(), childNode.hash];
      }
    } else {
      entries[i] = [childNode.maxKey(), childNode.hash];
    }

    return tree.newInternalNodeImpl(entries);
  }
}

function newImpl(
  type: 'data',
  entries: DataNode['entries'],
  hash: Hash,
): DataNodeImpl;
function newImpl(
  type: 'internal',
  entries: InternalNode['entries'],
  hash: Hash,
): InternalNodeImpl;
function newImpl(
  type: 'data' | 'internal',
  entries: BTreeNode['entries'],
  hash: Hash,
): DataNodeImpl | InternalNodeImpl;
function newImpl(
  type: 'data' | 'internal',
  entries: BTreeNode['entries'],
  hash: Hash,
): DataNodeImpl | InternalNodeImpl {
  return type === 'data'
    ? new DataNodeImpl(entries as DataNode['entries'], hash)
    : new InternalNodeImpl(entries as InternalNode['entries'], hash);
}

// const mutableNodes = new WeakMap();

// function asMutable(node: BTreeNode | ReadonlyBTreeNode): BTreeNode {
//   const m = mutableNodes.get(node);
//   if (m) {
//     return m;
//   }
//   const m2 = deepClone(node) as BTreeNode;
//   mutableNodes.set(node, m2);
//   return m2;
// }

// function isPending(v: ReadonlyBTreeNode): v is BTreeNode {
//   return v[pendingSymbol] === true;
// }

/**
 * Gives a size of a value. The size is pretty arbitrary, but it is used to
 * decide where to split the btree nodes.
 */
export function getSizeOfValue(value: ReadonlyJSONValue): number {
  switch (typeof value) {
    case 'string':
      return value.length;
    case 'number':
      return 8;
    case 'boolean':
      return 1;
    case 'object':
      if (value === null) {
        return 1;
      }
      if (Array.isArray(value)) {
        return (
          value.reduce((a, v) => a + getSizeOfValue(v), 0) +
          getSizeOfValue(value.length)
        );
      }
      {
        const val = value as ReadonlyJSONObject;
        const keys = Object.keys(val);
        let sum = getSizeOfValue(keys.length);
        for (const k of Object.keys(val)) {
          sum += getSizeOfValue(k);
          const v = val[k];
          if (v !== undefined) {
            sum += getSizeOfValue(v);
          }
        }
        return sum;
      }
  }

  throw new Error('invalid value');
}

export function partition<T>(
  values: Iterable<T>,
  getSize: (v: T) => number,
  min: number,
  max: number,
): T[][] {
  const partitions: T[][] = [];
  const sizes: number[] = [];
  let sum = 0;
  let accum: T[] = [];
  for (const value of values) {
    // for (let i = 0; i < values.length; i++) {
    const size = getSize(value);
    if (size >= max) {
      if (accum.length > 0) {
        partitions.push(accum);
        sizes.push(sum);
      }
      partitions.push([value]);
      sizes.push(size);
      sum = 0;
      accum = [];
    } else if (sum + size >= min) {
      accum.push(value);
      partitions.push(accum);
      sizes.push(sum + size);
      sum = 0;
      accum = [];
    } else {
      sum += size;
      accum.push(value);
    }
  }

  if (sum > 0) {
    if (sizes.length > 0 && sum + sizes[sizes.length - 1] <= max) {
      partitions[partitions.length - 1].push(...accum);
    } else {
      partitions.push(accum);
    }
  }

  return partitions;
}

let tempHashCounter = 0;

const tempPrefix = '/t/';
const hashLength = 32;

export function newTempHash(): string {
  // Must not overlap with Hash.prototype.toString results
  return (
    tempPrefix +
    (tempHashCounter++).toString().padStart(hashLength - tempPrefix.length, '0')
  );
}

export function isTempHash(hash: string): hash is `/t/${string}` {
  return hash.startsWith('/t/');
}

export function assertNotTempHash<H extends string>(
  hash: H,
): asserts hash is H extends `/t/${string}` ? never : H {
  if (isTempHash(hash)) {
    throw new Error('must not be a temp hash');
  }
}
