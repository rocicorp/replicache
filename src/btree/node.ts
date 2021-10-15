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
  readonly entries: ReadonlyArray<Entry<V>>;
};

export type InternalNode = BaseNode<string> & {
  readonly type: 'internal';
};

export type DataNode = BaseNode<ReadonlyJSONValue> & {
  readonly type: 'data';
};

export type BTreeNode = InternalNode | DataNode;

export class BTreeRead {
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
    return newNodeImpl(type, entries, hash);
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
  entries: ReadonlyArray<ReadonlyEntry<V>>,
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

export class BTreeWrite extends BTreeRead {
  private readonly _modified: Map<string, DataNodeImpl | InternalNodeImpl> =
    new Map();

  private readonly _dagWrite: dag.Write;
  readonly getSize: <T>(e: Entry<T>) => number;

  constructor(
    root: Hash,
    dagWrite: dag.Write,
    minSize?: number,
    maxSize?: number,
    getSize?: <T>(e: Entry<T>) => number,
  ) {
    super(root, dagWrite, minSize, maxSize);
    this._dagWrite = dagWrite;
    this.getSize = getSize || (() => 1);
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

  newInternalNodeImpl(entries: ReadonlyArray<Entry<string>>): InternalNodeImpl {
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
    const n = newNodeImpl(type, entries, newTempHash());
    this._addToModified(n);
    return n;
  }

  childNodeSize(node: InternalNodeImpl | DataNodeImpl): number {
    type E = Entry<string | ReadonlyJSONValue>;
    return (node.entries as E[]).reduce(
      (p: number, entry: E) => p + this.getSize(entry),
      0,
    );
  }

  async put(key: string, value: ReadonlyJSONValue): Promise<void> {
    const oldRootNode = await this.getNode(this.rootHash);
    const rootNode = await oldRootNode.set(key, value, this);

    // We do the rebalancing in the parent so we need to do it here as well.
    if (this.childNodeSize(rootNode) > this.maxSize) {
      // if (rootNode.entries.length > this.maxSize) {
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
      // Flatten one layer.
      if (newRootNode.type === 'internal' && newRootNode.entries.length === 1) {
        this.rootHash = newRootNode.entries[0][1];
      } else {
        this.rootHash = newRootNode.hash;
      }
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
  readonly entries: ReadonlyArray<Entry<Value>>;
  readonly type: Type;
  readonly hash: Hash;

  constructor(type: Type, entries: ReadonlyArray<Entry<Value>>, hash: Hash) {
    this.type = type;
    this.entries = entries;
    this.hash = hash;
  }

  abstract set(
    key: string,
    value: Value,
    tree: BTreeWrite,
  ): Promise<NodeImpl<Value, Type>>;

  abstract del(
    key: string,
    tree: BTreeWrite,
  ): Promise<NodeImpl<Value, Type> | DataNodeImpl>;

  maxKey(): string {
    return this.entries[this.entries.length - 1][0];
  }

  toChunkData(): DataNode | InternalNode {
    return {type: this.type, entries: this.entries} as DataNode | InternalNode;
  }
}

class DataNodeImpl extends NodeImpl<ReadonlyJSONValue, 'data'> {
  constructor(entries: ReadonlyArray<Entry<ReadonlyJSONValue>>, hash: Hash) {
    super('data', entries, hash);
  }

  async set(
    key: string,
    value: ReadonlyJSONValue,
    tree: BTreeWrite,
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
    const entries = readonlySplice(this.entries, i, deleteCount, [
      key,
      value,
    ] as Entry<ReadonlyJSONValue>);
    return tree.newDataNodeImpl(entries);
  }

  async del(key: string, tree: BTreeWrite): Promise<DataNodeImpl> {
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
): T[] {
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
  constructor(entries: ReadonlyArray<Entry<Hash>>, hash: Hash) {
    super('internal', entries, hash);
  }

  async set(
    key: string,
    value: ReadonlyJSONValue,
    tree: BTreeWrite,
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

    let entries;

    const childNodeSize = tree.childNodeSize(childNode);
    if (childNodeSize > tree.maxSize || childNodeSize < tree.minSize) {
      entries = await mergeAndPartition(this.entries, i, tree, childNode);
    } else {
      entries = readonlySplice(this.entries, i, 1, [
        childNode.maxKey(),
        childNode.hash,
      ] as Entry<string>);
    }
    return tree.newInternalNodeImpl(entries);
  }

  async del(
    key: string,
    tree: BTreeWrite,
  ): Promise<InternalNodeImpl | DataNodeImpl> {
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
      const entries = readonlySplice(this.entries, i, 1);
      return tree.newInternalNodeImpl(entries);
    }

    if (i === 0 && this.entries.length === 1) {
      return childNode;
    }

    // The child node is still a good size.
    if (tree.childNodeSize(childNode) > tree.minSize) {
      // No merging needed.
      const entries = readonlySplice(this.entries, i, 1, [
        childNode.maxKey(),
        childNode.hash,
      ] as Entry<string>);
      return tree.newInternalNodeImpl(entries);
    }

    // Child node size is too small.
    const entries = await mergeAndPartition(this.entries, i, tree, childNode);
    return tree.newInternalNodeImpl(entries);
  }
}

async function mergeAndPartition(
  entries: ReadonlyArray<Entry<string>>,
  i: number,
  tree: BTreeWrite,
  childNode: DataNodeImpl | InternalNodeImpl,
): Promise<ReadonlyArray<Entry<string>>> {
  let values: Iterable<Entry<string> | Entry<ReadonlyJSONValue>>;
  let startIndex: number;
  let removeCount: number;
  if (i > 0) {
    const hash = entries[i - 1][1];
    const previousSibling = await tree.getNode(hash);
    values = joinIterables(previousSibling.entries, childNode.entries);
    startIndex = i - 1;
    removeCount = 2;
  } else if (i < entries.length - 1) {
    const hash = entries[i + 1][1];
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
  const newEntries = partitions.map(entries => {
    const node = tree.newNodeImpl(childNode.type, entries);
    return [node.maxKey(), node.hash] as Entry<string>;
  });
  return readonlySplice(entries, startIndex, removeCount, ...newEntries);
}

function newNodeImpl(
  type: 'data',
  entries: ReadonlyArray<Entry<ReadonlyJSONValue>>,
  hash: string,
): DataNodeImpl;
function newNodeImpl(
  type: 'internal',
  entries: ReadonlyArray<Entry<string>>,
  hash: string,
): InternalNodeImpl;
function newNodeImpl(
  type: 'data' | 'internal',
  entries:
    | ReadonlyArray<Entry<ReadonlyJSONValue>>
    | ReadonlyArray<Entry<string>>,
  hash: string,
): DataNodeImpl | InternalNodeImpl;
function newNodeImpl(
  type: 'data' | 'internal',
  entries:
    | ReadonlyArray<Entry<ReadonlyJSONValue>>
    | ReadonlyArray<Entry<string>>,
  hash: string,
): DataNodeImpl | InternalNodeImpl {
  return type === 'data'
    ? new DataNodeImpl(entries, hash)
    : new InternalNodeImpl(entries as Entry<string>[], hash);
}

/**
 * Gives a size of a value. The size is pretty arbitrary, but it is used to
 * decide where to split the btree nodes.
 */
export function getSizeOfValue(value: ReadonlyJSONValue): number {
  // The following outlines how Chromium serializes values for structuredClone.
  // https://source.chromium.org/chromium/chromium/src/+/main:v8/src/objects/value-serializer.cc;l=102;drc=f0b6f7d12ea47ad7c08fb554f678c1e73801ca36;bpv=1;bpt=1
  // We do not need to match that exactly but it would be good to be close.

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
