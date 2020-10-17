import type {ScanBound} from './scan-bound.js';

export interface ScanOptions {
  prefix?: string;
  start?: ScanBound;
  limit?: number;
  indexName?: string;
}
