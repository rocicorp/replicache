import type {ReadonlyJSONValue} from '../json';

export type Value = ReadonlyJSONValue;

/**
 * Store defines a transactional key/value store that Replicache stores all data
 * within.
 *
 * For correct operation of Replicache, implementations of this interface must
 * provide [strict
 * serializable](https://jepsen.io/consistency/models/strict-serializable)
 * transactions.
 *
 * Informally, read and write transactions must behave like a ReadWrite Lock -
 * multiple read transactions are allowed in parallel, or one write.
 * Additionally writes from a transaction must appear all at one, atomically.
 *
 * @experimental This interface is experimental and might be removed or changed
 * in the future without following semver versioning. Please be cautious.
 */
export interface Store<Value = ReadonlyJSONValue> {
  read(): Promise<Read<Value>>;
  withRead<R>(f: (read: Read) => R | Promise<R>): Promise<R>;
  write(): Promise<Write<Value>>;
  withWrite<R>(f: (write: Write) => R | Promise<R>): Promise<R>;
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
export interface Read<Value = ReadonlyJSONValue> extends Release {
  has(key: string): Promise<boolean>;
  get(key: string): Promise<Value | undefined>;
}

/**
 * @experimental
 */
export interface Write<Value = ReadonlyJSONValue> extends Read<Value> {
  put(key: string, value: Value): Promise<void>;
  del(key: string): Promise<void>;
  commit(): Promise<void>;
}
