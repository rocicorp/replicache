import type {ScanId} from './scan-id.js';

export interface ScanBound {
  readonly id: ScanId;
  readonly index: number;
}
