import {
  assertJSONValue,
  deepEqual,
  JSONValue,
  ReadonlyJSONValue,
} from '../json';
import * as dag from '../dag/mod';
import {stringCompare} from '../prolly/string-compare';
import {
  assertArray,
  assertNumber,
  assertObject,
  assertString,
} from '../asserts';
import type {ScanOptionsInternal} from '../db/scan';
import {emptyHashString} from '../hash';

type Hash = string;

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

export class BTreeRead {
  rootHash: Hash;
  protected readonly _dagRead: dag.Read;
  private readonly _cache: Map<Hash, DataNodeImpl | InternalNodeImpl> =
    new Map();

  readonly getEntrySize: <T>(e: Entry<T>) => number;
  readonly chunkHeaderSize: number;

  constructor(
    dagRead: dag.Read,
    root: Hash = emptyHashString,
    getEntrySize: <T>(e: Entry<T>) => number = () => 1,
    chunkHeaderSize = 0,
  ) {
    this.rootHash = root;
    this._dagRead = dagRead;
    this.getEntrySize = getEntrySize;
    this.chunkHeaderSize = chunkHeaderSize;
  }

  async getNode(hash: Hash): Promise<DataNodeImpl | InternalNodeImpl> {
    if (hash === emptyHashString) {
      return emptyDataNode;
    }

    const cached = this._cache.get(hash);
    if (cached) {
      return cached;
    }

    const chunk = await this._dagRead.getChunk(hash);
    if (chunk === undefined) {
      throw new Error(`Missing chunk for ${hash}`);
    }
    const {data} = chunk;
    assertBTreeNode(data);
    const {t: type, e: entries} = data;
    const impl = newNodeImpl(type, entries, hash);
    this._cache.set(hash, impl);
    return impl;
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

  async *scan(
    options: ScanOptionsInternal,
  ): AsyncIterable<Entry<ReadonlyJSONValue>> {
    const node = await this.getNode(this.rootHash);
    const {prefix = '', limit = Infinity, startKey} = options;
    let fromKey = prefix;
    if (startKey !== undefined) {
      if (startKey > fromKey) {
        fromKey = startKey;
      }
    }

    yield* node.scan(this, prefix, fromKey, limit);
  }

  async *diff(last: BTreeRead): AsyncGenerator<DiffResult, void> {
    // This is an O(n+m) solution. We can do better because we can skip common
    // subtrees but it requires more work.
    const newIter = this.scan({})[Symbol.asyncIterator]();
    const oldIter = last.scan({})[Symbol.asyncIterator]();

    let [newIterResult, oldIterResult] = await Promise.all([
      newIter.next(),
      oldIter.next(),
    ]);
    while (!newIterResult.done && !oldIterResult.done) {
      const newEntry = newIterResult.value;
      const [newKey, newValue] = newEntry;
      const oldEntry = oldIterResult.value;
      const [oldKey, oldValue] = oldEntry;
      if (newKey === oldKey) {
        if (!deepEqual(newValue, oldValue)) {
          yield {
            op: DiffResultOp.Change,
            key: newKey,
            oldValue: oldEntry[1],
            newValue: newEntry[1],
          };
        }
        [newIterResult, oldIterResult] = await Promise.all([
          newIter.next(),
          oldIter.next(),
        ]);
      } else if (newKey < oldKey) {
        yield {op: DiffResultOp.Add, key: newKey, newValue};
        newIterResult = await newIter.next();
      } else {
        yield {op: DiffResultOp.Delete, key: oldKey, oldValue};
        oldIterResult = await oldIter.next();
      }
    }

    while (!newIterResult.done) {
      const entry = newIterResult.value;
      yield {op: DiffResultOp.Add, key: entry[0], newValue: entry[1]};
      newIterResult = await newIter.next();
    }

    while (!oldIterResult.done) {
      const entry = oldIterResult.value;
      yield {op: DiffResultOp.Delete, key: entry[0], oldValue: entry[1]};
      oldIterResult = await oldIter.next();
    }
  }
}

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

export class BTreeWrite extends BTreeRead {
  private readonly _modified: Map<Hash, DataNodeImpl | InternalNodeImpl> =
    new Map();

  protected declare _dagRead: dag.Write;

  readonly minSize: number;
  readonly maxSize: number;

  constructor(
    dagWrite: dag.Write,
    root: Hash = emptyHashString,
    minSize = 32,
    maxSize = minSize * 2,
    getEntrySize?: <T>(e: Entry<T>) => number,
    chunkHeaderSize?: number,
  ) {
    super(dagWrite, root, getEntrySize, chunkHeaderSize);
    this.minSize = minSize;
    this.maxSize = maxSize;
  }

