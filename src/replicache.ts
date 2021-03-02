import {deepEqual, JSONValue} from './json.js';
import type {KeyTypeForScanOptions, ScanOptions} from './scan-options.js';
import {
  Invoker,
  Invoke,
  OpenTransactionRequest,
  REPMWasmInvoker,
  InitInput,
} from './repm-invoker.js';
import {
  CreateIndexDefinition,
  IndexTransactionImpl,
  ReadTransactionImpl,
  WriteTransactionImpl,
} from './transactions.js';
import {ScanResult} from './scan-iterator.js';
import type {ReadTransaction, WriteTransaction} from './transactions.js';

type BeginPullResult = {
  requestID: string;
  syncHead: string;
};

export const httpStatusUnauthorized = 401;

export type MaybePromise<T> = T | Promise<T>;

/** The key name to use in localStorage when synchronizing changes. */
const storageKeyName = (name: string) => `/replicache/root/${name}`;

/** The maximum number of time to call out to getDataLayerAuth before giving up and throwing an error. */
const MAX_REAUTH_TRIES = 8;

/**
 * The options passed to [[default|Replicache]].
 */
export interface ReplicacheOptions {
  /**
   * This is the
   * [authentication](https://github.com/rocicorp/replicache/blob/master/SERVER_SETUP.md#authentication)
   * token used when doing a [push
   * ](https://github.com/rocicorp/replicache/blob/master/SERVER_SETUP.md#step-4-upstream-sync).
   */
  pushAuth?: string;

  /**
   * This is the URL to the server endpoint dealing with the push updates. See
   * [Server Setup Upstream Sync](https://github.com/rocicorp/replicache/blob/master/SERVER_SETUP.md#step-4-upstream-sync)
   * for more details.
   */
  pushURL?: string;

  /**
   * This is the
   * [authentication](https://github.com/rocicorp/replicache/blob/master/SERVER_SETUP.md#authentication)
   * token used when doing a [pull
   * ](https://github.com/rocicorp/replicache/blob/master/SERVER_SETUP.md#step-4-upstream-sync).
   */
  pullAuth?: string;

  /**
   * This is the URL to the server endpoint dealing with pull. See
   * [Server Setup Upstream Sync](https://github.com/rocicorp/replicache/blob/master/SERVER_SETUP.md#step-4-upstream-sync)
   * for more details.
   */
  pullURL?: string;

  /**
   * The name of the Replicache database. This defaults to `"default"`.
   *
   * You can use multiple Replicache instances as long as the names are unique.
   *
   * Using different names for different users allows you to switch users even
   * when you are offline. See
   * [sample/redo](https://github.com/rocicorp/replicache-sdk-js/blob/main/sample/redo/src/login.tsx)
   * for inspiration on how to do this.
   */
  name?: string;

  /**
   * The duration between each [[sync]]. Set this to `null` to prevent syncing
   * in the background.
   */
  syncInterval?: number | null;

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
}

export default class Replicache implements ReadTransaction {
  private _pullAuth: string;
  private readonly _pullURL: string;
  private _pushAuth: string;
  private readonly _pushURL: string;
  private readonly _name: string;
  private readonly _repmInvoker: Invoker;
  private readonly _useMemstore: boolean;

  private _closed = false;
  private _online = true;
  protected _opened: Promise<unknown> | null = null;
  private _root: Promise<string | undefined> = Promise.resolve(undefined);
  private readonly _mutatorRegistry = new Map<
    string,
    (tx: WriteTransaction, args?: JSONValue) => MaybePromise<void | JSONValue>
  >();
  private _syncPromise: Promise<void> | null = null;
  private readonly _subscriptions = new Set<
    Subscription<JSONValue | undefined, unknown>
  >();
  private _syncInterval: number | null;
  // NodeJS has a non standard setTimeout function :'(
  protected _timerId: ReturnType<typeof setTimeout> | 0 = 0;
  protected _pushTimerId: ReturnType<typeof setTimeout> | 0 = 0;

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
   * This gets called when we get an HTTP unauthorized from the pull
   * endpoint. Set this to a function that will ask your user to reauthenticate.
   */
  getPullAuth:
    | (() => MaybePromise<string | null | undefined>)
    | null
    | undefined = null;

  /**
   * This gets called when we get an HTTP unauthorized from the push
   * endpoint. Set this to a function that will ask your user to reauthenticate.
   */
  getPushAuth:
    | (() => MaybePromise<string | null | undefined>)
    | null
    | undefined = null;

  constructor(options: ReplicacheOptions) {
    const {
      name = 'default',
      pullAuth = '',
      pullURL = '',
      pushAuth = '',
      pushDelay = 300,
      pushURL = '',
      syncInterval = 60_000,
      useMemstore = false,
      wasmModule,
    } = options;
    this._pullAuth = pullAuth;
    this._pullURL = pullURL;
    this._pushAuth = pushAuth;
    this._pushURL = pushURL;
    this._name = name;
    this._repmInvoker = new REPMWasmInvoker(wasmModule);
    this._syncInterval = syncInterval;
    this.pushDelay = pushDelay;
    this._useMemstore = useMemstore;
    this._open();
  }

