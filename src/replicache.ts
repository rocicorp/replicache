import type {JSONValue} from './json.js';
import type {KeyTypeForScanOptions, ScanOptions} from './scan-options.js';
import type {
  Invoker,
  Invoke,
  OpenTransactionRequest,
  InvokeMap,
} from './repm-invoker.js';
import {
  IndexTransactionImpl,
  ReadTransactionImpl,
  WriteTransactionImpl,
} from './transactions.js';
import {ScanResult} from './scan-iterator.js';
import {REPMWorkerInvoker} from './repm-worker-invoker.js';
import type {ReadTransaction, WriteTransaction} from './transactions.js';
import type {InitInput} from './repm-wasm-invoker.js';

/** @deprecated This type wasn't exact enough as described */
export type Mutator<Return extends JSONValue | void, Args extends JSONValue> = (
  args: Args,
) => Promise<Return | void>;

type BeginSyncResult = {
  syncID: string;
  syncHead: string;
};

export const httpStatusUnauthorized = 401;

type MaybePromise<T> = T | Promise<T>;

/** The key name to use in localStorage when synchronizing changes. */
const storageKeyName = (name: string) => `/replicache/root/${name}`;

/** The maximum number of time to call out to getDataLayerAuth before giving up and throwing an error. */
const MAX_REAUTH_TRIES = 8;

/**
 * The options passed to [[Replicache]].
 */
export interface ReplicacheOptions {
  batchURL?: string;
  dataLayerAuth?: string;
  diffServerAuth?: string;
  diffServerURL: string;
  name?: string;
  /** @deprecated Use wasmModule instead */
  repmInvoker?: Invoker;

  /**
   * The duration between each [[sync]]. Set this to `null` to prevent syncing in
   * the background.
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
}

export default class Replicache implements ReadTransaction {
  private readonly _batchURL: string;
  private _dataLayerAuth: string;
  private readonly _diffServerAuth: string;
  private readonly _diffServerURL: string;
  private readonly _name: string;
  private readonly _repmInvoker: Invoker;

  private _closed = false;
  private _online = true;
  protected _opened: Promise<unknown> | null = null;
  private _root: Promise<string | undefined> = Promise.resolve(undefined);
  private readonly _mutatorRegistry = new Map<
    string,
    (tx: WriteTransaction, args?: JSONValue) => MaybePromise<void | JSONValue>
  >();
  private _syncPromise: Promise<void> | null = null;
  private readonly _subscriptions = new Set<Subscription<unknown, unknown>>();
  private _syncInterval: number | null;
  // NodeJS has a non standard setTimeout function :'(
  protected _timerId: ReturnType<typeof setTimeout> | 0 = 0;

  /**
   * The delay between when a change is made to Replicache and when Replicache
   * attempts to push that change.
   */
  pushDelay: number;

  onSync: ((syncing: boolean) => void) | null = null;

  /**
   * This gets called when we get an HTTP unauthorized from the client view or
   * the batch endpoint. Set this to a function that will ask your user to
   * reauthenticate.
   */
  getDataLayerAuth:
    | (() => MaybePromise<string | null | undefined>)
    | null
    | undefined = null;

  constructor(options: ReplicacheOptions) {
    const {
      batchURL = '',
      dataLayerAuth = '',
      diffServerAuth = '',
      diffServerURL,
      name = 'default',
      repmInvoker,
      syncInterval = 60_000,
      pushDelay = 300,
      wasmModule,
    } = options;
    this._batchURL = batchURL;
    this._dataLayerAuth = dataLayerAuth;
    this._diffServerAuth = diffServerAuth;
    this._diffServerURL = diffServerURL;
    this._name = name;
    this._repmInvoker = repmInvoker ?? new REPMWorkerInvoker(wasmModule);
    this._syncInterval = syncInterval;
    this.pushDelay = pushDelay;
    this._open();
  }

  private async _open(): Promise<void> {
    this._opened = this._repmInvoker.invoke(this._name, 'open');
    this._setRoot(this._getRoot());
    await this._root;
    if (this._syncInterval !== null) {
      await this.sync();
    }
    window.addEventListener('storage', this._onStorage);
  }

