import type {JSONValue} from './json.js';

export type ScanItem = {
  primaryKey: string;
  secondaryKey: string | null;
  value: JSONValue;
};