  private async _open(): Promise<void> {
    this._opened = this._repmInvoker.invoke(this._name, 'open', {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      use_memstore: this._useMemstore,
    });
    this._setRoot(this._getRoot());
    await this._root;
    if (this._syncInterval !== null) {
      await this.sync();
    }
    window.addEventListener('storage', this._onStorage);
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
   * The duration between each periodic [[sync]]. Setting this to `null` disables periodic sync completely.
   * Sync will still happen if you call [[sync]] manually, and after writes (see [[pushDelay]]).
   */
  get syncInterval(): number | null {
    return this._syncInterval;
  }
  set syncInterval(duration: number | null) {
    this._clearTimer();
    this._syncInterval = duration;
    this._scheduleSync(this._syncInterval);
  }

  private _scheduleSync(interval: number | null): void {
    if (interval) {
      this._timerId = setTimeout(() => this.sync(), interval);
    }
  }

  private _schedulePush(interval: number | null): void {
    // We do not want to restart the push timer.
    if (interval && this._pushTimerId === 0) {
      this._pushTimerId = setTimeout(() => {
        this._pushTimerId = 0;
        this.push();
      }, interval);
    }
  }

  private _clearTimer() {
    if (this._timerId !== 0) {
      clearTimeout(this._timerId);
      this._timerId = 0;
    }
  }

  /**
   * Closes this Replicache instance.
   *
   * When closed all subscriptions end and no more read or writes are allowed.
   */
  async close(): Promise<void> {
    this._closed = true;
    const p = this._invoke('close');

    this._clearTimer();
    window.removeEventListener('storage', this._onStorage);

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
    const res = await this._invoke('getRoot');
    return res.root;
  }

  private _setRoot(root: Promise<string | undefined>) {
    this._root = root;
    this._setStorage(root);
  }

  private async _setStorage(root: Promise<string | undefined>) {
    // Also set an item in localStorage so that we can synchronize multiple
    // windows/tabs.
    localStorage[storageKeyName(this._name)] = await root;
  }

  // Callback for when window.onstorage fires which happens when a different tab
  // changes the db.
  private _onStorage = (e: StorageEvent): void => {
    if (e.key === storageKeyName(this._name)) {
      this._checkChange(e.newValue as string);
    }
  };

  private async _checkChange(root: string | undefined): Promise<void> {
    const currentRoot = await this._root; // instantaneous except maybe first time
    if (root !== undefined && root !== currentRoot) {
      this._setRoot(Promise.resolve(root));
      await this._fireOnChange();
    }
  }

  private _invoke: Invoke = async (
    rpc: string,
    args?: JSONValue,
  ): Promise<JSONValue> => {
    await this._opened;
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
   * an error is returned.
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

  private async _sync(): Promise<void> {
    await this.push();
    await this.pull();
  }

  protected async _maybeEndPull(
    beginPullResult: BeginPullResult,
  ): Promise<void> {
    if (this._closed) {
      return;
    }

    let {syncHead} = beginPullResult;

    const {replayMutations} = await this._invoke(
      'maybeEndTryPull',
      beginPullResult,
    );
    if (!replayMutations || replayMutations.length === 0) {
      // All done.
      await this._checkChange(syncHead);
      return;
    }

    // Replay.
    console.group('Replaying');
    for (const mutation of replayMutations) {
      syncHead = await this._replay(
        syncHead,
        mutation.original,
        mutation.name,
        JSON.parse(mutation.args),
      );
    }
    console.groupEnd();

    const {requestID} = beginPullResult;
    await this._maybeEndPull({requestID, syncHead});
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
      console.error(`Unknown mutator ${name}`);
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

  /**
   * Synchronizes this cache with the server. New local mutations are sent to
   * the server, and the latest server state is applied to the cache. Any local
   * mutations not included in the new server state are replayed. See the
   * Replicache design document for more information on sync:
   * https://github.com/rocicorp/replicache/blob/master/design.md
   */
  async sync(): Promise<void> {
    if (this._closed) {
      return;
    }

    if (this._syncPromise !== null) {
      await this._syncPromise;
      // Call schedule instead of sync to debounce/dedupe multiple calls.
      this._clearTimer();
      this._scheduleSync(1);
      return;
    }

    this._clearTimer();
    this._fireOnSync(true);

    try {
      this._syncPromise = this._sync();
      await this._syncPromise;
    } finally {
      this._syncPromise = null;
      this._fireOnSync(false);
      this._scheduleSync(this._syncInterval);
    }
  }

  private async _wrapInOnlineCheck(
    f: () => Promise<void>,
    name: string,
  ): Promise<void> {
    let online = true;

    try {
      await f();
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
      console.info(`${name} returned: ${e}`);
    }

    this._online = online;
  }

  /**
   * Push pushes pending changes to the [[batchURL]].
   */
  async push(): Promise<void> {
    await this._wrapInOnlineCheck(() => this._push(MAX_REAUTH_TRIES), 'Push');
  }

  private async _push(maxAuthTries: number): Promise<void> {
    const pushResponse = await this._invoke('tryPush', {
      pushURL: this._pushURL,
      pushAuth: this._pushAuth,
    });

    let reauth = false;

    const {httpRequestInfo} = pushResponse;

    if (httpRequestInfo) {
      reauth = checkStatus(httpRequestInfo, 'push', this._pushURL);
      // mutationInfos support was never added to repc. We used to log all the
      // errors here.
    }

    if (reauth && this.getPushAuth) {
      if (maxAuthTries === 0) {
        console.info('Tried to reauthenticate too many times');
        return;
      }
      const pushAuth = await this.getPushAuth();
      if (pushAuth != null) {
        this._pushAuth = pushAuth;
        // Try again now instead of waiting for another 5 seconds.
        return await this._push(maxAuthTries - 1);
      }
    }
  }

  /**
   * Pull pulls changes from the [[clientViewURL]]. If there are any changes
   * local changes will get replayed on top of the new server state.
   */
  async pull(): Promise<void> {
    await this._wrapInOnlineCheck(async () => {
      const beginPullResult = await this._beginPull(MAX_REAUTH_TRIES);
      // TODO: repc never returns an empty syncHead... after
      // https://github.com/rocicorp/repc/commit/ea9d372e128ec5f9734cb4dadfeb490536577a9a
      if (beginPullResult.syncHead !== '') {
        await this._maybeEndPull(beginPullResult);
      }
    }, 'Pull');
  }

  protected async _beginPull(maxAuthTries: number): Promise<BeginPullResult> {
    const beginPullResponse = await this._invoke('beginTryPull', {
      pullAuth: this._pullAuth,
      pullURL: this._pullURL,
    });
    const {httpRequestInfo, syncHead, requestID} = beginPullResponse;

    let reauth = false;

    if (httpRequestInfo) {
      reauth = checkStatus(httpRequestInfo, 'pull', this._pullURL);
    }

    if (reauth && this.getPullAuth) {
      if (maxAuthTries === 0) {
        console.info('Tried to reauthenticate too many times');
        return {requestID, syncHead: ''};
      }
      const pullAuth = await this.getPullAuth();
      if (pullAuth != null) {
        this._pullAuth = pullAuth;
        // Try again now instead of waiting for another 5 seconds.
        return await this._beginPull(maxAuthTries - 1);
      }
    }

    return {requestID, syncHead};
  }

  private _fireOnSync(syncing: boolean): void {
    Promise.resolve().then(() => this.onSync?.(syncing));
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
   * During sync, a description of each mutation is sent to the server's [batch
   * endpoint](https://github.com/rocicorp/replicache/blob/master/README.md#step-5-upstream-sync)
   * where it is applied. Once the mutation has been applied successfully, as
   * indicated by the [client
   * view](https://github.com/rocicorp/replicache/blob/master/README.md#step-2-downstream-sync)'s
   * `lastMutationId` field, the local version of the mutation is removed. See
   * the [design
   * doc](https://github.com/rocicorp/replicache/blob/master/design.md) for
   * additional details on the sync protocol.
   *
   * ## Transactionality
   *
   * Mutators are atomic: all their changes are applied together, or none are.
   * Throwing an exception aborts the transaction. Otherwise, it is committed.
   * As with [query] and [subscribe] all reads will see a consistent view of
   * the cache while they run.
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
      this._schedulePush(this.pushDelay);
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
   */
  async setVerboseWasmLogging(verbose: boolean): Promise<void> {
    await this._invoke('setLogLevel', {level: verbose ? 'debug' : 'info'});
  }
}

function checkStatus(
  data: {httpStatusCode: number; errorMessage: string},
  verb: string,
  serverURL: string,
): boolean {
  const {httpStatusCode, errorMessage} = data;
  if (errorMessage || httpStatusCode >= 400) {
    console.error(
      `Got error response from server (${serverURL}) doing ${verb}: ${httpStatusCode}` +
        (errorMessage ? `: ${errorMessage}` : ''),
    );
  }
  return httpStatusCode === httpStatusUnauthorized;
}

export class ReplicacheTest extends Replicache {
  static async new({
    name = '',
    pullAuth,
    pullURL,
    pushAuth,
    pushDelay = 0,
    pushURL,
    useMemstore = false,
  }: {
    name?: string;
    pullAuth?: string;
    pullURL?: string;
    pushAuth?: string;
    pushDelay?: number;
    pushURL: string;
    useMemstore?: boolean;
  }): Promise<ReplicacheTest> {
    const rep = new ReplicacheTest({
      name,
      pullAuth,
      pullURL,
      pushAuth,
      pushDelay,
      pushURL,
      syncInterval: null,
      useMemstore,
    });
    await rep._opened;
    return rep;
  }

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
