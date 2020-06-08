import type {JSONValue} from './json.js';

export interface ScanItem {
  readonly key: string;
  readonly value: JSONValue;
}
