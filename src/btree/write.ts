import type {ReadonlyJSONValue} from '../json';
import * as dag from '../dag/mod';
import {Hash, emptyHash, newTempHash} from '../hash';
import {BTreeRead} from './read';
import {
  DataNodeImpl,
  InternalNodeImpl,
  Entry,
  newNodeImpl,
  partition,
  ReadonlyEntry,
  DiffResult,
} from './node';
import {RWLock} from '../rw-lock';
import type {ScanOptionsInternal} from '../db/scan';

export class BTreeWrite extends BTreeRead {
  /**
   * This rw lock is used to ensure we do not mutate the btree in parallel. It
   * would be a problem if we didn't have the lock in cases like this:
   *
   * ```ts
   * const p1 = tree.put('a', 0);
   * const p2 = tree.put('b', 1);
   * await p1;
   * await p2;
   * ```
   *
   * because both `p1` and `p2` would start from the old root hash but a put
   * changes the root hash so the two concurrent puts would lead to only one of
   * them actually working, and it is not deterministic which one would finish
   * last.
   */
  private readonly _rwLock = new RWLock();
  private readonly _modified: Map<Hash, DataNodeImpl | InternalNodeImpl> =
    new Map();

  protected declare _dagRead: dag.Write;

  readonly minSize: number;
  readonly maxSize: number;

  constructor(
    dagWrite: dag.Write,
    root: Hash = emptyHash,
    minSize = 8 * 1024,
    maxSize = 16 * 1024,
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

  newInternalNodeImpl(
    entries: ReadonlyArray<Entry<Hash>>,
    level: number,
  ): InternalNodeImpl {
    const n = new InternalNodeImpl(entries, newTempHash(), level);
    this._addToModified(n);
    return n;
  }

  newDataNodeImpl(entries: Entry<ReadonlyJSONValue>[]): DataNodeImpl {
    const n = new DataNodeImpl(entries, newTempHash());
    this._addToModified(n);
    return n;
  }

  newNodeImpl(entries: Entry<ReadonlyJSONValue>[], level: number): DataNodeImpl;
  newNodeImpl(entries: Entry<Hash>[], level: number): InternalNodeImpl;
  newNodeImpl(
    entries: Entry<Hash>[] | Entry<ReadonlyJSONValue>[],
    level: number,
  ): InternalNodeImpl | DataNodeImpl;
  newNodeImpl(
    entries: Entry<Hash>[] | Entry<ReadonlyJSONValue>[],
    level: number,
  ): InternalNodeImpl | DataNodeImpl {
    const n = newNodeImpl(entries, newTempHash(), level);
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

  // Override BTree to wrap all of these in a read lock
  override get(key: string): Promise<ReadonlyJSONValue | undefined> {
    return this._rwLock.withRead(() => super.get(key));
  }

  override has(key: string): Promise<boolean> {
    return this._rwLock.withRead(() => super.has(key));
  }

  override isEmpty(): Promise<boolean> {
    return this._rwLock.withRead(() => super.isEmpty());
  }

  override async *scan(
    options: ScanOptionsInternal,
  ): AsyncGenerator<Entry<ReadonlyJSONValue>> {
    yield* runRead(this._rwLock, super.scan(options));
  }

  override async *keys(): AsyncGenerator<string, void> {
    yield* runRead(this._rwLock, super.keys());
  }

  async *entries(): AsyncGenerator<ReadonlyEntry<ReadonlyJSONValue>, void> {
    yield* runRead(this._rwLock, super.entries());
  }

  override async *diff(
    last: BTreeRead,
  ): AsyncGenerator<DiffResult<ReadonlyJSONValue>, void> {
    yield* runRead(this._rwLock, super.diff(last));
  }

  override async *diffKeys(last: BTreeRead): AsyncGenerator<string, void> {
    yield* runRead(this._rwLock, super.diffKeys(last));
  }

  put(key: string, value: ReadonlyJSONValue): Promise<void> {
    return this._rwLock.withWrite(async () => {
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
        const {level} = rootNode;
        const entries: Entry<Hash>[] = partitions.map(entries => {
          const node = this.newNodeImpl(entries, level);
          return [node.maxKey(), node.hash];
        });
        const newRoot = this.newInternalNodeImpl(entries, level + 1);
        this.rootHash = newRoot.hash;
        return;
      }

      this.rootHash = rootNode.hash;
    });
  }

  del(key: string): Promise<boolean> {
    return this._rwLock.withWrite(async () => {
      const oldRootNode = await this.getNode(this.rootHash);
      const newRootNode = await oldRootNode.del(key, this);

      // No need to rebalance here since if root gets too small there is nothing
      // we can do about that.
      const found = newRootNode !== oldRootNode;
      if (found) {
        // TODO(arv): Should we restore back to emptyHash if empty?
        // Flatten one layer.
        if (newRootNode.level > 0 && newRootNode.entries.length === 1) {
          this.rootHash = (newRootNode as InternalNodeImpl).entries[0][1];
        } else {
          this.rootHash = newRootNode.hash;
        }
      }

      return found;
    });
  }

  clear(): Promise<void> {
    return this._rwLock.withWrite(async () => {
      this._modified.clear();
      this.rootHash = emptyHash;
    });
  }

  flush(): Promise<Hash> {
    const walk = (hash: Hash, newChunks: dag.Chunk[]): Hash => {
      const node = this._modified.get(hash);
      if (node === undefined) {
        // Not modified, use the original.
        return hash;
      }
      if (node.level === 0) {
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

    return this._rwLock.withWrite(async () => {
      if (this.rootHash === emptyHash) {
        return emptyHash;
      }

      const newChunks: dag.Chunk[] = [];
      const newRoot = walk(this.rootHash, newChunks);
      const dagWrite = this._dagRead;
      await Promise.all(newChunks.map(chunk => dagWrite.putChunk(chunk)));

      this._modified.clear();

      this.rootHash = newRoot;
      return newRoot;
    });
  }
}
async function* runRead<T>(
  lock: RWLock,
  ai: AsyncGenerator<T>,
): AsyncGenerator<T> {
  const release = await lock.read();
  try {
    yield* ai;
  } finally {
    release();
  }
}
