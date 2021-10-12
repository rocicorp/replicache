import {
  assertJSONValue,
  // deepClone,
  JSONValue,
  ReadonlyJSONObject,
  ReadonlyJSONValue,
} from '../json';
import * as dag from '../dag/mod';
import {stringCompare} from '../prolly/string-compare';
import {
  assertArray,
  assertNotUndefined,
  assertObject,
  assertString,
} from '../asserts';

export type Entry<V> = [key: string, value: V];
export type ReadonlyEntry<V> = readonly [key: string, value: V];

type BaseNode<V> = {
  readonly entries: Entry<V>[];
};

type ReadonlyBaseNode<V> = {
  readonly entries: readonly ReadonlyEntry<V>[];
};

export type InternalNode = BaseNode<string> & {
  readonly type: 'internal';
};

export type ReadonlyInternalNode = ReadonlyBaseNode<string> & {
  readonly type: 'internal';
};

export type DataNode = BaseNode<ReadonlyJSONValue> & {
  readonly type: 'data';
};

export type ReadonlyDataNode = ReadonlyBaseNode<ReadonlyJSONValue> & {
  readonly type: 'data';
};

export type BTreeNode = InternalNode | DataNode;

// type ReadonlyBTreeNode = ReadonlyInternalNode | ReadonlyDataNode;

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
    assertBTreeNode(chunk.data);
    return newImpl(chunk.data, hash);
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

  addToModified(node: DataNodeImpl | InternalNodeImpl): void {
    this._modified.set(node.hash, node);
  }

  updateModified(oldHash: Hash, node: DataNodeImpl | InternalNodeImpl): void {
    this._modified.delete(oldHash);
    this._modified.set(node.hash, node);
  }

  resetHashForModifiedNode(node: DataNodeImpl | InternalNodeImpl): void {
    this._modified.delete(node.hash);
    node.hash = newTempHash();
    this._modified.set(node.hash, node);
  }

  async put(key: string, value: ReadonlyJSONValue): Promise<void> {
    const rootNode = await this.getNode(this.rootHash);
    const res = await rootNode.set(key, value, this);

    if (typeof res === 'boolean') {
      this.rootHash = rootNode.hash;
      return;
    }

    const newRootNode = new InternalNodeImpl(
      [
        [rootNode.maxKey(), rootNode.hash],
        [res.maxKey(), res.hash],
      ],
      newTempHash(),
    );

    this.addToModified(newRootNode);
    this.rootHash = newRootNode.hash;
  }

  async del(key: string): Promise<boolean> {
    const rootNode = await this.getNode(this.rootHash);

    const res = await rootNode.del(key, this);

    if (res) {
      this.resetHashForModifiedNode(rootNode);
      this.rootHash = rootNode.hash;
    }

    return res;
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
        // // TODO(arv): I'm not sure this is correct. What if we added values to
        // // the data node? Should we not compute the hash here?
        // return hash;
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

type DataNodeImpl = NodeImpl<ReadonlyJSONValue, 'data'>;

class NodeImpl<
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

  async set(
    key: string,
    value: Value,
    tree: Write,
  ): Promise<boolean | NodeImpl<Value, Type>> {
    tree.resetHashForModifiedNode(this as DataNodeImpl);
    let i = binarySearch(key, this.entries);
    if (i < 0) {
      // Not found, insert.
      i = ~i;

      const oldSize = this.entries.length; // USE_SIZE
      if (oldSize < tree.maxSize) {
        this.insertInLeaf(i, key, value);
        // TODO(arv): This was mutated. We need to keep track of it
        return true;
      }
      const newRightSibling = this.splitOffRightSide();
      // TODO(arv): The type system is not a good fit here... Figure this out.
      tree.addToModified(newRightSibling as DataNodeImpl | InternalNodeImpl);
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      let target: NodeImpl<Value, Type> = this;
      if (i > this.entries.length) {
        i -= this.entries.length;
        target = newRightSibling;
      }
      target.insertInLeaf(i, key, value);
      return newRightSibling;
    }
    this.entries[i] = [key, value];
    return false;
  }

  async del(key: string, tree: Write): Promise<boolean> {
    const i = binarySearch(key, this.entries);
    if (i < 0) {
      return false;
    }

    // Found
    tree.resetHashForModifiedNode(this as DataNodeImpl);

    // Rebalancing is done in InternalNodeImpl

    this.entries.splice(i, 1);
    return true;
  }

  insertInLeaf(i: number, key: string, value: Value) {
    // TODO(arv): Inline!
    this.entries.splice(i, 0, [key, value]);
  }

  splitOffRightSide() {
    const half = this.entries.length >> 1; // USE_SIZE
    const entries = this.entries.splice(half);
    return new NodeImpl(this.type, entries, newTempHash());
  }

  takeFromRight(node: NodeImpl<Value, Type>) {
    const entry = node.entries.shift();
    assertNotUndefined(entry);
    this.entries.push(entry);
  }

  takeFromLeft(node: NodeImpl<Value, Type>) {
    const entry = node.entries.pop();
    assertNotUndefined(entry);
    this.entries.unshift(entry);
  }

  takeAllFromRight(other: NodeImpl<Value, Type>) {
    this.entries.push(...other.entries);
    other.entries.length = 0;
  }

  takeAllFromLeft(other: NodeImpl<Value, Type>) {
    this.entries.unshift(...other.entries);
    other.entries.length = 0;
  }

  maxKey(): string {
    return this.entries[this.entries.length - 1][0];
  }

  toChunkData(): DataNode | InternalNode {
    return {type: this.type, entries: this.entries} as DataNode | InternalNode;
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
  ): Promise<boolean | InternalNodeImpl> {
    const {entries} = this;
    let i = binarySearch(key, entries);
    if (i < 0) {
      i = ~i;

      if (i >= entries.length) {
        i = entries.length - 1;
      }
    }
    const childHash = entries[i][1];
    const childNode = await tree.getNode(childHash);
    // TODO(arv): MUTABLE
    if (childNode.entries.length < tree.maxSize) {
      // USE_SIZE
      if (i > 0) {
        // check if we can merge with left
        const otherHash = entries[i - 1][1];
        const other = await tree.getNode(otherHash);
        if (other.entries.length < tree.maxSize) {
          // USE_SIZE
          if (childNode.entries[0][0] < key) {
            // TS cannot know other and childNode are the same type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            other.takeFromRight(childNode as any);
            entries[i - 1][0] = other.maxKey();
          }
        }
      } else if (i < entries.length - 1) {
        // check if we can merge with right
        const otherHash = entries[i + 1][1];
        const other = await tree.getNode(otherHash);
        if (other.entries.length < tree.maxSize) {
          // USE_SIZE
          if (childNode.maxKey() < key) {
            // TS cannot know other and childNode are the same type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            other.takeFromLeft(childNode as any);
            entries[i][0] = childNode.maxKey();
          }
        }
      }
    }

    // Mutated so new hash
    tree.resetHashForModifiedNode(this);

    const res = await childNode.set(key, value, tree);
    entries[i] = [childNode.maxKey(), childNode.hash];
    if (typeof res === 'boolean') {
      return res;
    }

    // entries[i] = [res.maxKey(), res.hash];
    // The child changed
    if (entries.length < tree.maxSize) {
      // USE_SIZE
      this.insert(i + 1, res);
      return true;
    }
    // split
    const newRightSibling = this.splitOffRightSide();
    tree.addToModified(newRightSibling);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let target: InternalNodeImpl = this;
    if (res.maxKey() > this.maxKey()) {
      target = newRightSibling;
      i -= this.entries.length;
    }
    target.insert(i + 1, res);
    return newRightSibling;
  }

  async del(key: string, tree: Write): Promise<boolean> {
    const {entries} = this;
    let i = binarySearch(key, this.entries);
    if (i < 0) {
      i = ~i;

      if (i >= entries.length) {
        i = entries.length - 1;
      }
    }

    const childHash = entries[i][1];
    const childNode = await tree.getNode(childHash);

    const res = await childNode.del(key, tree);
    if (res === false) {
      return false;
    }

    // Found and removed from leaf entries
    tree.resetHashForModifiedNode(this);

    if (childNode.entries.length === 0) {
      // USE_SIZE
      this.entries.splice(i, 1);
      return true;
    }

    if (childNode.entries.length > tree.minSize) {
      // USE_SIZE
      // No merging needed.
      this.entries[i] = [childNode.maxKey(), childNode.hash];
      return true;
    }

    // Chunk is too small.
    if (i > 0) {
      // check if we can merge with left
      const otherHash = entries[i - 1][1];
      const previousSibling = await tree.getNode(otherHash);

      const partitions = partition(
        [...previousSibling.entries, ...childNode.entries],
        () => 1,
        tree.minSize,
        tree.maxSize,
      );

      if (partitions.length === 1) {
        // Move all to the previous sibling
        // TS cannot know other and childNode are the same type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        previousSibling.takeAllFromRight(childNode as any);
        tree.resetHashForModifiedNode(previousSibling);
        this.entries.splice(i, 1);
        this.entries[i - 1] = [previousSibling.maxKey(), previousSibling.hash];
      } else if (partitions.length === 2) {
        previousSibling.entries = partitions[0];
        tree.resetHashForModifiedNode(previousSibling);
        this.entries[i - 1] = [previousSibling.maxKey(), previousSibling.hash];

        childNode.entries = partitions[1];
        // ALREADY RESET tree.resetHashForModifiedNode(childNode);
        this.entries[i] = [childNode.maxKey(), childNode.hash];
      } else {
        throw new Error('unexpected partition length');
      }
    } else if (i < entries.length - 1) {
      // check if we can merge with right
      const otherHash = entries[i + 1][1];
      const nextSibling = await tree.getNode(otherHash);

      const partitions = partition(
        [...childNode.entries, ...nextSibling.entries],
        () => 1,
        tree.minSize,
        tree.maxSize,
      );

      if (partitions.length === 1) {
        // Move all to the next sibling
        // TS cannot know other and childNode are the same type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nextSibling.takeAllFromLeft(childNode as any);
        tree.resetHashForModifiedNode(nextSibling);
        this.entries.splice(i, 1);
        this.entries[i] = [nextSibling.maxKey(), nextSibling.hash];
      } else if (partitions.length === 2) {
        childNode.entries = partitions[0];
        // ALREADY RESET tree.resetHashForModifiedNode(childNode);

        this.entries[i] = [childNode.maxKey(), childNode.hash];

        nextSibling.entries = partitions[1];
        tree.resetHashForModifiedNode(nextSibling);
        this.entries[i + 1] = [nextSibling.maxKey(), nextSibling.hash];
      } else {
        throw new Error('unexpected partition length');
      }
    } else {
      // ALREADY RESET tree.resetHashForModifiedNode(childNode);

      this.entries[i] = [childNode.maxKey(), childNode.hash];
    }

    // TODO: Rebalance

    return true;
  }

  insert(i: number, node: DataNodeImpl | InternalNodeImpl) {
    // TODO(arv): Inline!
    this.entries.splice(i, 0, [node.maxKey(), node.hash]);
  }

  splitOffRightSide(): InternalNodeImpl {
    const half = this.entries.length >> 1; // USE_SIZE
    const entries = this.entries.splice(half);
    return new InternalNodeImpl(entries, newTempHash());
  }

  // takeAllFromRight(other: InternalNodeImpl) {
  //   this.entries.push(...other.entries);
  //   other.entries.length = 0;
  // }

  // takeFromRight(node: InternalNodeImpl) {
  //   const entry = node.entries.shift();
  //   assertNotUndefined(entry);
  //   this.entries.push(entry);
  // }

  // takeFromLeft(node: InternalNodeImpl) {
  //   const entry = node.entries.pop();
  //   assertNotUndefined(entry);
  //   this.entries.unshift(entry);
  // }
}

function newImpl(node: BTreeNode, hash: Hash): DataNodeImpl | InternalNodeImpl {
  return node.type === 'data'
    ? new NodeImpl(node.type, node.entries, hash)
    : new InternalNodeImpl(node.entries, hash);
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
 * Gives a size of a value. The size is pretty arbitrary, but it's used to
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
  values: T[],
  getSize: (v: T) => number,
  _min: number,
  max: number,
): T[][] {
  let start = 0;
  const partitions: T[][] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    const size = getSize(values[i]);
    sum += size;
    if (sum > max) {
      if (i > 0) {
        partitions.push(values.slice(start, i));
      }
      start = i;
      sum = size;
    }
  }

  // TODO(arv): Decide if we want the last item to be larget than max or smaller
  // than min?
  if (sum > 0) {
    partitions.push(values.slice(start));
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
