import {IndexRead} from './index';
import * as dag from '../dag/mod';
import {convert, scan, ScanOptions, ScanOptionsInternal} from './scan';
import {Commit, DEFAULT_HEAD_NAME} from './commit';
import type {ReadonlyJSONValue} from '../json';
import {BTreeRead, BTreeWrite, Entry} from '../btree/mod';
import type {Hash} from '../hash';

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

  async *scan<R>(
    opts: ScanOptions,
    convertEntry: (entry: Entry<ReadonlyJSONValue>) => R,
    onKey?: (key: string, isInclusiveLimit: boolean) => void,
  ): AsyncIterableIterator<R> {
    const optsInternal: ScanOptionsInternal = convert(opts);
    if (optsInternal.indexName !== undefined) {
      const name = optsInternal.indexName;
      const idx = this.indexes.get(name);
      if (idx === undefined) {
        throw new Error(`Unknown index name: ${name}`);
      }
      yield* await idx.withMap(this._dagRead, map =>
        scan(map, optsInternal, convertEntry, onKey),
      );
    } else {
      yield* scan(this.map, optsInternal, convertEntry, onKey);
    }
  }

  get closed(): boolean {
    return this._dagRead.closed;
  }

  close(): void {
    this._dagRead.close();
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
  const [, basis, map] = await readCommit(whence, dagRead);
  const indexex = readIndexesForRead(basis);
  return new Read(dagRead, map, indexex);
}

export function readCommit(
  whence: Whence,
  dagRead: dag.Write,
): Promise<[Hash, Commit, BTreeWrite]>;
export function readCommit(
  whence: Whence,
  dagRead: dag.Read,
): Promise<[Hash, Commit, BTreeRead]>;
export async function readCommit(
  whence: Whence,
  dagRead: dag.Read,
): Promise<[Hash, Commit, BTreeRead]> {
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

  const commit = await Commit.fromHash(hash, dagRead);
  const map =
    dagRead instanceof dag.Write
      ? new BTreeWrite(dagRead, commit.valueHash)
      : new BTreeRead(dagRead, commit.valueHash);
  return [hash, commit, map];
}

export function readIndexesForRead(commit: Commit): Map<string, IndexRead> {
  const m = new Map();
  for (const index of commit.indexes) {
    m.set(index.definition.name, new IndexRead(index, undefined));
  }
  return m;
}
