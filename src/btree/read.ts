import {deepEqual, ReadonlyJSONValue} from '../json';
import type * as dag from '../dag/mod';
import type {ScanOptionsInternal} from '../db/scan';
import {emptyHashString} from '../hash';
import {
  Hash,
  DataNodeImpl,
  InternalNodeImpl,
  Entry,
  emptyDataNode,
  assertBTreeNode,
  newNodeImpl,
  findLeaf,
  binarySearch,
  DiffResult,
  DiffResultOp,
  ReadonlyEntry,
} from './node';
import {getSizeOfValue, NODE_HEADER_SIZE} from './get-size-of-value';
import {
  computeSplices,
  SPLICE_ADDED,
  SPLICE_AT,
  SPLICE_FROM,
  SPLICE_REMOVED,
} from './splice';

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
    getEntrySize: <T>(e: Entry<T>) => number = getSizeOfValue,
    chunkHeaderSize = NODE_HEADER_SIZE,
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
    const {l: level, e: entries} = data;
    const impl = newNodeImpl(entries, hash, level);
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
  ): AsyncGenerator<Entry<ReadonlyJSONValue>> {
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

  async *keys(): AsyncGenerator<string, void> {
    const node = await this.getNode(this.rootHash);
    yield* node.keys(this);
  }

  async *entries(): AsyncGenerator<ReadonlyEntry<ReadonlyJSONValue>, void> {
    const node = await this.getNode(this.rootHash);
    yield* node.entriesIter(this);
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<
    ReadonlyEntry<ReadonlyJSONValue>
  > {
    return this.entries();
  }

  async *diff(
    last: BTreeRead,
  ): AsyncGenerator<DiffResult<ReadonlyJSONValue>, void> {
    const [currentNode, lastNode] = await Promise.all([
      this.getNode(this.rootHash),
      last.getNode(last.rootHash),
    ]);
    yield* diffNodes(lastNode, currentNode, last, this);
  }

  async *diffKeys(last: BTreeRead): AsyncGenerator<string, void> {
    for await (const {key} of this.diff(last)) {
      yield key;
    }
  }
}

async function* diffNodes(
  last: InternalNodeImpl | DataNodeImpl,
  current: InternalNodeImpl | DataNodeImpl,
  lastTree: BTreeRead,
  currentTree: BTreeRead,
): AsyncGenerator<DiffResult<ReadonlyJSONValue>, void> {
  if (last.level > current.level) {
    // merge all of last's children into a new node
    // We know last is an internal node because level > 0.
    const lastChild = (await (last as InternalNodeImpl).getCompositeChildren(
      0,
      last.entries.length,
      lastTree,
    )) as InternalNodeImpl;
    yield* diffNodes(lastChild, current, lastTree, currentTree);
    return;
  }

  if (current.level > last.level) {
    // We know current is an internal node because level > 0.
    const currentChild = (await (
      current as InternalNodeImpl
    ).getCompositeChildren(
      0,
      current.entries.length,
      currentTree,
    )) as InternalNodeImpl;
    yield* diffNodes(last, currentChild, lastTree, currentTree);
    return;
  }

  if (last.level === 0 && current.level === 0) {
    yield* diffEntries(last.entries, current.entries);
    return;
  }

  // Now we have two internal nodes with the same level. We compute the diff as
  // splices for the internal node entries. We then flatten these and call diff
  // recursively.
  const initialSplices = computeSplices(last.entries, current.entries);
  for (const splice of initialSplices) {
    const [lastChild, currentChild] = await Promise.all([
      (last as InternalNodeImpl).getCompositeChildren(
        splice[SPLICE_AT],
        splice[SPLICE_REMOVED],
        lastTree,
      ),
      (current as InternalNodeImpl).getCompositeChildren(
        splice[SPLICE_FROM],
        splice[SPLICE_ADDED],
        currentTree,
      ),
    ]);
    yield* diffNodes(lastChild, currentChild, lastTree, currentTree);
  }
}

function* diffEntries<T>(
  lastEntries: ReadonlyArray<ReadonlyEntry<T>>,
  currentEntries: ReadonlyArray<ReadonlyEntry<T>>,
): Generator<DiffResult<ReadonlyJSONValue>, void> {
  const lastLength = lastEntries.length;
  const currentLength = currentEntries.length;
  let i = 0;
  let j = 0;
  while (i < lastLength && j < currentLength) {
    const lastKey = lastEntries[i][0];
    const currentKey = currentEntries[j][0];
    if (lastKey === currentKey) {
      if (!deepEqual(lastEntries[i][1], currentEntries[j][1])) {
        yield {
          op: DiffResultOp.Change,
          key: lastKey,
          oldValue: lastEntries[i][1],
          newValue: currentEntries[j][1],
        };
      }
      i++;
      j++;
    } else if (lastKey < currentKey) {
      yield {
        op: DiffResultOp.Delete,
        key: lastKey,
        oldValue: lastEntries[i][1],
      };
      i++;
    } else {
      yield {
        op: DiffResultOp.Add,
        key: currentKey,
        newValue: currentEntries[j][1],
      };
      j++;
    }
  }
  for (; i < lastLength; i++) {
    yield {
      op: DiffResultOp.Delete,
      key: lastEntries[i][0],
      oldValue: lastEntries[i][1],
    };
  }
  for (; j < currentLength; j++) {
    yield {
      op: DiffResultOp.Add,
      key: currentEntries[j][0],
      newValue: currentEntries[j][1],
    };
  }
}
