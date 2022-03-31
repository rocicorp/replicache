import {IndexRead} from './index';
import type * as dag from '../dag/mod';
import {
  Commit,
  DEFAULT_HEAD_NAME,
  fromHash as commitFromHash,
  Meta,
} from './commit';
import type {ReadonlyJSONValue} from '../json';
import {BTreeRead, BTreeWrite} from '../btree/mod';
import type {Hash} from '../hash';
import type {ScanReader} from '../scan-reader.js';
import {isScanIndexOptions, ScanOptions} from '../scan-options.js';

export class Read {
  private readonly _dagRead: dag.Read;
  map: BTreeRead;
  readonly indexes: Map<string, IndexRead>;

  constructor(
    dagRead: dag.Read,
    map: BTreeRead,
    indexes: Map<string, IndexRead>,
  ) {
    this._dagRead = dagRead;
    this.map = map;
    this.indexes = indexes;
  }

  has(key: string): Promise<boolean> {
    return this.map.has(key);
  }

  get(key: string): Promise<ReadonlyJSONValue | undefined> {
    return this.map.get(key);
  }

  isEmpty(): Promise<boolean> {
    return this.map.isEmpty();
  }

  async scanReader(options: ScanOptions): Promise<ScanReader> {
    if (isScanIndexOptions(options)) {
      const map = await this.getMapForIndex(options.indexName);
      return map.scanReader();
    }
    return this.map.scanReader();
  }

  get closed(): boolean {
    return this._dagRead.closed;
  }

  close(): void {
    this._dagRead.close();
  }

  async getMapForIndex(indexName: string): Promise<BTreeRead> {
    const idx = this.indexes.get(indexName);
    if (idx === undefined) {
      throw new Error(`Unknown index name: ${indexName}`);
    }
    return idx.withMap(this._dagRead, map => map);
  }
}

const enum WhenceType {
  Head,
  Hash,
}

export type Whence =
  | {
      type: WhenceType.Hash;
      hash: Hash;
    }
  | {
      type: WhenceType.Head;
      name: string;
    };

export function whenceHead(name: string): Whence {
  return {
    type: WhenceType.Head,
    name,
  };
}

export function whenceHash(hash: Hash): Whence {
  return {
    type: WhenceType.Hash,
    hash,
  };
}

export function readFromDefaultHead(dagRead: dag.Read): Promise<Read> {
  return fromWhence(whenceHead(DEFAULT_HEAD_NAME), dagRead);
}

export async function fromWhence(
  whence: Whence,
  dagRead: dag.Read,
): Promise<Read> {
  const [, basis, map] = await readCommitForBTreeRead(whence, dagRead);
  const indexes = readIndexesForRead(basis);
  return new Read(dagRead, map, indexes);
}

export async function readCommit(
  whence: Whence,
  dagRead: dag.Read,
): Promise<[Hash, Commit<Meta>]> {
  let hash: Hash;
  switch (whence.type) {
    case WhenceType.Hash:
      hash = whence.hash;
      break;
    case WhenceType.Head: {
      const h = await dagRead.getHead(whence.name);
      if (h === undefined) {
        throw new Error(`Unknown head: ${whence.name}`);
      }
      hash = h;
      break;
    }
  }

  const commit = await commitFromHash(hash, dagRead);
  return [hash, commit];
}

export async function readCommitForBTreeRead(
  whence: Whence,
  dagRead: dag.Read,
): Promise<[Hash, Commit<Meta>, BTreeRead]> {
  const [hash, commit] = await readCommit(whence, dagRead);
  return [hash, commit, new BTreeRead(dagRead, commit.valueHash)];
}

export async function readCommitForBTreeWrite(
  whence: Whence,
  dagWrite: dag.Write,
): Promise<[Hash, Commit<Meta>, BTreeWrite]> {
  const [hash, commit] = await readCommit(whence, dagWrite);
  return [hash, commit, new BTreeWrite(dagWrite, commit.valueHash)];
}

export function readIndexesForRead(
  commit: Commit<Meta>,
): Map<string, IndexRead> {
  const m = new Map();
  for (const index of commit.indexes) {
    m.set(index.definition.name, new IndexRead(index, undefined));
  }
  return m;
}
