export interface ScanOptions {
  /** Only include keys starting with `prefix`. */
  prefix?: string;

  /**
   * The first key to include in the result. If `startKeyExclusive` is `true`
   * then this key is not included and the result start withthe next larger key.
   */
  startKey?: string;

  /** Whether the `startKey` is exclusive or inclusive. */
  startKeyExclusive?: boolean;

  /** Only include up to `limit` results. */
  limit?: number;

  /** Do a `scan` over a named index. */
  indexName?: string;
}

/**
 * If the options contains an `indexName` then the key type is a tuple of
 * secondary and primary.
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
