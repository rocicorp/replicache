export interface ScanOptions {
  prefix?: string;
  startKey?: string;
  startKeyExclusive?: boolean;
  limit?: number;
  indexName?: string;
}

/**
 * Ifthe options contains an indexName then the key type is a tuple of secondaryKey, primaryKey.
 */
export type KeyTypeForScanOptions<O extends ScanOptions> = O extends {
  indexName: string;
}
  ? [secondary: string, primary: string]
  : string;

export interface ScanOptionsRpc {
  prefix?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  start_key?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  start_key_exclusive?: boolean;
  limit?: number;
  indexName?: string;
}
