import type {Write as DagWrite} from '../dag/write';
import type {JSONValue} from '../json';
import {Map as ProllyMap} from '../prolly/mod';
import {
  Commit,
  IndexDefinition,
  newIndexChange as commitNewIndexChange,
  newLocal as commitNewLocal,
  newSnapshot as commitNewSnapshot,
} from './commit';
import {Read, readCommit, readIndexes, Whence} from './read';
import {stringToUint8Array} from './util';
import {Index, IndexOperation, indexValue} from './index';
import {startsWith} from './starts-with';
import {scanRaw} from './scan';

type IndexChangeMeta = {
  type: MetaType.IndexChange;
  lastMutationID: number;
};

type LocalMeta = {
  type: MetaType.Local;
  mutatorName: string;
  mutatorArgs: string;
  mutationID: number;
  originalHash: string | undefined;
};

type SnapshotMeta = {
  type: MetaType.Snapshot;
  lastMutationID: number;
  cookie: JSONValue;
};

type Meta = SnapshotMeta | LocalMeta | IndexChangeMeta;

const enum MetaType {
  IndexChange,
  Local,
  Snapshot,
}

export class Write {
  private readonly _dagWrite: DagWrite;
  map: ProllyMap;
  private readonly _basis: Commit | undefined;
  private readonly _meta: Meta;
  readonly indexes: Map<string, Index>;

  constructor(
    dagWrite: DagWrite,
    map: ProllyMap,
    basis: Commit | undefined,
    meta: Meta,
    indexes: Map<string, Index>,
  ) {
    this._dagWrite = dagWrite;
    this.map = map;
    this._basis = basis;
    this._meta = meta;
    this.indexes = indexes;
  }

  static async newLocal(
    whence: Whence,
    mutatorName: string,
    mutatorArgs: string,
    originalHash: string | undefined,
    dagWrite: DagWrite,
  ): Promise<Write> {
    const [, basis, map] = await readCommit(whence, dagWrite.read());
    const mutationID = basis.nextMutationID();
    const indexes = readIndexes(basis);
    return new Write(
      dagWrite,
      map,
      basis,
      {
        type: MetaType.Local,
        mutatorName,
        mutatorArgs,
        mutationID,
        originalHash,
      },
      indexes,
    );
  }

  static async newSnapshot(
    whence: Whence,
    mutationID: number,
    cookie: JSONValue,
    dagWrite: DagWrite,
    indexes: Map<string, Index>,
  ): Promise<Write> {
    const [, basis, map] = await readCommit(whence, dagWrite.read());
    return new Write(
      dagWrite,
      map,
      basis,
      {type: MetaType.Snapshot, lastMutationID: mutationID, cookie},
      indexes,
    );
  }

  static async newIndexChange(
    whence: Whence,
    dagWrite: DagWrite,
  ): Promise<Write> {
    const [, basis, map] = await readCommit(whence, dagWrite.read());
    const lastMutationID = basis.mutationID();
    const indexes = readIndexes(basis);
    return new Write(
      dagWrite,
      map,
      basis,
      {type: MetaType.IndexChange, lastMutationID},
      indexes,
    );
  }

  asRead(): Read {
    return new Read(this._dagWrite.read(), this.map, this.indexes);
  }

  isRebase(): boolean {
    return (
      this._meta.type === MetaType.Local &&
      this._meta.originalHash !== undefined
    );
  }

  async put(key: Uint8Array, val: Uint8Array): Promise<void> {
    if (this._meta.type === MetaType.IndexChange) {
      throw new Error('Not allowed');
    }
    const oldVal = this.map.get(key);
    if (oldVal !== undefined) {
      await updateIndexes(
        this.indexes,
        this._dagWrite,
        IndexOperation.Remove,
        key,
        oldVal,
      );
    }
    await updateIndexes(
      this.indexes,
      this._dagWrite,
      IndexOperation.Add,
      key,
      val,
    );

    this.map.put(key, val);
  }

  async del(key: Uint8Array): Promise<void> {
    if (this._meta.type === MetaType.IndexChange) {
      throw new Error('Not allowed');
    }

    const oldVal = this.map.get(key);
    if (oldVal !== undefined) {
      await updateIndexes(
        this.indexes,
        this._dagWrite,
        IndexOperation.Remove,
        key,
        oldVal,
      );
    }
    this.map.del(key);
  }

  async clear(): Promise<void> {
    if (this._meta.type === MetaType.IndexChange) {
      throw new Error('Not allowed');
    }

    this.map = ProllyMap.new();
    for (const idx of this.indexes.values()) {
      // TODO(arv): Parallelize this.
      await idx.clear();
    }
  }

