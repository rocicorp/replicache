import type {JSONValue} from './json';
import type {ChangedKeysMap} from './repm-invoker';
import type {ReadTransaction} from './transactions';
import * as db from './db/mod';

export type Subscription<R extends JSONValue | undefined, E> = {
  body: (tx: ReadTransaction) => Promise<R>;
  onData: (r: R) => void;
  onError?: (e: E) => void;
  onDone?: () => void;
  lastValue?: R;
  keys: ReadonlySet<string>;
  scans: ReadonlyArray<Readonly<db.ScanOptions>>;
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

  for (const scanOpts of subscription.scans) {
    if (scanOptionsMatchesKey(scanOpts, indexName, changedKey)) {
      return true;
    }
  }

  return false;
}

export function scanOptionsMatchesKey(
  scanOpts: db.ScanOptions,
  changeIndexName: string,
  changedKey: string,
): boolean {
  const {indexName, prefix, startKey, startExclusive, startSecondaryKey} =
    scanOpts;

  if (!indexName) {
    if (changeIndexName) {
      return false;
    }

    // No prefix and no start. Must recompute the subscription because all keys
    // will have an effect on the subscription.
    if (!prefix && !startKey) {
      return true;
    }

    if (prefix && !changedKey.startsWith(prefix)) {
      return false;
    }

    if (
      startKey &&
      ((startExclusive && changedKey <= startKey) || changedKey < startKey)
    ) {
      return false;
    }

    return true;
  }

  if (changeIndexName !== indexName) {
    return false;
  }

  // No prefix and no start. Must recompute the subscription because all keys
  // will have an effect on the subscription.
  if (!prefix && !startKey && !startSecondaryKey) {
    return true;
  }

  const [changedKeySecondary, changedKeyPrimary] =
    db.decodeIndexKey(changedKey);

  if (prefix) {
    if (!changedKeySecondary.startsWith(prefix)) {
      return false;
    }
  }

  if (
    startSecondaryKey &&
    ((startExclusive && changedKeySecondary <= startSecondaryKey) ||
      changedKeySecondary < startSecondaryKey)
  ) {
    return false;
  }

  if (
    startKey &&
    ((startExclusive && changedKeyPrimary <= startKey) ||
      changedKeyPrimary < startKey)
  ) {
    return false;
  }

  return true;
}

export function* subscriptionsForChangedKeys<V, E>(
  subscriptions: Set<Subscription<V, E>>,
  changedKeysMap: ChangedKeysMap,
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
    if (subscription.scans.some(opt => opt.indexName === name)) {
      yield subscription;
    }
  }
}
