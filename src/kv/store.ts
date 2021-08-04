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
 * This interface is used so that we can release the lock when the transaction
 * is done.
 *
 * @experimental This interface is experimental and might be removed or changed
 * in the future without following semver versioning. Please be cautious.
 */
export interface Release {
  release(): void;
}

/**
 * @experimental This interface is experimental and might be removed or changed
 * in the future without following semver versioning. Please be cautious.
 */
export interface Read extends Release {
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
