export {default} from './replicache.js';
export {TransactionClosedError} from './transaction-closed-error.js';
/** @deprecated Use the wasmModule parameter to Replicache constructor instead */
export {REPMWasmInvoker} from './repm-invoker.js';

export type {Mutator} from './replicache.js';
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
