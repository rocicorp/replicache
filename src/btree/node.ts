import {assertJSONValue, JSONValue, ReadonlyJSONValue} from '../json';
import {stringCompare} from '../prolly/string-compare';
import {
  assertArray,
  assertNumber,
  assertObject,
  assertString,
} from '../asserts';
import {emptyHashString} from '../hash';
import type {BTreeRead} from './read';
import type {BTreeWrite} from './write';

export type Hash = string;

export type Entry<V> = [key: string, value: V];
export type ReadonlyEntry<V> = readonly [key: string, value: V];

type BaseNode<V> = {
  readonly e: ReadonlyArray<Entry<V>>;
};

export const enum NodeType {
  Data,
  Internal,
}

export type InternalNode = BaseNode<Hash> & {
  readonly t: NodeType.Internal;
};

export type DataNode = BaseNode<ReadonlyJSONValue> & {
  readonly t: NodeType.Data;
};

export type BTreeNode = InternalNode | DataNode;

export const enum DiffResultOp {
  Add,
  Delete,
  Change,
}

export type DiffResult =
  | {
      op: DiffResultOp.Add;
      key: string;
      newValue: ReadonlyJSONValue;
    }
  | {
      op: DiffResultOp.Delete;
      key: string;
      oldValue: ReadonlyJSONValue;
    }
  | {
      op: DiffResultOp.Change;
      key: string;
      oldValue: ReadonlyJSONValue;
      newValue: ReadonlyJSONValue;
    };

/**
 * Finds the leaf where a key is (if present) or where it should go if not
 * present.
 */
export async function findLeaf(
  key: string,
  hash: Hash,
  source: BTreeRead,
): Promise<DataNodeImpl> {
  const node = await source.getNode(hash);
  if (node.type === NodeType.Data) {
    return node;
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
  const entry = internalNode.entries[index];
  return findLeaf(key, entry[1], source);
}

/**
 * Does a binary search over entries
 *
 * If the key found then the return value is the index it was found at.
 *
 * If the key was *not* found then the retun value is the index where it should
 * be inserted at bitwise or'ed (`~index`). This is the same as `-index -1`. For
 * example if not found and needs to be inserted at `0` then we return `-1`.
 */
export function binarySearch<V>(
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
  assertNumber(v.t);

  function assertEntry(
    v: unknown,
    f:
      | ((v: unknown) => asserts v is Hash)
      | ((v: unknown) => asserts v is JSONValue),
  ): asserts v is Entry<Hash | JSONValue> {
    assertArray(v);
    assertString(v[0]);
    f(v[1]);
  }

  assertArray(v.e);
  if (v.t === NodeType.Internal) {
    v.e.forEach(e => assertEntry(e, assertString));
  } else if (v.t === NodeType.Data) {
    v.e.forEach(e => assertEntry(e, assertJSONValue));
  } else {
    throw new Error('invalid type');
  }
}

abstract class NodeImpl<
  Value extends Hash | ReadonlyJSONValue,
  Type extends NodeType.Data | NodeType.Internal,
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
    return {t: this.type, e: this.entries} as DataNode | InternalNode;
  }
}

