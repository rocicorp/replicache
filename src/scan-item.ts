import type {JSONValue} from './json';

export type ScanItem = {
  primaryKey: string;
  secondaryKey: string | null;
  value: JSONValue;
};
