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

  async *diffKeys(last: BTreeRead): AsyncGenerator<string, void> {
    for await (const {key} of this.diff(last)) {
      yield key;
    }
  }
}
