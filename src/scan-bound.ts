import type {ScanKey} from './scan-key.js';

export interface ScanBound {
  readonly key?: ScanKey;
  readonly index?: number;
}