  async getNode(hash: Hash): Promise<DataNodeImpl | InternalNodeImpl> {
    const node = this._modified.get(hash);
    if (node) {
      return node;
    }
    return super.getNode(hash);
  }

  private _addToModified(node: DataNodeImpl | InternalNodeImpl): void {
    this._modified.set(node.hash, node);
  }

  newInternalNodeImpl(entries: ReadonlyArray<Entry<Hash>>): InternalNodeImpl {
    const n = new InternalNodeImpl(entries, newTempHash());
    this._addToModified(n);
    return n;
  }

  newDataNodeImpl(entries: Entry<ReadonlyJSONValue>[]): DataNodeImpl {
    const n = new DataNodeImpl(entries, newTempHash());
    this._addToModified(n);
    return n;
  }

  newNodeImpl(
    type: NodeType.Data,
    entries: Entry<ReadonlyJSONValue>[],
  ): DataNodeImpl;
  newNodeImpl(
    type: NodeType.Internal,
    entries: Entry<Hash>[],
  ): InternalNodeImpl;
  newNodeImpl(
    type: NodeType,
    entries: Entry<Hash>[] | Entry<ReadonlyJSONValue>[],
  ): InternalNodeImpl | DataNodeImpl;
  newNodeImpl(
    type: NodeType,
    entries: Entry<Hash>[] | Entry<ReadonlyJSONValue>[],
  ): InternalNodeImpl | DataNodeImpl {
    const n = newNodeImpl(type, entries, newTempHash());
    this._addToModified(n);
    return n;
  }

  childNodeSize(node: InternalNodeImpl | DataNodeImpl): number {
    let sum = this.chunkHeaderSize;
    for (const entry of node.entries) {
      sum += this.getEntrySize(entry);
    }
    return sum;
  }

  async put(key: string, value: ReadonlyJSONValue): Promise<void> {
    const oldRootNode = await this.getNode(this.rootHash);
    const rootNode = await oldRootNode.set(key, value, this);

    // We do the rebalancing in the parent so we need to do it here as well.
    if (this.childNodeSize(rootNode) > this.maxSize) {
      const headerSize = this.chunkHeaderSize;
      const partitions = partition(
        rootNode.entries,
        this.getEntrySize,
        this.minSize - headerSize,
        this.maxSize - headerSize,
      );
      const entries: Entry<Hash>[] = partitions.map(entries => {
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
      // TODO(arv): Should we restore back to emptyHash if empty?

      // Flatten one layer.
      if (
        newRootNode.type === NodeType.Internal &&
        newRootNode.entries.length === 1
      ) {
        this.rootHash = newRootNode.entries[0][1];
      } else {
        this.rootHash = newRootNode.hash;
      }
    }

    return found;
  }

  async flush(): Promise<Hash> {
    const walk = (hash: Hash, newChunks: dag.Chunk[]): Hash => {
      const node = this._modified.get(hash);
      if (node === undefined) {
        assertNotTempHash(hash);
        // Not modified, use the original.
        return hash;
      }
      if (node.type === NodeType.Data) {
        const chunk = dag.Chunk.new(node.toChunkData(), []);
        newChunks.push(chunk);
        return chunk.hash;
      }
      const refs: Hash[] = [];

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

    if (this.rootHash === emptyHashString) {
      return emptyHashString;
    }

    const newChunks: dag.Chunk[] = [];
    const newRoot = walk(this.rootHash, newChunks);
    const dagWrite = this._dagRead;
    await Promise.all(newChunks.map(chunk => dagWrite.putChunk(chunk)));

    return newRoot;
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

class DataNodeImpl extends NodeImpl<ReadonlyJSONValue, NodeType.Data> {
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
}

const emptyDataNode = new DataNodeImpl([], emptyHashString);

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

class InternalNodeImpl extends NodeImpl<Hash, NodeType.Internal> {
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

function newNodeImpl(
  type: NodeType.Data,
  entries: ReadonlyArray<Entry<ReadonlyJSONValue>>,
  hash: Hash,
): DataNodeImpl;
function newNodeImpl(
  type: NodeType.Internal,
  entries: ReadonlyArray<Entry<Hash>>,
  hash: Hash,
): InternalNodeImpl;
function newNodeImpl(
  type: NodeType.Data | NodeType.Internal,
  entries: ReadonlyArray<Entry<ReadonlyJSONValue>> | ReadonlyArray<Entry<Hash>>,
  hash: Hash,
): DataNodeImpl | InternalNodeImpl;
function newNodeImpl(
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
