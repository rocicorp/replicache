export {default} from './replicache.js';
export {TransactionClosedError} from './transaction-closed-error.js';
/** @deprecated Use the wasmModule parameter to Replicache constructor instead */
export {REPMWasmInvoker} from './repm-invoker.js';

export type {Mutator} from './replicache.js';
export type {ScanKey} from './scan-key.js';
/** @deprecated Use ScanKey instead */
export type {ScanKey as ScanId} from './scan-key.js';
export type {ScanBound} from './scan-bound.js';
export type {REPMInvoke, Invoker} from './repm-invoker.js';
export type {ReadTransaction, WriteTransaction} from './transactions.js';
export type {ScanResult} from './scan-iterator.js';
