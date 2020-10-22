import type {ScanKey} from './scan-key.js';

export interface ScanBound {
  readonly key?: ScanKey;
  /** @deprecated Use key instead */
  readonly id?: ScanKey;
  readonly index?: number;
}
