/** Options for [[scan]] and [[scanAll]] */
export type ScanOptions = ScanIndexOptions | ScanNoIndexOptions;

/**
 * Options for [[scan]] and [[scanAll]] when scanning over the entire key space.
 */
export type ScanNoIndexOptions = {
  /** Only include keys starting with `prefix`. */
  prefix?: string;

  /** Only include up to `limit` results. */
  limit?: number;

  /** When provided the scan starts at this key. */
  start?: {
    key: string;

    /** Whether the `key` is exclusive or inclusive. */
    exclusive?: boolean;
  };
};

/**
 * Options for [[scan]] and [[scanAll]] when scanning over an index. When
 * scanning over and index you need to provide the `indexName` and the `start`
 * `key` is now a tuple consisting of secondar and primary key
 */
export type ScanIndexOptions = {
  /** Only include results starting with the *secondary* keys starting with `prefix`. */
  prefix?: string;

  /** Only include up to `limit` results. */
  limit?: number;

  /** Do a `scan` over a named index. The `indexName` needs to match an index created with [[createIndex]]. */
  indexName: string;

  /** When provided the scan starts at this key. */
  start?: {
    key: ScanOptionIndexedStartKey;

    /** Whether the `key` is exclusive or inclusive. */
    exclusive?: boolean;
  };
};

/**
 * If the options contains an `indexName` then the key type is a tuple of
 * secondary and primary.
 */
export type KeyTypeForScanOptions<O extends ScanOptions> = O extends {
  indexName: string;
}
  ? ScanOptionIndexedStartKey
  : string;

/**
 * When providing a start key for an indexed [[scan]] you need to provide the
 * `secondary` index to start [[scan]] at. You may also provide a `primary`
 * index. If you pass a string, then that is the key for the secondary index. If
 * you provide tuple then this is the secondary key followed by the primary key.
 */
export type ScanOptionIndexedStartKey =
  | [secondary: string, primary?: string]
  | string;

export interface ScanOptionsRPC {
  /* eslint-disable @typescript-eslint/naming-convention */
  prefix?: string;
  start_secondary_key?: string;
  start_key?: string;
  start_exclusive?: boolean;
  limit?: number;
  indexName?: string;
  /* eslint-enable @typescript-eslint/naming-convention */
}

export function toRPC(options?: ScanOptions): ScanOptionsRPC {
  if (!options) {
    return {};
  }
  let key: string | ScanOptionIndexedStartKey | undefined;
  let exclusive: boolean | undefined;
  let primary: string | undefined;
  let secondary: string | undefined;
  type MaybeIndexName = {indexName?: string};
  if (options.start) {
    ({key, exclusive} = options.start);
    if ((options as MaybeIndexName).indexName) {
      if (typeof key === 'string') {
        secondary = key;
      } else {
        secondary = key[0];
        primary = key[1];
      }
    } else {
      primary = key as string;
    }
  }

  return {
    /* eslint-disable @typescript-eslint/naming-convention */
    prefix: options.prefix,
    start_secondary_key: secondary,
    start_key: primary,
    start_exclusive: exclusive,
    limit: options.limit,
    indexName: (options as MaybeIndexName).indexName,
    /* eslint-enable @typescript-eslint/naming-convention */
  };
}
