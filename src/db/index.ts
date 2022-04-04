import {RWLock} from '@rocicorp/lock';
import type * as dag from '../dag/mod';
import type {IndexRecord} from './commit';
import {BTreeRead, BTreeWrite} from '../btree/mod';
import type {Hash} from '../hash';

abstract class Index<DagReadWrite, BTree> {
  readonly meta: IndexRecord;
  protected _map: BTree | undefined;
  protected _rwLock = new RWLock();

  constructor(meta: IndexRecord, map: BTree | undefined) {
    this.meta = meta;
    this._map = map;
  }

  async withMap<T>(
    dagReadWrite: DagReadWrite,
    cb: (map: BTree) => T | Promise<T>,
  ): Promise<T> {
    if (!this._map) {
      await this._rwLock.withWrite(async () => {
        return (this._map = this.createBTree(dagReadWrite));
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this._rwLock.withRead(() => cb(this._map!));
  }

  abstract createBTree(dagReadWrite: DagReadWrite): BTree;
}

export class IndexRead extends Index<dag.Read, BTreeRead> {
  constructor(meta: IndexRecord, map: BTreeRead | undefined) {
    super(meta, map);
  }

  override createBTree(dagRead: dag.Read): BTreeRead {
    return new BTreeRead(dagRead, this.meta.valueHash);
  }
}

export class IndexWrite extends Index<dag.Write, BTreeWrite> {
  constructor(meta: IndexRecord, map: BTreeWrite | undefined) {
    super(meta, map);
  }

  override createBTree(dagWrite: dag.Write): BTreeWrite {
    return new BTreeWrite(dagWrite, this.meta.valueHash);
  }

  // Note: does not update self.meta.value_hash (doesn't need to at this point as flush
  // is only called during commit.)
  flush(): Promise<Hash> {
    return this._rwLock.withWrite(() => {
      if (this._map) {
        return this._map.flush();
      }
      return this.meta.valueHash;
    });
  }

  clear(): Promise<void> {
    return this._rwLock.withWrite(async () => {
      await this._map?.clear();
    });
  }
}
