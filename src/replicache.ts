import {deepEqual, JSONValue} from './json.js';
import type {KeyTypeForScanOptions, ScanOptions} from './scan-options.js';
import {
  Invoker,
  Invoke,
  OpenTransactionRequest,
  REPMWasmInvoker,
  InitInput,
  OpenResponse,
  RPC,
} from './repm-invoker.js';
import {
  CreateIndexDefinition,
  IndexTransactionImpl,
  ReadTransactionImpl,
  WriteTransactionImpl,
} from './transactions.js';
import {ScanResult} from './scan-iterator.js';
import type {ReadTransaction, WriteTransaction} from './transactions.js';
import {ConnectionLoop} from './connection-loop.js';
import {getLogger} from './logger.js';
import type {Logger, LogLevel} from './logger.js';

type BeginPullResult = {
  requestID: string;
  syncHead: string;
  ok: boolean;
};

export const httpStatusUnauthorized = 401;

export type MaybePromise<T> = T | Promise<T>;

/** The key name to use in localStorage when synchronizing changes. */
const storageKeyName = (name: string) => `/replicache/root/${name}`;

/** The maximum number of time to call out to getDataLayerAuth before giving up and throwing an error. */
const MAX_REAUTH_TRIES = 8;

/**
 * The options passed to [[Replicache]].
 */
export interface ReplicacheOptions {
  /**
   * This is the
   * [authentication](https://github.com/rocicorp/replicache/blob/main/SERVER_SETUP.md#authentication)
   * token used when doing a [push
   * ](https://github.com/rocicorp/replicache/blob/main/SERVER_SETUP.md#step-4-upstream-sync).
   */
  pushAuth?: string;

  /**
   * This is the URL to the server endpoint dealing with the push updates. See
   * [Server Setup Upstream Sync](https://github.com/rocicorp/replicache/blob/main/SERVER_SETUP.md#step-4-upstream-sync)
   * for more details.
   */
  pushURL?: string;

  /**
   * This is the
   * [authentication](https://github.com/rocicorp/replicache/blob/main/SERVER_SETUP.md#authentication)
   * token used when doing a [pull
   * ](https://github.com/rocicorp/replicache/blob/main/SERVER_SETUP.md#step-4-upstream-sync).
   */
  pullAuth?: string;

  /**
   * This is the URL to the server endpoint dealing with pull. See [Server Setup
   * Downstream
   * Sync](https://github.com/rocicorp/replicache/blob/main/SERVER_SETUP.md#step-1-downstream-sync)
   * for more details.
   */
  pullURL?: string;

  /**
   * The name of the Replicache database. This defaults to `"default"`.
   *
   * You can use multiple Replicache instances as long as the names are unique.
   *
   * Using different names for different users allows you to switch users even
   * when you are offline.
   */
  name?: string;

  /**
   * The schema version of the data understood by this application. This enables
   * versioning of mutators (in the push direction) and the client view (in the
   * pull direction).
   */
  schemaVersion?: string;

  /**
   * The duration between each [[pull]]. Set this to `null` to prevent pulling
   * in the background.
   */
  pullInterval?: number | null;

  /**
   * The delay between when a change is made to Replicache and when Replicache
   * attempts to push that change.
   */
  pushDelay?: number;

  /**
   * By default we will load the Replicache wasm module relative to the
   * Replicache js files but under some circumstances (like bundling with old
   * versions of Webpack) it is useful to manually configure where the wasm
   * module is located on the web server.
   *
   * If you provide your own path to the wasm module it probably makes sense to
   * use a relative URL relative to your current file.
   *
   * ```js
   * wasmModule: new URL('./relative/path/to/replicache.wasm', import.meta.url),
   * ```
   *
   * You might also want to consider using an absolute URL so that we can find
   * the wasm module no matter where your js file is loaded from:
   *
   * ```js
   * wasmModule: '/static/replicache.wasm',
   * ```
   */
  wasmModule?: InitInput | undefined;

  /**
   * Allows using an in memory store instead of IndexedDB. This is useful for
   * testing for example. Notice that when this is `true` no data is persisted
   * in Replicache and all the data that has not yet been synced when Replicache
   * is [[closed]] or the page is unloaded is lost.
   */
  useMemstore?: boolean;

  /**
   * Sets the amount of logging shown.
   */
  logLevel?: LogLevel;
}

export class Replicache implements ReadTransaction {
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
  private _openResponse!: Promise<OpenResponse>;
  private _root: Promise<string | undefined> = Promise.resolve(undefined);
  private readonly _mutatorRegistry = new Map<
    string,
    (tx: WriteTransaction, args?: JSONValue) => MaybePromise<void | JSONValue>
  >();

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
   * This gets called when we get an HTTP unauthorized (410) response from the
   * pull endpoint. Set this to a function that will ask your user to
   * reauthenticate.
   */
  getPullAuth:
    | (() => MaybePromise<string | null | undefined>)
    | null
    | undefined = null;

