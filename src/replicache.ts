import {deepEqual} from './json.js';
import type {JSONValue} from './json.js';
import type {
  KeyTypeForScanOptions,
  ScanOptions,
  ScanOptionsRPC,
} from './scan-options.js';
import {REPMWasmInvoker, RPC} from './repm-invoker.js';
import type {Pusher} from './pusher.js';
import type {Puller} from './puller.js';
import type {
  ChangedKeysMap,
  Invoke,
  Invoker,
  OpenResponse,
  OpenTransactionRequest,
} from './repm-invoker.js';
import {
  CreateIndexDefinition,
  SubscriptionTransactionWrapper,
} from './transactions.js';
import {IndexTransactionImpl} from './transactions.js';
import {ReadTransactionImpl, WriteTransactionImpl} from './transactions.js';
import {ScanResult} from './scan-iterator.js';
import type {ReadTransaction, WriteTransaction} from './transactions.js';
import {ConnectionLoop, MAX_DELAY_MS, MIN_DELAY_MS} from './connection-loop.js';
import {getLogger} from './logger.js';
import type {Logger, LogLevel} from './logger.js';
import {defaultPuller} from './puller';
import {defaultPusher} from './pusher';
import {resolver} from './resolver.js';
import type {ReplicacheOptions} from './replicache-options.js';
import {PullDelegate, PushDelegate} from './connection-loop-delegates.js';
import type {Subscription} from './subscriptions.js';
import {
  subscriptionsForChangedKeys,
  subscriptionsForIndexDefinitionChanged,
} from './subscriptions.js';
import {MemStore} from './kv/mem-store.js';
import {IDBStore} from './kv/idb-store.js';
import {ReleasableStore} from './kv/store.js';

type BeginPullResult = {
  requestID: string;
  syncHead: string;
  ok: boolean;
};

export const httpStatusUnauthorized = 401;

export type MaybePromise<T> = T | Promise<T>;

type ToPromise<P> = P extends Promise<unknown> ? P : Promise<P>;

/** The key name to use in localStorage when synchronizing changes. */
const storageKeyName = (name: string) => `/replicache/root/${name}`;

/** The maximum number of time to call out to getDataLayerAuth before giving up and throwing an error. */
const MAX_REAUTH_TRIES = 8;

/**
 * This type describes the data we send on the BroadcastChannel when things change.
 */
type BroadcastData = {
  root?: string;
  changedKeys: ChangedKeysMap;
  index?: string;
};

/**
 * When using localStorage instead of BroadcastChannel we need to use a JSON string.
 */
type StorageBroadcastData = Omit<BroadcastData, 'changedKeys'> & {
  changedKeys: [string, string[]][];
};

/**
 * The type used to describe the mutator definitions passed into [[Replicache]]
 * constructor as part of the [[ReplicacheOptions]].
 *
 * See [[ReplicacheOptions]] [[ReplicacheOptions.mutators|mutators]] for more info.
 */
export type MutatorDefs = {
  [key: string]: (
    tx: WriteTransaction,
    // Not sure how to not use any here...
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args?: any,
  ) => MaybePromise<JSONValue | void>;
};

type MutatorReturn = MaybePromise<JSONValue | void>;

type MakeMutator<
  F extends (tx: WriteTransaction, ...args: [] | [JSONValue]) => MutatorReturn,
> = F extends (tx: WriteTransaction, ...args: infer Args) => infer Ret
  ? (...args: Args) => ToPromise<Ret>
  : never;

type MakeMutators<T extends MutatorDefs> = {
  readonly [P in keyof T]: MakeMutator<T[P]>;
};

/**
 * Base options for [[PullOptions]] and [[PushOptions]]
 */
export interface RequestOptions {
  /**
   * When there are pending pull or push requests this is the _minimum_ ammount
   * of time to wait until we try another pull/push.
   */
  minDelayMs?: number;

  /**
   * When there are pending pull or push requests this is the _maximum_ ammount
   * of time to wait until we try another pull/push.
   */
  maxDelayMs?: number;
}

const emptySet: ReadonlySet<string> = new Set();