export class DataNodeImpl extends NodeImpl<ReadonlyJSONValue, NodeType.Data> {
  constructor(entries: ReadonlyArray<Entry<ReadonlyJSONValue>>, hash: Hash) {
    super(NodeType.Data, entries, hash);
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

  async *scan(
    _tree: BTreeRead,
    prefix: string,
    fromKey: string,
    limit: number,
  ): AsyncGenerator<Entry<ReadonlyJSONValue>, number, unknown> {
    const {entries} = this;
    let i = binarySearch(fromKey, entries);
    if (i < 0) {
      i = ~i;
    }
    for (
      ;
      limit > 0 && i < entries.length && entries[i][0].startsWith(prefix);
      limit--, i++
    ) {
      yield entries[i];
    }
    return limit;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async *keys(_tree: BTreeRead): AsyncGenerator<string, void> {
    for (const entry of this.entries) {
      yield entry[0];
    }
  }

  async *entriesIter(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _tree: BTreeRead,
  ): AsyncGenerator<ReadonlyEntry<ReadonlyJSONValue>, void> {
    for (const entry of this.entries) {
      yield entry;
    }
  }
}

export const emptyDataNode = new DataNodeImpl([], emptyHashString);

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

export class InternalNodeImpl extends NodeImpl<Hash, NodeType.Internal> {
  constructor(entries: ReadonlyArray<Entry<Hash>>, hash: Hash) {
    super(NodeType.Internal, entries, hash);
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
        // We are going to insert into last (right most) leaf.
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
      ] as Entry<Hash>);
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
        // Key is larger than maxKey of rightmost entry so it is not present.
        return this;
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
      ] as Entry<Hash>);
      return tree.newInternalNodeImpl(entries);
    }

    // Child node size is too small.
    const entries = await mergeAndPartition(this.entries, i, tree, childNode);
    return tree.newInternalNodeImpl(entries);
  }

  async *scan(
    tree: BTreeRead,
    prefix: string,
    fromKey: string,
    limit: number,
  ): AsyncGenerator<Entry<ReadonlyJSONValue>, number> {
    const {entries} = this;
    let i = binarySearch(fromKey, entries);
    if (i < 0) {
      i = ~i;
      if (i >= entries.length) {
        return limit;
      }
    }
    for (; i < entries.length && limit > 0; i++) {
      const childHash = entries[i][1];
      const childNode = await tree.getNode(childHash);
      limit = yield* childNode.scan(tree, prefix, fromKey, limit);
    }
    return limit;
  }

  async *keys(tree: BTreeRead): AsyncGenerator<string, void> {
    for (const entry of this.entries) {
      const childHash = entry[1];
      const childNode = await tree.getNode(childHash);
      yield* childNode.keys(tree);
    }
  }

  async *entriesIter(
    tree: BTreeRead,
  ): AsyncGenerator<ReadonlyEntry<ReadonlyJSONValue>, void> {
    for (const entry of this.entries) {
      const childHash = entry[1];
      const childNode = await tree.getNode(childHash);
      yield* childNode.entriesIter(tree);
    }
  }
}

/**
 * This merges the child node entries with previous or next sibling and then
 * partions the merged entries.
 */
async function mergeAndPartition(
  entries: ReadonlyArray<Entry<Hash>>,
  i: number,
  tree: BTreeWrite,
  childNode: DataNodeImpl | InternalNodeImpl,
): Promise<ReadonlyArray<Entry<Hash>>> {
  let values: Iterable<Entry<Hash> | Entry<ReadonlyJSONValue>>;
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
    tree.getEntrySize,
    tree.minSize - tree.chunkHeaderSize,
    tree.maxSize - tree.chunkHeaderSize,
  );
  // TODO: There are cases where we can reuse the old nodes. Creating new ones
  // means more memory churn but also more writes to the underlying KV store.
  const newEntries = partitions.map(entries => {
    const node = tree.newNodeImpl(childNode.type, entries);
    return [node.maxKey(), node.hash] as Entry<Hash>;
  });
  return readonlySplice(entries, startIndex, removeCount, ...newEntries);
}

export function newNodeImpl(
  type: NodeType.Data,
  entries: ReadonlyArray<Entry<ReadonlyJSONValue>>,
  hash: Hash,
): DataNodeImpl;
export function newNodeImpl(
  type: NodeType.Internal,
  entries: ReadonlyArray<Entry<Hash>>,
  hash: Hash,
): InternalNodeImpl;
export function newNodeImpl(
  type: NodeType.Data | NodeType.Internal,
  entries: ReadonlyArray<Entry<ReadonlyJSONValue>> | ReadonlyArray<Entry<Hash>>,
  hash: Hash,
): DataNodeImpl | InternalNodeImpl;
export function newNodeImpl(
  type: NodeType.Data | NodeType.Internal,
  entries: ReadonlyArray<Entry<ReadonlyJSONValue>> | ReadonlyArray<Entry<Hash>>,
  hash: Hash,
): DataNodeImpl | InternalNodeImpl {
  return type === NodeType.Data
    ? new DataNodeImpl(entries, hash)
    : new InternalNodeImpl(entries as Entry<Hash>[], hash);
}

export function partition<T>(
  values: Iterable<T>,
  getValueSize: (v: T) => number,
  min: number,
  max: number,
): T[][] {
  const partitions: T[][] = [];
  const sizes: number[] = [];
  let sum = 0;
  let accum: T[] = [];
  for (const value of values) {
    // for (let i = 0; i < values.length; i++) {
    const size = getValueSize(value);
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

export function newTempHash(): Hash {
  // Must not overlap with Hash.prototype.toString results
  return (
    tempPrefix +
    (tempHashCounter++).toString().padStart(hashLength - tempPrefix.length, '0')
  );
}

export function isTempHash(hash: Hash): hash is `/t/${string}` {
  return hash.startsWith('/t/');
}

export function assertNotTempHash<H extends Hash>(
  hash: H,
): asserts hash is H extends `/t/${string}` ? never : H {
  if (isTempHash(hash)) {
    throw new Error('must not be a temp hash');
  }
}
