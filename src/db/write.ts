import type * as dag from '../dag/mod';
import type {ReadonlyJSONValue} from '../json';
import * as prolly from '../prolly/mod';
import {
  Commit,
  IndexDefinition,
  newIndexChange as commitNewIndexChange,
  newLocal as commitNewLocal,
  newSnapshot as commitNewSnapshot,
} from './commit';
import {Read, readCommit, readIndexes, Whence} from './read';
import {Index, IndexOperation, indexValue} from './index';
import {scanRaw} from './scan';
import type {LogContext} from '../logger';

type IndexChangeMeta = {
  type: MetaType.IndexChange;
  lastMutationID: number;
};

type LocalMeta = {
  type: MetaType.Local;
  mutatorName: string;
  mutatorArgs: ReadonlyJSONValue;
  mutationID: number;
  originalHash: string | undefined;
};

type SnapshotMeta = {
  type: MetaType.Snapshot;
  lastMutationID: number;
  cookie: ReadonlyJSONValue;
};

type Meta = SnapshotMeta | LocalMeta | IndexChangeMeta;

const enum MetaType {
  IndexChange,
  Local,
  Snapshot,
}

export class Write {
  private readonly _dagWrite: dag.Write;
  map: prolly.Map;
  private readonly _basis: Commit | undefined;
  private readonly _meta: Meta;
  readonly indexes: Map<string, Index>;

  constructor(
    dagWrite: dag.Write,
    map: prolly.Map,
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
    mutatorArgs: ReadonlyJSONValue,
    originalHash: string | undefined,
    dagWrite: dag.Write,
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
    cookie: ReadonlyJSONValue,
    dagWrite: dag.Write,
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
    dagWrite: dag.Write,
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

  async put(
    lc: LogContext,
    key: string,
    val: ReadonlyJSONValue,
  ): Promise<void> {
    if (this._meta.type === MetaType.IndexChange) {
      throw new Error('Not allowed');
    }
    const oldVal = this.map.get(key);
    if (oldVal !== undefined) {
      await updateIndexes(
        lc,
        this.indexes,
        this._dagWrite,
        IndexOperation.Remove,
        key,
        oldVal,
      );
    }
    await updateIndexes(
      lc,
      this.indexes,
      this._dagWrite,
      IndexOperation.Add,
      key,
      val,
    );

    this.map.put(key, val);
  }

  async del(lc: LogContext, key: string): Promise<void> {
    if (this._meta.type === MetaType.IndexChange) {
      throw new Error('Not allowed');
    }

    const oldVal = this.map.get(key);
    if (oldVal !== undefined) {
      await updateIndexes(
        lc,
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

    this.map = prolly.Map.new();
    for (const idx of this.indexes.values()) {
      // TODO(arv): Parallelize this.
      await idx.clear();
    }
  }

  async createIndex(
    lc: LogContext,
    name: string,
    keyPrefix: string,
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

    const indexMap = prolly.Map.new();
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
          entry[0],
          entry[1],
          jsonPointer,
        );
      } catch (e) {
        lc.info?.('Not indexing value', entry[1], ':', e);
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
          mutatorArgs,
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
          cookie,
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

    // await Promise.all([
    await this._dagWrite.putChunk(commit.chunk);
    await this._dagWrite.setHead(headName, commit.chunk.hash);
    // ]);

    await this._dagWrite.commit();

    return [commit.chunk.hash, keyChanges];
  }

  close(): void {
    this._dagWrite.close();
  }
}

async function updateIndexes(
  lc: LogContext,
  indexes: Map<string, Index>,
  dagWrite: dag.Write,
  op: IndexOperation,
  key: string,
  val: ReadonlyJSONValue,
): Promise<void> {
  for (const idx of indexes.values()) {
    if (key.startsWith(idx.meta.definition.keyPrefix)) {
      await idx.withMap(dagWrite.read(), map => {
        // Right now all the errors that index_value() returns are customers dev
        // problems: either the value is not json, the pointer is into nowhere, etc.
        // So we ignore them.

        try {
          indexValue(map, op, key, val, idx.meta.definition.jsonPointer);
        } catch (e) {
          lc.info?.('Not indexing value', val, ':', e);
        }
      });
    }
  }
}

type ChangedKeysMap = Map<string, string[]>;

export async function initDB(
  dagWrite: dag.Write,
  headName: string,
): Promise<string> {
  const w = new Write(
    dagWrite,
    prolly.Map.new(),
    undefined,
    {type: MetaType.Snapshot, lastMutationID: 0, cookie: null},
    new Map(),
  );
  return await w.commit(headName);
}