// eslint-disable-next-line @typescript-eslint/ban-types
export class Replicache<MD extends MutatorDefs = {}>
  implements ReadTransaction
{
  private _pullAuth: string;
  private readonly _pullURL: string;
  private _pushAuth: string;
  private readonly _pushURL: string;
  private readonly _name: string;
  private readonly _repmInvoker: Invoker;
  private readonly _useMemstore: boolean;
  private readonly _schemaVersion: string = '';

  private _closed = false;
  private _online = true;
  private readonly _logLevel: LogLevel;
  private readonly _logger: Logger;
  private readonly _openResponse: Promise<OpenResponse>;
  private readonly _openResolve: (resp: OpenResponse) => void;
  private readonly _clientIDPromise: Promise<string>;
  private _root: Promise<string | undefined> = Promise.resolve(undefined);
  private readonly _mutatorRegistry = new Map<
    string,
    (tx: WriteTransaction, args?: JSONValue) => MutatorReturn
  >();

  /**
   * The mutators that was registered in the constructor.
   */
  readonly mutate: MakeMutators<MD>;

  // Number of pushes/pulls at the moment.
  private _pushCounter = 0;
  private _pullCounter = 0;

  private _pullConnectionLoop: ConnectionLoop;
  private _pushConnectionLoop: ConnectionLoop;

  private _broadcastChannel?: BroadcastChannel = undefined;

  private readonly _subscriptions = new Set<
    Subscription<JSONValue | undefined, unknown>
  >();

  /**
   * The duration between each periodic [[pull]]. Setting this to `null`
   * disables periodic pull completely. Pull will still happen if you call
   * [[pull]] manually.
   */
  pullInterval: number | null;

  /**
   * The delay between when a change is made to Replicache and when Replicache
   * attempts to push that change.
   */
  pushDelay: number;

  private readonly _requestOptions: Required<RequestOptions>;
  private readonly _puller: Puller;
  private readonly _pusher: Pusher;
  private readonly _store: ReleasableStore;

  /**
   * The options used to control the [[pull]] and push request behavior. This
   * object is live so changes to it will affect the next pull or push call.
   */
  get requestOptions(): Required<RequestOptions> {
    return this._requestOptions;
  }

  /**
   * `onSync` is called when a sync begins, and again when the sync ends. The parameter `syncing`
   * is set to `true` when `onSync` is called at the beginning of a sync, and `false` when it
   * is called at the end of a sync.
   *
   * This can be used in a React like app by doing something like the following:
   *
   * ```js
   * const [syncing, setSyncing] = useState(false);
   * useEffect(() => {
   *   rep.onSync = setSyncing;
   * }, [rep]);
   * ```
   */
  onSync: ((syncing: boolean) => void) | null = null;

  /**
   * This gets called when we get an HTTP unauthorized (401) response from the
   * pull endpoint. Set this to a function that will ask your user to
   * reauthenticate.
   */
  getPullAuth:
    | (() => MaybePromise<string | null | undefined>)
    | null
    | undefined = null;

  /**
   * This gets called when we get an HTTP unauthorized (401) response from the push
   * endpoint. Set this to a function that will ask your user to reauthenticate.
   */
  getPushAuth:
    | (() => MaybePromise<string | null | undefined>)
    | null
    | undefined = null;

  constructor(options: ReplicacheOptions<MD> = {}) {
    const {
      name = 'default',
      logLevel = 'info',
      pullAuth = '',
      pullURL = '',
      pushAuth = '',
      pushDelay = 10,
      pushURL = '',
      schemaVersion = '',
      pullInterval = 60_000,
      useMemstore = false,
      wasmModule,
      mutators = {} as MD,
      requestOptions = {},
      puller = defaultPuller,
      pusher = defaultPusher,
      experimentalKVStore,
    } = options;
    this._pullAuth = pullAuth;
    this._pullURL = pullURL;
    this._pushAuth = pushAuth;
    this._pushURL = pushURL;
    this._name = name;
    this._repmInvoker = new REPMWasmInvoker(wasmModule);
    this._schemaVersion = schemaVersion;
    this.pullInterval = pullInterval;
    this.pushDelay = pushDelay;
    this._useMemstore = useMemstore;
    this._puller = puller;
    this._pusher = pusher;
    this._store = new ReleasableStore(
      experimentalKVStore || this._useMemstore
        ? new MemStore()
        : new IDBStore(this._name),
    );

    // Use a promise-resolve pair so that we have a promise to use even before
    // we call the Open RPC.
    const {promise, resolve} = resolver<OpenResponse>();
    this._openResponse = promise;
    this._openResolve = resolve;

    const {minDelayMs = MIN_DELAY_MS, maxDelayMs = MAX_DELAY_MS} =
      requestOptions;
    this._requestOptions = {maxDelayMs, minDelayMs};

    this._pullConnectionLoop = new ConnectionLoop(
      new PullDelegate(
        this,
        () => this._invokePull(),
        getLogger(['PULL'], logLevel),
      ),
    );

    this._pushConnectionLoop = new ConnectionLoop(
      new PushDelegate(
        this,
        () => this._invokePush(MAX_REAUTH_TRIES),
        getLogger(['PUSH'], logLevel),
      ),
    );

    this._logLevel = logLevel;
    this._logger = getLogger([], logLevel);

    this.mutate = this._registerMutators(mutators);

    this._clientIDPromise = this._open();
  }

  private async _open(): Promise<OpenResponse> {
    // If we are currently closing a Replicache instance with the same name,
    // wait for it to finish closing.
    await closingInstances.get(this._name);

    const openResponse = await this._repmInvoker.invoke(this._name, RPC.Open, {
      useMemstore: this._useMemstore,
      store: this._store,
    });
    this._openResolve(openResponse);

    if (hasBroadcastChannel) {
      this._broadcastChannel = new BroadcastChannel(storageKeyName(this._name));
      this._broadcastChannel.onmessage = (e: MessageEvent<BroadcastData>) =>
        this._onBroadcastMessage(e.data);
    } else {
      window.addEventListener('storage', this._onStorage);
    }
    this._root = this._getRoot();
    await this._root;

    if (!this._closed) {
      await this._invoke(RPC.SetLogLevel, {level: this._logLevel});
    }
    this.pull();
    this._push();
    return openResponse;
  }

  /**
   * The client ID for this instance of Replicache. Each web browser and
   * instance of Replicache gets a unique client ID keyed by the
   * {@link ReplicacheOptions.name | name}. This is persisted locally between
   * sessions (unless [[useMemstore]] is true in which case it is reset every
   * time a new Replicache instance is created).
   */
  get clientID(): Promise<string> {
    return this._clientIDPromise;
  }

  /**
   * `onOnlineChange` is called when the [[online]] property changes. See
   * [[online]] for more details.
   */
  onOnlineChange: ((online: boolean) => void) | null = null;

  /**
   * A rough heuristic for whether the client is currently online. Note that
   * there is no way to know for certain whether a client is online - the next
   * request can always fail. This property returns true if the last sync attempt succeeded,
   * and false otherwise.
   */
  get online(): boolean {
    return this._online;
  }

  /**
   * Whether the Replicache database has been closed. Once Replicache has been
   * closed it no longer syncs and you can no longer read or write data out of
   * it. After it has been closed it is pretty much useless and should not be
   * used any more.
   */
  get closed(): boolean {
    return this._closed;
  }

  /**
   * Closes this Replicache instance.
   *
   * When closed all subscriptions end and no more read or writes are allowed.
   */
  async close(): Promise<void> {
    this._closed = true;
    const p = this._invoke(RPC.Close);
    closingInstances.set(this._name, p);

    this._pullConnectionLoop.close();
    this._pushConnectionLoop.close();

    if (this._broadcastChannel) {
      this._broadcastChannel.close();
      this._broadcastChannel = undefined;
    } else {
      window.removeEventListener('storage', this._onStorage);
    }

    // Clear subscriptions
    for (const subscription of this._subscriptions) {
      subscription.onDone?.();
    }
    this._subscriptions.clear();

    await p;
    closingInstances.delete(this._name);
  }

  private async _getRoot(): Promise<string | undefined> {
    if (this._closed) {
      return undefined;
    }
    const res = await this._invoke(RPC.GetRoot);
    return res.root;
  }

  private _onStorage = (e: StorageEvent) => {
    const {key, newValue} = e;
    if (newValue && key === storageKeyName(this._name)) {
      const {root, changedKeys, index} = JSON.parse(
        newValue,
      ) as StorageBroadcastData;

      this._onBroadcastMessage({
        root,
        changedKeys: new Map(changedKeys),
        index,
      });
    }
  };

  // Callback for when a different tab changes the db.
  private async _onBroadcastMessage(data: BroadcastData) {
    // Cannot just use the root value from the other tab, because it can be behind us.
    // Also, in the case of memstore, it will have a totally different, unrelated
    // hash chain.
    const {changedKeys, index} = data;

    const changedKeysSubs = subscriptionsForChangedKeys(
      this._subscriptions,
      changedKeys,
    );

    const indexSubs = index
      ? subscriptionsForIndexDefinitionChanged(this._subscriptions, index)
      : [];

    const subscriptions: Set<Subscription<JSONValue | undefined, unknown>> =
      new Set();
    for (const s of changedKeysSubs) {
      subscriptions.add(s);
    }
    for (const s of indexSubs) {
      subscriptions.add(s);
    }
    await this._fireSubscriptions(subscriptions);
  }

  private _broadcastChange(
    root: string | undefined,
    changedKeys: ChangedKeysMap,
    index: string | undefined,
  ) {
    if (this._broadcastChannel) {
      const data = {root, changedKeys, index};
      this._broadcastChannel.postMessage(data);
    } else {
      // local storage needs a string...
      const data = {root, changedKeys: [...changedKeys.entries()], index};
      localStorage[storageKeyName(this._name)] = JSON.stringify(data);
    }
  }

  private async _checkChange(
    root: string | undefined,
    changedKeys: ChangedKeysMap,
  ): Promise<void> {
    const currentRoot = await this._root; // instantaneous except maybe first time
    if (root !== undefined && root !== currentRoot) {
      this._root = Promise.resolve(root);
      this._broadcastChange(root, changedKeys, undefined);
      await this._fireOnChange(changedKeys);
    }
  }

  private _invoke: Invoke = async (
    rpc: RPC,
    args?: JSONValue,
  ): Promise<JSONValue> => {
    await this._openResponse;
    return await this._repmInvoker.invoke(this._name, rpc, args);
  };

  /** Get a single value from the database. */
  get(key: string): Promise<JSONValue | undefined> {
    return this.query(tx => tx.get(key));
  }

  /** Determines if a single `key` is present in the database. */
  has(key: string): Promise<boolean> {
    return this.query(tx => tx.has(key));
  }

  /** Whether the database is empty. */
  isEmpty(): Promise<boolean> {
    return this.query(tx => tx.isEmpty());
  }

  /**
   * Gets many values from the database. This returns a `ScanResult` which
   * implements `AsyncIterable`. It also has methods to iterate over the `keys`
   * and `entries`.
   *
   * If `options` has an `indexName`, then this does a scan over an index with
   * that name. A scan over an index uses a tuple for the key consisting of
   * `[secondary: string, primary: string]`.
   */
  scan<O extends ScanOptions, K extends KeyTypeForScanOptions<O>>(
    options?: O,
  ): ScanResult<K> {
    return new ScanResult<K>(
      options,
      this._invoke,
      async () => {
        const tx = new ReadTransactionImpl(this._invoke);
        await tx.open({});
        return tx;
      },
      true,
    );
  }

  /**
   * Convenience form of `scan()` which returns all the entries as an array.
   * @deprecated Use `scan().entries().toArray()` instead.
   */
  async scanAll<O extends ScanOptions, K extends KeyTypeForScanOptions<O>>(
    options?: O,
  ): Promise<[K, JSONValue][]> {
    const tx = new ReadTransactionImpl(this._invoke);
    try {
      await tx.open({});
      return await tx.scanAll(options);
    } finally {
      closeIgnoreError(tx);
    }
  }

  /**
   * Creates a persistent secondary index in Replicache which can be used with scan.
   *
   * If the named index already exists with the same definition this returns success
   * immediately. If the named index already exists, but with a different definition
   * an error is thrown.
   */
  async createIndex(def: CreateIndexDefinition): Promise<void> {
    await this._indexOp(tx => tx.createIndex(def));
    await this._indexDefinitionChanged(def.name);
  }

  /**
   * Drops an index previously created with [[createIndex]].
   */
  async dropIndex(name: string): Promise<void> {
    await this._indexOp(tx => tx.dropIndex(name));
    await this._indexDefinitionChanged(name);
  }

  private async _indexOp(
    f: (tx: IndexTransactionImpl) => Promise<void>,
  ): Promise<void> {
    const tx = new IndexTransactionImpl(this._invoke);
    try {
      await tx.open({});
      await f(tx);
    } finally {
      tx.commit();
    }
  }

  protected async _maybeEndPull(
    beginPullResult: BeginPullResult,
  ): Promise<void> {
    if (this._closed) {
      return;
    }

    let {syncHead} = beginPullResult;

    const {replayMutations, changedKeys} = await this._invoke(
      RPC.MaybeEndTryPull,
      beginPullResult,
    );
    if (!replayMutations || replayMutations.length === 0) {
      // All done.
      await this._checkChange(syncHead, changedKeys);
      return;
    }

    // Replay.
    for (const mutation of replayMutations) {
      syncHead = await this._replay(
        syncHead,
        mutation.original,
        mutation.name,
        JSON.parse(mutation.args),
      );
    }

    await this._maybeEndPull({...beginPullResult, syncHead});
  }

  private async _replay<A extends JSONValue>(
    basis: string,
    original: string,
    name: string,
    args: A,
  ): Promise<string> {
    let mutatorImpl = this._mutatorRegistry.get(name);
    if (!mutatorImpl) {
      // Developers must not remove mutator names from the set once registered,
      // because Replicache needs to be able to replay mutations during sync.
      //
      // If we detect that this has happened, stub in a no-op mutator so that at
      // least sync can move forward. Note that the server-side mutation will
      // still get sent. This doesn't remove the queued local mutation, it just
      // removes its visible effects.
      this._logger.error?.(`Unknown mutator ${name}`);
      mutatorImpl = async () => {
        // no op
      };
    }
    const res = await this._mutate(name, mutatorImpl, args, {
      invokeArgs: {
        rebaseOpts: {basis, original},
      },
      isReplay: true,
    });
    return res.ref;
  }

  private async _invokePull(): Promise<boolean> {
    return await this._wrapInOnlineCheck(async () => {
      try {
        this._changeSyncCounters(0, 1);
        const beginPullResult = await this._beginPull(MAX_REAUTH_TRIES);
        if (!beginPullResult.ok) {
          return false;
        }
        if (beginPullResult.syncHead !== '') {
          await this._maybeEndPull(beginPullResult);
        }
      } finally {
        this._changeSyncCounters(0, -1);
      }
      return true;
    }, 'Pull');
  }

  private async _wrapInOnlineCheck(
    f: () => Promise<boolean>,
    name: string,
  ): Promise<boolean> {
    let online = true;

    try {
      return await f();
    } catch (e) {
      // The error paths of beginPull and maybeEndPull need to be reworked.
      //
      // We want to distinguish between:
      // a) network requests failed -- we're offline basically
      // b) sync was aborted because one's already in progress
      // c) oh noes - something unexpected happened
      //
      // Right now, all of these come out as errors. We distinguish (b) with a
      // hacky string search. (a) and (c) are not distinguishable currently
      // because repc doesn't provide sufficient information, so we treat all
      // errors that aren't (b) as (a).

      // TODO(arv): Use Error.prototype.cause
      // (https://github.com/tc39/proposal-error-cause) and check for a
      // structured error in the cause chain. On the Rust side we should create
      // a structured error that we can instanceof check instead
      if (/Pu(sh|ll)Failed\(JsError\(JsValue\(/.test(e + '')) {
        online = false;
      }
      this._logger.info?.(`${name} returned: ${e}`);
      return false;
    } finally {
      if (this._online !== online) {
        this._online = online;
        this.onOnlineChange?.(online);
      }
    }
  }

  private async _invokePush(maxAuthTries: number): Promise<boolean> {
    return await this._wrapInOnlineCheck(async () => {
      let pushResponse;
      try {
        this._changeSyncCounters(1, 0);
        pushResponse = await this._invoke(RPC.TryPush, {
          pushURL: this._pushURL,
          pushAuth: this._pushAuth,
          schemaVersion: this._schemaVersion,
          pusher: this._pusher,
        });
      } finally {
        this._changeSyncCounters(-1, 0);
      }

      const {httpRequestInfo} = pushResponse;

      if (httpRequestInfo) {
        const reauth = checkStatus(
          httpRequestInfo,
          'push',
          this._pushURL,
          this._logger,
        );

        // TODO: Add back support for mutationInfos? We used to log all the errors
        // here.

        if (reauth && this.getPushAuth) {
          if (maxAuthTries === 0) {
            this._logger.info?.('Tried to reauthenticate too many times');
            return false;
          }
          const pushAuth = await this.getPushAuth();
          if (pushAuth != null) {
            this._pushAuth = pushAuth;
            // Try again now instead of waiting for next push.
            return await this._invokePush(maxAuthTries - 1);
          }
        }

        return httpRequestInfo.httpStatusCode === 200;
      }

      // No httpRequestInfo means we didn't do a push because there were no
      // pending mutations.
      return true;
    }, 'Push');
  }

  /**
   * Push pushes pending changes to the [[pushURL]].
   *
   * You do not usually need to manually call push. If [[pushDelay]] is non-zero
   * (which it is by default) pushes happen automatically shortly after
   * mutations.
   */
  private _push(): void {
    this._pushConnectionLoop.send();
  }

  /**
   * Pull pulls changes from the [[pullURL]]. If there are any changes
   * local changes will get replayed on top of the new server state.
   */
  pull(): void {
    this._pullConnectionLoop.send();
  }

  protected async _beginPull(maxAuthTries: number): Promise<BeginPullResult> {
    const beginPullResponse = await this._invoke(RPC.BeginTryPull, {
      pullAuth: this._pullAuth,
      pullURL: this._pullURL,
      schemaVersion: this._schemaVersion,
      puller: this._puller,
    });

    const {httpRequestInfo, syncHead, requestID} = beginPullResponse;

    const reauth = checkStatus(
      httpRequestInfo,
      'pull',
      this._pullURL,
      this._logger,
    );
    if (reauth && this.getPullAuth) {
      if (maxAuthTries === 0) {
        this._logger.info?.('Tried to reauthenticate too many times');
        return {requestID, syncHead: '', ok: false};
      }

      let pullAuth;
      try {
        // Don't want to say we are syncing when we are waiting for auth
        this._changeSyncCounters(0, -1);
        pullAuth = await this.getPullAuth();
      } finally {
        this._changeSyncCounters(0, 1);
      }
      if (pullAuth != null) {
        this._pullAuth = pullAuth;
        // Try again now instead of waiting for next pull.
        return await this._beginPull(maxAuthTries - 1);
      }
    }

    return {requestID, syncHead, ok: httpRequestInfo.httpStatusCode === 200};
  }

  private _changeSyncCounters(pushDelta: 0, pullDelta: 1 | -1): void;
  private _changeSyncCounters(pushDelta: 1 | -1, pullDelta: 0): void;
  private _changeSyncCounters(pushDelta: number, pullDelta: number): void {
    this._pushCounter += pushDelta;
    this._pullCounter += pullDelta;
    const delta = pushDelta + pullDelta;
    const counter = this._pushCounter + this._pullCounter;
    if ((delta === 1 && counter === 1) || counter === 0) {
      const syncing = counter > 0;
      Promise.resolve().then(() => this.onSync?.(syncing));
    }
  }

  private async _fireOnChange(changedKeys: ChangedKeysMap): Promise<void> {
    const subscriptions = subscriptionsForChangedKeys(
      this._subscriptions,
      changedKeys,
    );
    await this._fireSubscriptions(subscriptions);
  }

  private async _indexDefinitionChanged(name: string): Promise<void> {
    // When an index definition changes we fire all subscriptions that uses
    // index scans with that index.
    const subscriptions = subscriptionsForIndexDefinitionChanged(
      this._subscriptions,
      name,
    );
    await this._fireSubscriptions(subscriptions);
    this._broadcastChange(await this._root, new Map(), name);
  }

  private async _fireSubscriptions(
    subscriptions: Iterable<Subscription<JSONValue | undefined, unknown>>,
  ) {
    const subs = [...subscriptions];
    if (subs.length === 0) {
      return;
    }

    type R =
      | {ok: true; value: JSONValue | undefined}
      | {ok: false; error: unknown};
    const results = await this.query(async tx => {
      const promises = subs.map(async s => {
        // Tag the result so we can deal with success vs error below.
        try {
          const stx = new SubscriptionTransactionWrapper(tx);
          const value = await s.body(stx);
          s.keys = stx.keys;
          s.scans = stx.scans;
          return {ok: true, value} as R;
        } catch (error) {
          return {ok: false, error} as R;
        }
      });
      return await Promise.all(promises);
    });
    for (let i = 0; i < subs.length; i++) {
      const s = subs[i];
      const result = results[i];
      if (result.ok) {
        const {value} = result;
        if (!deepEqual(value, s.lastValue)) {
          s.lastValue = value;
          s.onData(value);
        }
      } else {
        s.onError?.(result.error);
      }
    }
  }

  /**
   * Subcribe to changes to the underlying data. Every time the underlying data
   * changes `body` is called and if the result of `body` changes compared to
   * last time `onData` is called. The function is also called once the first
   * time the subscription is added.
   *
   * This returns a function that can be used to cancel the subscription.
   *
   * If an error occurs in the `body` the `onError` function is called if
   * present. Otherwise, the error is thrown.
   */
  subscribe<R extends JSONValue | undefined, E>(
    body: (tx: ReadTransaction) => Promise<R>,
    {
      onData,
      onError,
      onDone,
    }: {
      onData: (result: R) => void;
      onError?: (error: E) => void;
      onDone?: () => void;
    },
  ): () => void {
    const s = {
      body,
      onData,
      onError,
      onDone,
      lastValue: undefined,
      keys: emptySet,
      scans: [],
    } as Subscription<R, E>;
    this._subscriptions.add(
      s as unknown as Subscription<JSONValue | undefined, unknown>,
    );
    (async () => {
      try {
        const {result, keys, scans} = await this._querySubscription(s.body);
        s.keys = keys;
        s.scans = scans;
        s.lastValue = result;
        s.onData(result);
      } catch (ex) {
        if (s.onError) {
          s.onError(ex);
        } else {
          throw ex;
        }
      }
    })();
    return (): void => {
      this._subscriptions.delete(
        s as unknown as Subscription<JSONValue | undefined, unknown>,
      );
    };
  }

  /**
   * Query is used for read transactions. It is recommended to use transactions
   * to ensure you get a consistent view across multiple calls to `get`, `has`
   * and `scan`.
   */
  async query<R>(body: (tx: ReadTransaction) => Promise<R> | R): Promise<R> {
    const tx = new ReadTransactionImpl(this._invoke);
    await tx.open({});
    try {
      return await body(tx);
    } finally {
      // No need to await the response.
      closeIgnoreError(tx);
    }
  }

  private async _querySubscription<R>(
    body: (tx: ReadTransaction) => Promise<R> | R,
  ): Promise<{result: R; keys: ReadonlySet<string>; scans: ScanOptionsRPC[]}> {
    const tx = new ReadTransactionImpl(this._invoke);
    const stx = new SubscriptionTransactionWrapper(tx);
    await tx.open({});
    const result = await body(stx);
    await tx.close();
    return {result, keys: stx.keys, scans: stx.scans};
  }

  /** @deprecated Use [[ReplicacheOptions.mutators]] instead. */
  register<Return extends JSONValue | void>(
    name: string,
    mutatorImpl: (tx: WriteTransaction) => MaybePromise<Return>,
  ): () => Promise<Return>;
  /** @deprecated Use [[ReplicacheOptions.mutators]] instead. */
  register<Return extends JSONValue | void, Args extends JSONValue>(
    name: string,
    mutatorImpl: (tx: WriteTransaction, args: Args) => MaybePromise<Return>,
  ): (args: Args) => Promise<Return>;
  /** @deprecated Use [[ReplicacheOptions.mutators]] instead. */
  /* c8 ignore next 14 */
  register<Return extends JSONValue | void, Args extends JSONValue>(
    name: string,
    mutatorImpl: (tx: WriteTransaction, args?: Args) => MaybePromise<Return>,
  ): (args?: Args) => Promise<Return> {
    this._mutatorRegistry.set(
      name,
      mutatorImpl as (
        tx: WriteTransaction,
        args: JSONValue | undefined,
      ) => Promise<void | JSONValue>,
    );

    return this._register(name, mutatorImpl);
  }

  private _register<Return extends JSONValue | void, Args extends JSONValue>(
    name: string,
    mutatorImpl: (tx: WriteTransaction, args?: Args) => MaybePromise<Return>,
  ): (args?: Args) => Promise<Return> {
    this._mutatorRegistry.set(
      name,
      mutatorImpl as (
        tx: WriteTransaction,
        args: JSONValue | undefined,
      ) => Promise<void | JSONValue>,
    );

    return async (args?: Args): Promise<Return> =>
      (await this._mutate(name, mutatorImpl, args, {isReplay: false})).result;
  }

  private _registerMutators<
    M extends {
      [key: string]: (tx: WriteTransaction, args?: JSONValue) => MutatorReturn;
    },
  >(regs: M): MakeMutators<M> {
    type Mut = MakeMutators<M>;
    const rv: Partial<Mut> = Object.create(null);
    for (const k in regs) {
      rv[k] = this._register(k, regs[k]) as MakeMutator<M[typeof k]>;
    }
    return rv as Mut;
  }

  private async _mutate<R extends JSONValue | void, A extends JSONValue>(
    name: string,
    mutatorImpl: (tx: WriteTransaction, args?: A) => MaybePromise<R>,
    args: A | undefined,
    {
      invokeArgs,
      isReplay,
    }: {invokeArgs?: OpenTransactionRequest; isReplay: boolean},
  ): Promise<{result: R; ref: string}> {
    let actualInvokeArgs: OpenTransactionRequest = {
      args: args !== undefined ? JSON.stringify(args) : 'null',
      name,
    };
    if (invokeArgs !== undefined) {
      actualInvokeArgs = {...actualInvokeArgs, ...invokeArgs};
    }

    let result: R;
    const tx = new WriteTransactionImpl(this._invoke);
    await tx.open(actualInvokeArgs);
    try {
      result = await mutatorImpl(tx, args);
    } catch (ex) {
      // No need to await the response.
      closeIgnoreError(tx);
      throw ex;
    }
    const {ref, changedKeys} = await tx.commit(!isReplay);
    if (!isReplay) {
      this._pushConnectionLoop.send();
      await this._checkChange(ref, changedKeys);
    }

    return {result, ref};
  }

  /* c8 ignore next 13 */
  /**
   * When this is set to `true` the internal Replicache wasm module will log
   * more things to the console (using `console.debug`). Setting this to false
   * reduces the amount of logging done by the wasm module.
   *
   * If you want to see the verbose logging from Replicache in Devtools/Web
   * Inspector you also need to change the console log level to `Verbose`.
   * @deprecated
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async setVerboseWasmLogging(): Promise<void> {
    // deprecated
  }
}

function checkStatus(
  data: {httpStatusCode: number; errorMessage: string},
  verb: string,
  serverURL: string,
  logger: Logger,
): boolean {
  const {httpStatusCode, errorMessage} = data;
  if (errorMessage || httpStatusCode >= 400) {
    logger.error?.(
      `Got error response from server (${serverURL}) doing ${verb}: ${httpStatusCode}` +
        (errorMessage ? `: ${errorMessage}` : ''),
    );
  }
  return httpStatusCode === httpStatusUnauthorized;
}

export class ReplicacheTest<
  // eslint-disable-next-line @typescript-eslint/ban-types
  MD extends MutatorDefs = {},
> extends Replicache<MD> {
  beginPull(): Promise<BeginPullResult> {
    return super._beginPull(MAX_REAUTH_TRIES);
  }

  maybeEndPull(beginPullResult: BeginPullResult): Promise<void> {
    return super._maybeEndPull(beginPullResult);
  }
}

const hasBroadcastChannel = typeof BroadcastChannel !== 'undefined';

async function closeIgnoreError(tx: ReadTransactionImpl) {
  try {
    await tx.close();
  } catch (ex) {
    console.error('Failed to close transaction', ex);
  }
}

// This map is used to keep track of closing instances of Replicache. When an
// instance is opening we wait for any currently closing instances.
const closingInstances: Map<string, Promise<unknown>> = new Map();