  async createIndex(
    name: string,
    keyPrefix: Uint8Array,
    jsonPointer: string,
  ): Promise<void> {
    if (this._meta.type === MetaType.Local) {
      throw new Error('Not allowed');
    }

    const definition: IndexDefinition = {
      name,
      keyPrefix,
      jsonPointer,
    };

    // Check to see if the index already exists.
    const index = this.indexes.get(name);
    if (index) {
      const oldDefintion = index.meta.definition;
      if (
        oldDefintion.name === name &&
        oldDefintion.keyPrefix === keyPrefix &&
        oldDefintion.jsonPointer === jsonPointer
      ) {
        return;
      } else {
        throw new Error('Index exists with different definition');
      }
    }

    const indexMap = ProllyMap.new();
    for (const entry of scanRaw(this.map, {
      prefix: keyPrefix,
      limit: undefined,
      startKey: undefined,
      indexName: undefined,
    })) {
      // All the index_value errors because of customer-supplied data: malformed
      // json, json path pointing to nowhere, etc. We ignore them.

      try {
        indexValue(
          indexMap,
          IndexOperation.Add,
          entry.key,
          entry.val,
          jsonPointer,
        );
      } catch (e) {
        console.info(
          'Not indexing value',
          new TextDecoder().decode(entry.val),
          ':',
          e,
        );
      }
    }

    this.indexes.set(
      name,
      new Index(
        {
          definition,
          valueHash: '',
        },
        indexMap,
      ),
    );
  }

  async dropIndex(name: string): Promise<void> {
    if (this._meta.type === MetaType.Local) {
      throw new Error('Not allowed');
    }

    if (!this.indexes.delete(name)) {
      throw new Error(`No such index: ${name}`);
    }
  }

  // Return value is the hash of the new commit.
  async commit(headName: string): Promise<string> {
    const [hash] = await this.commitWithChangedKeys(headName, false);
    return hash;
  }

  async commitWithChangedKeys(
    headName: string,
    generateChangedKeys: boolean,
  ): Promise<[string, ChangedKeysMap]> {
    const valueChangedKeys = generateChangedKeys
      ? this.map.pendingChangedKeys()
      : [];
    const valueHash = await this.map.flush(this._dagWrite);
    const indexMetas = [];
    const keyChanges = new Map();
    if (valueChangedKeys.length > 0) {
      keyChanges.set('', valueChangedKeys);
    }
    for (const [name, index] of this.indexes) {
      {
        const indexChangedKeys = await index.withMap(
          this._dagWrite.read(),
          map => map.pendingChangedKeys(),
        );
        if (indexChangedKeys.length > 0) {
          keyChanges.set(name, indexChangedKeys);
        }
      }
      const valueHash = await index.flush(this._dagWrite);
      const {meta} = index;
      meta.valueHash = valueHash;
      indexMetas.push(meta);
    }
    const basisHash = this._basis && this._basis.chunk.hash;
    let commit;
    const meta = this._meta;
    switch (meta.type) {
      case MetaType.Local: {
        const {mutationID, mutatorName, mutatorArgs, originalHash} = meta;
        commit = await commitNewLocal(
          basisHash,
          mutationID,
          mutatorName,
          stringToUint8Array(mutatorArgs),
          originalHash,
          valueHash,
          indexMetas,
        );
        break;
      }
      case MetaType.Snapshot: {
        const {lastMutationID, cookie} = meta;
        commit = await commitNewSnapshot(
          basisHash,
          lastMutationID,
          stringToUint8Array(JSON.stringify(cookie)),
          valueHash,
          indexMetas,
        );
        break;
      }
      case MetaType.IndexChange: {
        const {lastMutationID} = meta;
        if (this._basis !== undefined) {
          if (this._basis.mutationID() !== lastMutationID) {
            throw new Error('Index change must not change mutationID');
          }
          if (this._basis.valueHash() !== valueHash) {
            throw new Error('Index change must not change valueHash');
          }
        }

        commit = await commitNewIndexChange(
          basisHash,
          lastMutationID,
          valueHash,
          indexMetas,
        );
        break;
      }
    }

    await Promise.all([
      this._dagWrite.putChunk(commit.chunk),
      this._dagWrite.setHead(headName, commit.chunk.hash),
    ]);

    await this._dagWrite.commit();

    return [commit.chunk.hash, keyChanges];
  }
}

async function updateIndexes(
  indexes: Map<string, Index>,
  dagWrite: DagWrite,
  op: IndexOperation,
  key: Uint8Array,
  val: Uint8Array,
): Promise<void> {
  for (const idx of indexes.values()) {
    if (startsWith(idx.meta.definition.keyPrefix, key)) {
      await idx.withMap(dagWrite.read(), map => {
        // Right now all the errors that index_value() returns are customers dev
        // problems: either the value is not json, the pointer is into nowhere, etc.
        // So we ignore them.

        try {
          indexValue(map, op, key, val, idx.meta.definition.jsonPointer);
        } catch (e) {
          console.info(
            'Not indexing value',
            new TextDecoder().decode(val),
            ':',
            e,
          );
        }
      });
    }
  }
}

type ChangedKeysMap = Map<string, string[]>;

export async function initDB(
  dagWrite: DagWrite,
  headName: string,
): Promise<string> {
  const w = new Write(
    dagWrite,
    ProllyMap.new(),
    undefined,
    {type: MetaType.Snapshot, lastMutationID: 0, cookie: null},
    new Map(),
  );
  return await w.commit(headName);
}
