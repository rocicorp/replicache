import type {JSONValue} from './json';
import type {ChangedKeysMap} from './repm-invoker';
import type {ScanOptionsRPC} from './scan-options';
import type {ReadTransaction} from './transactions';

export type Subscription<R extends JSONValue | undefined, E> = {
  body: (tx: ReadTransaction) => Promise<R>;
  onData: (r: R) => void;
  onError?: (e: E) => void;
  onDone?: () => void;
  lastValue?: R;
  keys: ReadonlySet<string>;
  scans: ReadonlyArray<Readonly<ScanOptionsRPC>>;
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

function scanOptionsMatchesKey(
  scanOpts: ScanOptionsRPC,
  changeIndexName: string,
  changedKey: string,
): boolean {
  const {
    indexName,
    prefix,
    start_key: startKey,
    start_exclusive: startExclusive,
    start_secondary_key: startSecondaryKey,
  } = scanOpts;

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

  const [changedKeySecondary, changedKeyPrimary] = decodeIndexKey(changedKey);

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

const KEY_VERSION_0 = '\u0000';
const KEY_SEPARATOR = '\u0000';

// When working with indexes the changed keys are encoded. This is a port of the Rust code in Repc.
// Make sure these are in sync.
function decodeIndexKey(
  encodedIndexKey: string,
): [secondary: string, primary: string] {
  if (!encodedIndexKey.startsWith(KEY_VERSION_0)) {
    throw new Error('invalid version');
  }
  const parts = encodedIndexKey
    .slice(KEY_VERSION_0.length)
    .split(KEY_SEPARATOR, 2);
  if (parts.length !== 2) {
    throw new Error('Invalid Formatting: ' + encodedIndexKey);
  }
  return parts as [string, string];
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
