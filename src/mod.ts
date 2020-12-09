export {default} from './replicache.js';
export {TransactionClosedError} from './transaction-closed-error.js';

/** @deprecated This type wasn't exact enough as described */
export type {Mutator} from './replicache.js';
export type {ReplicacheOptions} from './replicache.js';
export type {REPMInvoke, Invoker} from './repm-invoker.js';
export type {ReadTransaction, WriteTransaction} from './transactions.js';
export type {ScanResult} from './scan-iterator.js';
export type {
  KeyTypeForScanOptions,
  ScanIndexOptions,
  ScanNoIndexOptions,
  ScanOptionIndexedStartKey,
  ScanOptions,
} from './scan-options.js';
