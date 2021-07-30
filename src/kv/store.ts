import {RWLock} from '../rw-lock.js';

/**
 * Key-value store interface that is used with the experimental
 * [[ReplicacheOptions.experimentalKVStore]].
 *
 * The implementation does not need to take care of locking the read and write
 * transactions. Replicache will handle this so that [[read]]/[[write]] calls
 * are put in a read-write-lock.
 *
 * @experimental This interface is experimental and might be removed or changed
 * in the future without following semver versioning. Please be cautious.
 */
export interface Store {
  read(): Promise<Read>;
  write(): Promise<Write>;
  close(): Promise<void>;
}

export interface StoreWithRelease {
  read(): Promise<Read & Release>;
  write(): Promise<Write & Release>;
  close(): Promise<void>;
}

/**
 * @experimental This interface is experimental and might be removed or changed
 * in the future without following semver versioning. Please be cautious.
 */
export interface Read {
  has(key: string): Promise<boolean>;
  get(key: string): Promise<Uint8Array | undefined>;
}

/**
 * @experimental
 */
export interface Write extends Read {
  put(key: string, value: Uint8Array): Promise<void>;
  del(key: string): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

interface Release {
  release(): void;
}

/**
 * Creates a new store that wraps read and write in an RWLock.
 */
export class ReleasableStore {
  private readonly _store: Store;
  private readonly _rwLock = new RWLock();

  constructor(store: Store) {
    this._store = store;
    this._rwLock = new RWLock();
  }

  async read(): Promise<Read & Release> {
    const release = await this._rwLock.read();
    return makeRelease(await this._store.read(), release);
  }

  async write(): Promise<Write & Release> {
    const release = await this._rwLock.write();
    return makeRelease(await this._store.write(), release);
  }

  async close(): Promise<void> {
    await this._store.close();
  }
}

function makeRelease<T extends Read | Write>(
  impl: T,
  release: () => void,
): T & Release {
  const o = Object.create(impl, {
    release: {
      value: release,
    },
  });
  return o;
}
