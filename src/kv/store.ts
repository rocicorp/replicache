/**
 * Key-value store interface that is used with the experimental
 * [[ReplicacheOptions.experimentalKVStore]].
 *
 * The implementation needs to take care of locking the read and write
 * transactions. The required locking semantics are:
 * - Multiple read transactions can be run concurrently.
 * - Only a single write transaction can be run concurrently.
 * - A write transaction cannot start until all read transactions have finished.
 * - If a write transaction is running or waiting, new read transactions have to
 *   wait until that write transaction is finished.
 *
 * @experimental This interface is experimental and might be removed or changed
 * in the future without following semver versioning. Please be cautious.
 */
export interface Store {
  read(): Promise<Read>;
  write(): Promise<Write>;
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