  get online(): boolean {
    return this._online;
  }

  get closed(): boolean {
    return this._closed;
  }

  /**
   * The duration between each [[sync]]. Set this to `null` to prevent syncing in
   * the background.
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

  private _clearTimer() {
    if (this._timerId !== 0) {
      clearTimeout(this._timerId);
      this._timerId = 0;
    }
  }

  async close(): Promise<void> {
    this._closed = true;
    const p = this._invoke('close', undefined);

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
    const res = await this._invoke('getRoot', undefined);
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

  private _invoke: Invoke = async <K extends keyof InvokeMap>(
    rpc: K,
    args: InvokeMap[K][0],
  ): Promise<InvokeMap[K][1]> => {
    await this._opened;
    return await this._repmInvoker.invoke(this._name, rpc, args);
  };

  /** Get a single value from the database. */
  get(key: string): Promise<JSONValue | undefined> {
    return this.query(tx => tx.get(key));
  }

  /** Determines if a single key is present in the database. */
  has(key: string): Promise<boolean> {
    return this.query(tx => tx.has(key));
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
  async createIndex(def: {
    name: string;
    keyPrefix?: string;
    jsonPointer: string;
  }): Promise<void> {
    await this._indexOp(tx => tx.createIndex(def));
  }

  /**
   * Drops an index previously created with {@link createIndex}.
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
    let online = true;

    try {
      const beginSyncResult = await this._beginSync(MAX_REAUTH_TRIES);

      // TODO(repc-switchover)
      // replicache-client sends all zeros for null sync,
      // repc sends empty string.
      if (beginSyncResult.syncHead.replace(/0/g, '') !== '') {
        await this._maybeEndSync(beginSyncResult);
      }
    } catch (e) {
      // The error paths of beginSync and maybeEndSync need to be reworked.
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
      console.info(`Sync returned: ${e}`);
    }
    this._online = online;
  }

  protected async _beginSync(maxAuthTries: number): Promise<BeginSyncResult> {
    const beginSyncResult = await this._invoke('beginSync', {
      batchPushURL: this._batchURL,
      diffServerURL: this._diffServerURL,
      dataLayerAuth: this._dataLayerAuth,
      diffServerAuth: this._diffServerAuth,
    });

    const {syncInfo, syncHead} = beginSyncResult;

    let reauth = false;

    function checkStatus(
      data: {httpStatusCode: number; errorMessage: string},
      serverName: string,
      serverURL: string,
    ) {
      const {httpStatusCode, errorMessage} = data;
      if (errorMessage || httpStatusCode >= 400) {
        console.error(
          `Got error response from ${serverName} server (${serverURL}): ${httpStatusCode}` +
            (errorMessage ? `: ${errorMessage}` : ''),
        );
      }
      if (httpStatusCode === httpStatusUnauthorized) {
        reauth = true;
      }
    }

    const {batchPushInfo, clientViewInfo, syncID} = syncInfo;
    if (batchPushInfo) {
      checkStatus(batchPushInfo, 'batch', this._batchURL);
      const mutationInfos = batchPushInfo.batchPushResponse?.mutationInfos;
      if (mutationInfos != null) {
        for (const mutationInfo of mutationInfos) {
          console.error(
            `MutationInfo: ID: ${mutationInfo.id}, Error: ${mutationInfo.error}`,
          );
        }
      }
    }

    if (clientViewInfo) {
      checkStatus(clientViewInfo, 'client view', this._diffServerURL);
    }

    if (reauth && this.getDataLayerAuth) {
      if (maxAuthTries === 0) {
        console.info('Tried to reauthenticate too many times');
        return {syncID, syncHead: ''};
      }
      const dataLayerAuth = await this.getDataLayerAuth();
      if (dataLayerAuth != null) {
        this._dataLayerAuth = dataLayerAuth;
        // Try again now instead of waiting for another 5 seconds.
        return await this._beginSync(maxAuthTries - 1);
      }
    }

    return {syncID, syncHead};
  }

  protected async _maybeEndSync(
    beginSyncResult: BeginSyncResult,
  ): Promise<void> {
    if (this._closed) {
      return;
    }

    let {syncHead} = beginSyncResult;

    const {replayMutations} = await this._invoke(
      'maybeEndSync',
      beginSyncResult,
    );
    if (!replayMutations || replayMutations.length === 0) {
      // All done.
      await this._checkChange(syncHead);
      return;
    }

    // Replay.
    console.group('Replaying');
    for (const mutation of replayMutations) {
      const {original} = mutation;
      syncHead = await this._replay(
        syncHead,
        original,
        mutation.name,
        JSON.parse(mutation.args),
      );
    }
    console.groupEnd();

    const {syncID} = beginSyncResult;
    await this._maybeEndSync({syncID, syncHead});
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
      shouldCheckChange: false,
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
      await this.sync();
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

  private _fireOnSync(syncing: boolean): void {
    queueMicrotask(() => this.onSync?.(syncing));
  }

  private async _fireOnChange(): Promise<void> {
    const subscriptions = [...this._subscriptions];
    const results = await this.query(async tx => {
      const promises = subscriptions.map(async s => {
        // Tag the result so we can deal with success vs error below.
        try {
          return {ok: true, value: await s.body(tx)};
        } catch (ex) {
          return {ok: false, error: ex};
        }
      });
      return await Promise.all(promises);
    });
    for (let i = 0; i < subscriptions.length; i++) {
      const result = results[i];
      if (result.ok) {
        subscriptions[i].onData(result.value);
      } else {
        subscriptions[i].onError?.(result.error);
      }
    }
  }

  /**
   * Subcribe to changes to the underlying data. Every time the underlying data
   * changes `onData` is called. The function is also called once the first time
   * the subscription is added. There is currently no guarantee that the result
   * of this subscription changes and it might get called with the same value
   * over and over.
   *
   * This returns a function that can be used to cancel the subscription.
   *
   * If an error occurs in the `body` the `onError` function is called if
   * present. Otherwise, the error is thrown.
   */
  subscribe<R, E>(
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
    const s = {body, onData, onError, onDone} as Subscription<unknown, unknown>;
    this._subscriptions.add(s);
    (async () => {
      try {
        const res = await this.query(s.body);
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
      this._subscriptions.delete(s);
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
      (await this._mutate(name, mutatorImpl, args, {shouldCheckChange: true}))
        .result;
  }

  private async _mutate<R extends JSONValue | void, A extends JSONValue>(
    name: string,
    mutatorImpl: (tx: WriteTransaction, args?: A) => MaybePromise<R>,
    args: A | undefined,
    {
      invokeArgs,
      shouldCheckChange,
    }: {invokeArgs?: OpenTransactionRequest; shouldCheckChange: boolean},
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
    if (shouldCheckChange) {
      await this._checkChange(ref);
    }

    this._clearTimer();
    this._scheduleSync(this.pushDelay);

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

export class ReplicacheTest extends Replicache {
  static async new({
    batchURL,
    dataLayerAuth,
    diffServerAuth,
    diffServerURL,
    name = '',
  }: {
    diffServerURL: string;
    batchURL?: string;
    dataLayerAuth?: string;
    diffServerAuth?: string;
    name?: string;
  }): Promise<ReplicacheTest> {
    const rep = new ReplicacheTest({
      batchURL,
      dataLayerAuth,
      diffServerAuth,
      diffServerURL,
      name,
      syncInterval: null,
      pushDelay: 0,
      wasmModule: '/src/wasm/release/replicache_client_bg.wasm',
    });
    await rep._opened;
    return rep;
  }

  beginSync(): Promise<BeginSyncResult> {
    return super._beginSync(MAX_REAUTH_TRIES);
  }

  maybeEndSync(beginSyncResult: BeginSyncResult): Promise<void> {
    return super._maybeEndSync(beginSyncResult);
  }
}

type Subscription<R, E> = {
  body: (tx: ReadTransaction) => Promise<R>;
  onData: (r: R) => void;
  onError?: (e: E) => void;
  onDone?: () => void;
};
