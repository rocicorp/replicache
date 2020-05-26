import type {JsonType} from './json.js';

export interface ScanItem {
  readonly key: string;
  readonly value: JsonType;
}