  /**
   * This gets called when we get an HTTP unauthorized (410) response from the push
   * endpoint. Set this to a function that will ask your user to reauthenticate.
   */
  getPushAuth:
    | (() => MaybePromise<string | null | undefined>)
    | null
    | undefined = null;

  constructor(options: ReplicacheOptions) {
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

    this._pullConnectionLoop = new ConnectionLoop({
      invokeSend: () => this._invokePull(),
      watchdogTimer: () => this.pullInterval,
      debounceDelay: () => 0,
      maxConnections: 1,
      ...getLogger(['PULL'], logLevel),
    });
    this._pushConnectionLoop = new ConnectionLoop({
      invokeSend: () => this._invokePush(MAX_REAUTH_TRIES),
      debounceDelay: () => this.pushDelay,
      maxConnections: 1,
      ...getLogger(['PUSH'], logLevel),
    });

    this._logLevel = logLevel;
    this._logger = getLogger([], logLevel);

    this._open().then(async () => {
      // TODO: Make log level an arg to open and scope the log level to a db
      // connection.
      await this._invoke(RPC.SetLogLevel, {level: this._logLevel});
      this.pull();
      this._push();
    });
  }

  private async _open(): Promise<void> {
    this._openResponse = this._repmInvoker.invoke(this._name, RPC.Open, {
      useMemstore: this._useMemstore,
    });
    if (hasBroadcastChannel) {
      this._broadcastChannel = new BroadcastChannel(storageKeyName(this._name));
      this._broadcastChannel.onmessage = () => this._onStorage();
    } else {
      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === storageKeyName(this._name)) {
          this._onStorage();
        }
      });
    }
    this._setRoot(this._getRoot());
    await this._root;
  }

  /**
   * The client ID for this instance of Replicache. Each web browser and
   * instance of Replicache gets a unique client ID keyed by the
   * {@link ReplicacheOptions.name | name}. This is persisted locally between
   * sessions (unless [[useMemstore]] is true in which case it is reset every
   * time a new Replicache instance is created).
   */
  get clientID(): Promise<string> {
    return this._openResponse;
  }

  /**
   * A rough heuristic for whether the client is currently online. Note that there is no way to know
   * for certain whether a client is online - the next request can always fail. This is true if the last
   * sync attempt succeeded, and false otherwise.
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

    this._pullConnectionLoop.close();
    this._pushConnectionLoop.close();

    if (hasBroadcastChannel) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this._broadcastChannel!.close();
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
  }

  private async _getRoot(): Promise<string | undefined> {
    if (this._closed) {
      return undefined;
    }
    const res = await this._invoke(RPC.GetRoot);
    return res.root;
  }

  private _setRoot(root: Promise<string | undefined>) {
    this._root = root;
    this._setStorage(root);
  }

  private async _setStorage(root: Promise<string | undefined>) {
    const r = await root;
    if (this._closed) {
      return;
    }
    if (hasBroadcastChannel) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this._broadcastChannel!.postMessage(r);
    } else {
      // Also set an item in localStorage so that we can synchronize multiple
      // windows/tabs.
      localStorage[storageKeyName(this._name)] = r;
    }
  }

  // Callback for when window.onstorage fires which happens when a different tab
  // changes the db.
  private async _onStorage() {
    // Cannot just use the value from the other tab, because it can be behind us.
    // Also, in the case of memstore, it will have a totally different, unrelated
    // hash chain.
    this._checkChange(await this._getRoot());
  }

  private async _checkChange(root: string | undefined): Promise<void> {
    const currentRoot = await this._root; // instantaneous except maybe first time
    if (root !== undefined && root !== currentRoot) {
      this._setRoot(Promise.resolve(root));
      await this._fireOnChange();
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
    let tx: ReadTransactionImpl;
    return new ScanResult<K>(
      options,
      this._invoke,
      async () => {
        if (tx) {
          return tx;
        }
        tx = new ReadTransactionImpl(this._invoke);
        await tx.open({});
        return tx;
      },
      true,
    );
  }

  /**
   * Convenience form of `scan()` which returns all the entries as an array.
   */
  async scanAll<O extends ScanOptions, K extends KeyTypeForScanOptions<O>>(
    options?: O,
  ): Promise<[K, JSONValue][]> {
    const tx = new ReadTransactionImpl(this._invoke);
    try {
      await tx.open({});
      return await tx.scanAll(options);
    } finally {
      tx.close();
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
  }

  /**
   * Drops an index previously created with [[createIndex]].
   */
  async dropIndex(name: string): Promise<void> {
    await this._indexOp(tx => tx.dropIndex(name));
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

    const {replayMutations} = await this._invoke(
      RPC.MaybeEndTryPull,
      beginPullResult,
    );
    if (!replayMutations || replayMutations.length === 0) {
      // All done.
      await this._checkChange(syncHead);
      return;
    }

    // Replay.
    this._logger.debug ?? console.group('Replaying');
    for (const mutation of replayMutations) {
      syncHead = await this._replay(
        syncHead,
        mutation.original,
        mutation.name,
        JSON.parse(mutation.args),
      );
    }
    this._logger.debug ?? console.groupEnd();

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
      if (e.toString().includes('JSLogInfo')) {
        online = false;
      }
      this._logger.info?.(`${name} returned: ${e}`);
      return false;
    } finally {
      this._online = online;
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

  private async _fireOnChange(): Promise<void> {
    type R =
      | {ok: true; value: JSONValue | undefined}
      | {ok: false; error: unknown};
    const subscriptions = [...this._subscriptions];
    const results = await this.query(async tx => {
      const promises = subscriptions.map(async s => {
        // Tag the result so we can deal with success vs error below.
        try {
          return {ok: true, value: await s.body(tx)} as R;
        } catch (ex) {
          return {ok: false, error: ex} as R;
        }
      });
      return await Promise.all(promises);
    });
    for (let i = 0; i < subscriptions.length; i++) {
      const s = subscriptions[i];
      const result = results[i];
      if (result.ok) {
        const value: JSONValue | undefined = result.value;
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
    } as Subscription<R, E>;
    this._subscriptions.add(
      (s as unknown) as Subscription<JSONValue | undefined, unknown>,
    );
    (async () => {
      try {
        const res = await this.query(s.body);
        s.lastValue = res;
        s.onData(res);
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
        (s as unknown) as Subscription<JSONValue | undefined, unknown>,
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
      tx.close();
    }
  }

  /**
   * Registers a *mutator*, which is used to make changes to the data.
   *
   * ## Replays
   *
   * Mutators run once when they are initially invoked, but they might also be
   * *replayed* multiple times during sync. As such mutators should not modify
   * application state directly. Also, it is important that the set of
   * registered mutator names only grows over time. If Replicache syncs and
   * needed mutator is not registered, it will substitute a no-op mutator, but
   * this might be a poor user experience.
   *
   * ## Server application
   *
   * During sync, a description of each mutation is sent to the server's [push
   * endpoint](https://github.com/rocicorp/replicache/blob/main/SERVER_SETUP.md#step-5-upstream-sync)
   * where it is applied. Once the mutation has been applied successfully, as
   * indicated by the [client
   * view](https://github.com/rocicorp/replicache/blob/main/SERVER_SETUP.md#step-1-downstream-sync)'s
   * `lastMutationId` field, the local version of the mutation is removed. See
   * the [design
   * doc](https://github.com/rocicorp/replicache/blob/main/design.md) for
   * additional details on the sync protocol.
   *
   * ## Transactionality
   *
   * Mutators are atomic: all their changes are applied together, or none are.
   * Throwing an exception aborts the transaction. Otherwise, it is committed.
   * As with [[query]] and [[subscribe]] all reads will see a consistent view of the
   * cache while they run.
   *
   * ## Example
   *
   * `register` returns the function to use to mutate Replicache.
   *
   * ```ts
   * const createTodo = rep.register('createTodo',
   *   async (tx: WriteTransaction, args: JSONValue) => {
   *     const key = `/todo/${args.id}`;
   *     if (await tx.has(key)) {
   *       throw new Error('Todo already exists');
   *     }
   *     await tx.put(key, args);
   *   });
   * ```
   *
   * This will create the function to later use:
   *
   * ```ts
   * await createTodo({id: 1234, title: 'Make things work offline', complete: true});
   * ```
   */
  register<Return extends JSONValue | void>(
    name: string,
    mutatorImpl: (tx: WriteTransaction) => MaybePromise<Return>,
  ): () => Promise<Return>;
  register<Return extends JSONValue | void, Args extends JSONValue>(
    name: string,
    mutatorImpl: (tx: WriteTransaction, args: Args) => MaybePromise<Return>,
  ): (args: Args) => Promise<Return>;
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

    return async (args?: Args): Promise<Return> =>
      (await this._mutate(name, mutatorImpl, args, {isReplay: false})).result;
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
      tx.close();
      throw ex;
    }
    const {ref} = await tx.commit();
    if (!isReplay) {
      this._pushConnectionLoop.send();
      await this._checkChange(ref);
    }

    return {result, ref};
  }

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

export class ReplicacheTest extends Replicache {
  beginPull(): Promise<BeginPullResult> {
    return super._beginPull(MAX_REAUTH_TRIES);
  }

  maybeEndPull(beginPullResult: BeginPullResult): Promise<void> {
    return super._maybeEndPull(beginPullResult);
  }
}

type Subscription<R extends JSONValue | undefined, E> = {
  body: (tx: ReadTransaction) => Promise<R>;
  onData: (r: R) => void;
  onError?: (e: E) => void;
  onDone?: () => void;
  lastValue?: R;
};

const hasBroadcastChannel = typeof BroadcastChannel !== 'undefined';
