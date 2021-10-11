import {Index} from './index';
import type * as dag from '../dag/mod';
import * as prolly from '../prolly/mod';
import {
  convert,
  scan,
  ScanOptions,
  ScanOptionsInternal,
  ScanResult,
} from './scan';
import {Commit, DEFAULT_HEAD_NAME} from './commit';
import type {ReadonlyJSONValue} from '../json';

export class Read {
  private readonly _dagRead: dag.Read;
  map: prolly.Map;
  readonly indexes: Map<string, Index>;

  constructor(dagRead: dag.Read, map: prolly.Map, indexes: Map<string, Index>) {
    this._dagRead = dagRead;
    this.map = map;
    this.indexes = indexes;
  }

  has(key: string): boolean {
    return this.map.has(key);
  }

  get(key: string): ReadonlyJSONValue | undefined {
    return this.map.get(key);
  }

  isEmpty(): boolean {
    return this.map.isEmpty();
  }

  async scan(
    opts: ScanOptions,
    callback: (s: ScanResult) => void,
  ): Promise<void> {
    const optsInternal: ScanOptionsInternal = convert(opts);
    if (optsInternal.indexName !== undefined) {
      const name = optsInternal.indexName;
      const idx = this.indexes.get(name);
      if (idx === undefined) {
        throw new Error(`Unknown index name: ${name}`);
      }

      await idx.withMap(this._dagRead, map => {
        for (const item of scan(map, optsInternal)) {
          callback(item);
        }
      });
    } else {
      for (const item of scan(this.map, optsInternal)) {
        callback(item);
      }
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
      hash: string;
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

export function whenceHash(hash: string): Whence {
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
  const indexex = readIndexes(basis);
  return new Read(dagRead, map, indexex);
}

export async function readCommit(
  whence: Whence,
  read: dag.Read,
): Promise<[string, Commit, prolly.Map]> {
  let hash: string;
  switch (whence.type) {
    case WhenceType.Hash:
      hash = whence.hash;
      break;
    case WhenceType.Head: {
      const h = await read.getHead(whence.name);
      if (h === undefined) {
        throw new Error(`Unknown head: ${whence.name}`);
      }
      hash = h;
      break;
    }
  }

  const commit = await Commit.fromHash(hash, read);
  const map = await prolly.Map.load(commit.valueHash, read);
  return [hash, commit, map];
}

export function readIndexes(commit: Commit): Map<string, Index> {
  const m = new Map();
  for (const index of commit.indexes) {
    m.set(index.definition.name, new Index(index, undefined));
  }
  return m;
}
