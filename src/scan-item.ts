import type {JSONValue} from './json.js';

export type ScanItem<V = JSONValue> = {
  primaryKey: string;
  secondaryKey: string | null;
  value: V;
};
