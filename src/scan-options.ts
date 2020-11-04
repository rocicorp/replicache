export interface ScanOptions {
  prefix?: string;
  startKey?: string;
  startKeyExclusive?: boolean;
  limit?: number;
  indexName?: string;
}

export interface ScanOptionsRpc {
  prefix?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  start_key?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  start_key_exclusive?: boolean;
  limit?: number;
  indexName?: string;
}
