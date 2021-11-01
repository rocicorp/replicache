import {assertJSONValue, JSONValue, ReadonlyJSONValue} from '../json';
import {assert, assertArray, assertNumber, assertString} from '../asserts';
import {Hash, emptyHash, newTempHash} from '../hash';
import type {BTreeRead} from './read';
import type {BTreeWrite} from './write';

export type Entry<V> = [key: string, value: V];
export type ReadonlyEntry<V> = readonly [key: string, value: V];

export const NODE_LEVEL = 0;
export const NODE_ENTRIES = 1;

/**
 * The type of B+Tree node chunk data
 */
type BaseNode<V> = readonly [level: number, entries: ReadonlyArray<Entry<V>>];

export type InternalNode = BaseNode<Hash>;

export type DataNode = BaseNode<ReadonlyJSONValue>;

export const enum DiffResultOp {
  Add,
  Delete,
  Change,
}

export type DiffResult<V> =
  | {
      op: DiffResultOp.Add;
      key: string;
      newValue: V;
    }
  | {
      op: DiffResultOp.Delete;
      key: string;
      oldValue: V;
    }
  | {
      op: DiffResultOp.Change;
      key: string;
      oldValue: V;
      newValue: V;
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
  if (node.level === 0) {
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
  let {length} = entries;
  if (length === 0) {
    return ~0;
  }
  let base = 0;

  while (length > 1) {
    const half = length >> 1;
    const mid = base + half;
    // mid is always in [0, size), that means mid is >= 0 and < size.
    // mid >= 0: by definition
    // mid < size: mid = size / 2 + size / 4 + size / 8 ...
    const midKey = entries[mid][0];
    if (midKey <= key) {
      base = mid;
    }
    length -= half;
  }

  // base is always in [0, size) because base <= mid.
  const baseKey = entries[base][0];
  if (baseKey === key) {
    return base;
  }
  const index = base + (baseKey < key ? 1 : 0);
  return ~index;
}

export function assertBTreeNode(
  v: unknown,
): asserts v is InternalNode | DataNode {
  assertArray(v);

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

  assert(v.length >= 2);
  const [level, entries] = v;

  assertNumber(level);
  assertArray(entries);
  if (level > 0) {
    entries.forEach(e => assertEntry(e, assertString));
  } else {
    entries.forEach(e => assertEntry(e, assertJSONValue));
  }
}

abstract class NodeImpl<Value extends Hash | ReadonlyJSONValue> {
  readonly entries: ReadonlyArray<Entry<Value>>;
  readonly hash: Hash;
  abstract readonly level: number;

  constructor(entries: ReadonlyArray<Entry<Value>>, hash: Hash) {
    this.entries = entries;
    this.hash = hash;
  }

  abstract set(
    key: string,
    value: Value,
    tree: BTreeWrite,
  ): Promise<NodeImpl<Value>>;

  abstract del(
    key: string,
    tree: BTreeWrite,
  ): Promise<NodeImpl<Value> | DataNodeImpl>;

  maxKey(): string {
    return this.entries[this.entries.length - 1][0];
  }

  toChunkData(): DataNode | InternalNode {
    return [this.level, this.entries];
  }
}

export class DataNodeImpl extends NodeImpl<ReadonlyJSONValue> {
  readonly level = 0;

  constructor(entries: ReadonlyArray<Entry<ReadonlyJSONValue>>, hash: Hash) {
    super(entries, hash);
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

export class InternalNodeImpl extends NodeImpl<Hash> {
  readonly level: number;

  constructor(entries: ReadonlyArray<Entry<Hash>>, hash: Hash, level: number) {
    super(entries, hash);
    this.level = level;
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
      entries = await mergeAndPartition(
        this.entries,
        i,
        tree,
        childNode,
        this.level - 1,
      );
    } else {
      entries = readonlySplice(this.entries, i, 1, [
        childNode.maxKey(),
        childNode.hash,
      ] as Entry<Hash>);
    }
    return tree.newInternalNodeImpl(entries, this.level);
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
      return tree.newInternalNodeImpl(entries, this.level);
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
      return tree.newInternalNodeImpl(entries, this.level);
    }

    // Child node size is too small.
    const entries = await mergeAndPartition(
      this.entries,
      i,
      tree,
      childNode,
      this.level - 1,
    );
    return tree.newInternalNodeImpl(entries, this.level);
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

  async getChildren(
    start: number,
    length: number,
    tree: BTreeRead,
  ): Promise<Array<InternalNodeImpl | DataNodeImpl>> {
    const ps: Promise<DataNodeImpl | InternalNodeImpl>[] = [];
    for (let i = start; i < length && i < this.entries.length; i++) {
      ps.push(tree.getNode(this.entries[i][1]));
    }
    return Promise.all(ps);
  }

  async getCompositeChildren(
    start: number,
    length: number,
    tree: BTreeRead,
  ): Promise<InternalNodeImpl | DataNodeImpl> {
    const {level} = this;

    if (length === 0) {
      return new InternalNodeImpl([], newTempHash(), level - 1);
    }

    const output = await this.getChildren(start, start + length, tree);

    if (level > 1) {
      const entries: Entry<Hash>[] = [];
      for (const child of output as InternalNodeImpl[]) {
        entries.push(...child.entries);
      }
      return new InternalNodeImpl(entries, newTempHash(), level - 1);
    }

    assert(level === 1);
    const entries: Entry<ReadonlyJSONValue>[] = [];
    for (const child of output as DataNodeImpl[]) {
      entries.push(...child.entries);
    }
    return new DataNodeImpl(entries, newTempHash());
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
  level: number,
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
    const node = tree.newNodeImpl(entries, level);
    return [node.maxKey(), node.hash] as Entry<Hash>;
  });
  return readonlySplice(entries, startIndex, removeCount, ...newEntries);
}

export function newNodeImpl(
  entries: ReadonlyArray<Entry<ReadonlyJSONValue>>,
  hash: Hash,
  level: number,
): DataNodeImpl;
export function newNodeImpl(
  entries: ReadonlyArray<Entry<Hash>>,
  hash: Hash,
  level: number,
): InternalNodeImpl;
export function newNodeImpl(
  entries: ReadonlyArray<Entry<ReadonlyJSONValue>> | ReadonlyArray<Entry<Hash>>,
  hash: Hash,
  level: number,
): DataNodeImpl | InternalNodeImpl;
export function newNodeImpl(
  entries: ReadonlyArray<Entry<ReadonlyJSONValue>> | ReadonlyArray<Entry<Hash>>,
  hash: Hash,
  level: number,
): DataNodeImpl | InternalNodeImpl {
  if (level === 0) {
    return new DataNodeImpl(entries, hash);
  }
  return new InternalNodeImpl(entries as Entry<Hash>[], hash, level);
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

export const emptyDataNode = new DataNodeImpl([], emptyHash);
