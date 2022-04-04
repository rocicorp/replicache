import type {JSONValue} from './json';
import type {ReadTransaction} from './transactions';
import type * as sync from './sync/mod';
import {decodeIndexKey} from './db/index-key.js';
import {
  isScanIndexOptions,
  ScanIndexOptions,
  scanOptionIndexedStartKeyToSecondaryAndPrimary,
  ScanOptions,
} from './scan-options.js';

export type ScanSubscriptionInfo = {
  options: ScanOptions | undefined;
  inclusiveLimitKey: string | undefined;
};

export type Subscription<R extends JSONValue | undefined, E> = {
  body: (tx: ReadTransaction) => Promise<R>;
  onData: (r: R) => void;
  onError?: (e: E) => void;
  onDone?: () => void;
  lastValue?: R;
  keys: ReadonlySet<string>;
  scans: ReadonlyArray<Readonly<ScanSubscriptionInfo>>;
};

function keyMatchesSubscription<V, E>(
  subscription: Subscription<V, E>,
  indexName: string,
  changedKey: string,
) {
  // subscription.keys contains the primary index keys. If we are passing in an
  // indexName there was a change to the index map, in which case the changedKey
  // is an encoded index key. We could skip checking the indexName here since
  // the set would never contain encoded index keys but we do the check for
  // clarity.
  if (indexName === '' && subscription.keys.has(changedKey)) {
    return true;
  }

  for (const scanInfo of subscription.scans) {
    if (scanInfoMatchesKey(scanInfo, indexName, changedKey)) {
      return true;
    }
  }

  return false;
}

export function scanInfoMatchesKey(
  scanInfo: ScanSubscriptionInfo,
  changeIndexName: string,
  changedKey: string,
): boolean {
  const {options} = scanInfo;
  if (!options) {
    // No options to scan. This matches all keys.
    return true;
  }

  const {prefix, start, limit} = options;

  if (!isScanIndexOptions(options)) {
    if (changeIndexName) {
      return false;
    }

    // A scan with limit <= 0 can have no matches
    if (limit !== undefined && limit <= 0) {
      return false;
    }

    // No prefix and no start. Must recompute the subscription because all keys
    // will have an effect on the subscription.
    if (!prefix && !start) {
      return true;
    }

    if (
      prefix &&
      (!changedKey.startsWith(prefix) ||
        isKeyPastInclusiveLimit(scanInfo, changedKey))
    ) {
      return false;
    }

    if (
      start &&
      ((start.exclusive && changedKey <= start.key) ||
        changedKey < start.key ||
        isKeyPastInclusiveLimit(scanInfo, changedKey))
    ) {
      return false;
    }

    return true;
  }

  const {indexName} = options;
  if (changeIndexName !== indexName) {
    return false;
  }

  // No prefix and no start. Must recompute the subscription because all keys
  // will have an effect on the subscription.
  if (!prefix && !start) {
    return true;
  }

  const [changedKeySecondary, changedKeyPrimary] = decodeIndexKey(changedKey);

  if (prefix) {
    if (!changedKeySecondary.startsWith(prefix)) {
      return false;
    }
  }

  if (start) {
    const {key, exclusive} = start;
    const [startSecondaryKey, startPrimaryKey] =
      scanOptionIndexedStartKeyToSecondaryAndPrimary(key);

    if (
      startSecondaryKey &&
      ((exclusive && changedKeySecondary <= startSecondaryKey) ||
        changedKeySecondary < startSecondaryKey)
    ) {
      return false;
    }

    if (
      startPrimaryKey &&
      ((exclusive && changedKeyPrimary <= startPrimaryKey) ||
        changedKeyPrimary < startPrimaryKey)
    ) {
      return false;
    }
  }

  return true;
}

function isKeyPastInclusiveLimit(
  scanInfo: ScanSubscriptionInfo,
  changedKey: string,
): boolean {
  const {inclusiveLimitKey} = scanInfo;
  return (
    scanInfo.options?.limit !== undefined &&
    inclusiveLimitKey !== undefined &&
    changedKey > inclusiveLimitKey
  );
}

export function* subscriptionsForChangedKeys<V, E>(
  subscriptions: Set<Subscription<V, E>>,
  changedKeysMap: sync.ChangedKeysMap,
): Generator<Subscription<V, E>> {
  outer: for (const subscription of subscriptions) {
    for (const [indexName, changedKeys] of changedKeysMap) {
      for (const key of changedKeys) {
        if (keyMatchesSubscription(subscription, indexName, key)) {
          yield subscription;
          continue outer;
        }
      }
    }
  }
}

export function* subscriptionsForIndexDefinitionChanged<V, E>(
  subscriptions: Set<Subscription<V, E>>,
  name: string,
): Generator<Subscription<V, E>> {
  for (const subscription of subscriptions) {
    if (
      subscription.scans.some(
        ({options}) => (options as ScanIndexOptions).indexName === name,
      )
    ) {
      yield subscription;
    }
  }
}
