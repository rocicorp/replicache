import type {JSONValue, ToJSON} from './json.js';
import type {ScanOptions} from './scan-options.js';
import type {DatabaseInfo} from './database-info.js';
import {
  Invoker,
  Invoke,
  OpenTransactionRequest,
  REPMWasmInvoker,
} from './repm-invoker.js';
import {ReadTransactionImpl, WriteTransactionImpl} from './transactions.js';
import {ScanResult} from './scan-iterator.js';
import type {ReadTransaction, WriteTransaction} from './transactions.js';

export type Mutator<Return extends JSONValue | void, Args extends JSONValue> = (
  args: Args,
) => Promise<Return | void>;
type MutatorImpl<Return extends JSONValue | void, Args extends JSONValue> = (
  tx: WriteTransaction,
  args: Args,
) => Promise<Return>;

type BeginSyncResult = {
  syncID: string;
  syncHead: string;
};

export const httpStatusUnauthorized = 401;

type MaybePromise<T> = T | Promise<T>;

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
    MutatorImpl<JSONValue, JSONValue>
  >();
  private _syncPromise: Promise<void> | null = null;
  private readonly _subscriptions = new Set<Subscription<unknown, unknown>>();
  private _syncInterval: number | null;
  private _pushDelay: number | null;
  // NodeJS has a non standard setTimeout function :'(
  protected _timerId: ReturnType<typeof setTimeout> | 0 = 0;

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

  constructor({
    batchURL = '',
    dataLayerAuth = '',
    diffServerAuth = '',
    diffServerURL,
    name = 'default',
    repmInvoker = new REPMWasmInvoker(),
    syncInterval = 60_000,
    pushDelay = 1_000,
  }: {
    batchURL?: string;
    dataLayerAuth?: string;
    diffServerAuth?: string;
    diffServerURL: string;
    name?: string;
    repmInvoker: Invoker;
    syncInterval?: number | null;
    pushDelay?: number | null;
  }) {
    this._batchURL = batchURL;
    this._dataLayerAuth = dataLayerAuth;
    this._diffServerAuth = diffServerAuth;
    this._diffServerURL = diffServerURL;
    this._name = name;
    this._repmInvoker = repmInvoker;
    this._syncInterval = syncInterval;
    this._pushDelay = pushDelay;
    this._open();
  }

  /**
   * Lists information about available local databases.
   */
  static async list({
    repmInvoker,
  }: {
    repmInvoker: Invoker;
  }): Promise<DatabaseInfo[]> {
    const res = await repmInvoker.invoke('', 'list');
    return res.databases;
  }

  private async _open(): Promise<void> {
    this._opened = this._repmInvoker.invoke(this._name, 'open');
    this._root = this._getRoot();
    await this._root;
    if (this._syncInterval !== null) {
      await this.sync();
    }
  }

  /**
   * Completely delete a local database. Remote replicas in the group aren't affected.
   */
  static async drop(
    name: string,
    {repmInvoker}: {repmInvoker: Invoker},
  ): Promise<void> {
    await repmInvoker.invoke(name, 'drop');
  }

  get isWasm(): boolean {
    return this._repmInvoker.isWasm || false;
  }

  get online(): boolean {
    return this._online;
  }

  get closed(): boolean {
    return this._closed;
  }

  /**
   * The duration between each `sync`. Set this to `null` to prevent syncing in
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

  /**
   * The delay between when a change is made to Replicache and when Replicache
   * attempts to push that change.
   */
  get pushDelay(): number | null {
    return this._pushDelay;
  }
  set pushDelay(delay: number | null) {
    this._pushDelay = delay;
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
    const p = this._invoke('close');

    this._clearTimer();

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

  private async _checkChange(root: string | undefined): Promise<void> {
    const currentRoot = await this._root; // instantaneous except maybe first time
    if (root !== undefined && root !== currentRoot) {
      this._root = Promise.resolve(root);
      await this._fireOnChange();
    }
  }

  private _invoke: Invoke = async (
    rpc: string,
    args?: JSONValue | ToJSON,
  ): Promise<JSONValue> => {
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
   * Gets many values from the database. This returns a `Result` which
   * implements `AsyncIterable`. It also has methods to iterate over the `keys`
   * and `entries`.
   * */
  scan({prefix = '', start}: ScanOptions = {}): ScanResult {
    let tx: ReadTransactionImpl;
    return new ScanResult(
      this.isWasm,
      prefix,
      start,
      this._invoke,
      async () => {
        if (tx) {
          return tx;
        }
        tx = new ReadTransactionImpl(this.isWasm, this._invoke);
        await tx.open({});
        return tx;
      },
      true,
    );
  }

  /**
   * Convenience form of scan() which returns all the results as an array.
   */
  async scanAll(options: ScanOptions = {}): Promise<[string, JSONValue][]> {
    const tx = new ReadTransactionImpl(this.isWasm, this._invoke);
    try {
      await tx.open({});
      return await tx.scanAll(options);
    } finally {
      tx.close();
    }
  }

  private async _sync(): Promise<void> {
    let online = true;

    try {
      const beginSyncResult = await this._beginSync();

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
      if (e.toString().indexOf('JSLogInfo') == -1) {
        online = false;
      }
      console.info(`Error: ${e}`);
    }
    this._online = online;
  }

  protected async _beginSync(): Promise<BeginSyncResult> {
    const beginSyncResult = await this._invoke('beginSync', {
      batchPushURL: this._batchURL,
      diffServerURL: this._diffServerURL,
      dataLayerAuth: this._dataLayerAuth,
      diffServerAuth: this._diffServerAuth,
    });

    const {syncInfo} = beginSyncResult;

    let reauth = false;

    // TODO:(repc-switchover): checkStatus only used by replicache-client.
    function checkStatus(
      data: {httpStatusCode?: number; errorMessage?: string},
      serverName: string,
    ) {
      const {httpStatusCode, errorMessage} = data;
      if (errorMessage !== '') {
        console.error(
          `Got error response from ${serverName} server: ${httpStatusCode}: ${errorMessage}`,
        );
      }
      if (httpStatusCode === httpStatusUnauthorized) {
        reauth = true;
      }
    }

    const {batchPushInfo} = {...syncInfo};
    if (batchPushInfo) {
      checkStatus(batchPushInfo, 'batch');
      const mutationInfos = batchPushInfo.batchPushResponse.mutationInfos;
      if (mutationInfos != null) {
        for (const mutationInfo of mutationInfos) {
          console.error(
            `MutationInfo: ID: ${mutationInfo.id}, Error: ${mutationInfo.error}`,
          );
        }
      }
    }

    const {clientViewInfo} = {...syncInfo};
    if (clientViewInfo) {
      checkStatus(syncInfo.clientViewInfo, 'client view');
    }

    if (reauth && this.getDataLayerAuth) {
      const dataLayerAuth = await this.getDataLayerAuth();
      if (dataLayerAuth != null) {
        this._dataLayerAuth = dataLayerAuth;
        // Try again now instead of waiting for another 5 seconds.
        return await this._beginSync();
      }
    }

    const syncHead = beginSyncResult.syncHead;
    const {syncID} = syncInfo;
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
    for (const mutation of replayMutations) {
      const {original} = mutation;
      syncHead = await this._replay(
        syncHead,
        original,
        mutation.name,
        mutation.args,
      );
    }

    const {syncID} = beginSyncResult;
    await this._maybeEndSync({syncID, syncHead});
  }

  private async _replay<A extends JSONValue>(
    basis: string,
    original: string,
    name: string,
    args: A,
  ): Promise<string> {
    const mutatorImpl = this._mutatorRegistry.get(name);
    if (!mutatorImpl) {
      console.error(`Unknown mutator ${name}`);
      return basis;
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
    const tx = new ReadTransactionImpl(this.isWasm, this._invoke);
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
  register<Return extends JSONValue | void, Args extends JSONValue>(
    name: string,
    mutatorImpl: MutatorImpl<Return, Args>,
  ): Mutator<Return, Args> {
    this._mutatorRegistry.set(
      name,
      (mutatorImpl as unknown) as MutatorImpl<JSONValue, JSONValue>,
    );
    return async (args: Args): Promise<Return> =>
      (await this._mutate(name, mutatorImpl, args, {shouldCheckChange: true}))
        .result;
  }

  private async _mutate<R extends JSONValue | void, A extends JSONValue>(
    name: string,
    mutatorImpl: MutatorImpl<R, A>,
    args: A,
    {
      invokeArgs,
      shouldCheckChange,
    }: {invokeArgs?: OpenTransactionRequest; shouldCheckChange: boolean},
  ): Promise<{result: R; ref: string}> {
    let actualInvokeArgs: OpenTransactionRequest = {args, name};
    if (invokeArgs !== undefined) {
      actualInvokeArgs = {...actualInvokeArgs, ...invokeArgs};
    }

    let result: R;
    const tx = new WriteTransactionImpl(this.isWasm, this._invoke);
    await tx.open(actualInvokeArgs);
    try {
      result = await mutatorImpl(tx, args);
    } catch (ex) {
      // No need to await the response.
      tx.close();
      throw ex;
    }
    const commitRes = await tx.commit();
    if (commitRes.retryCommit) {
      return await this._mutate(name, mutatorImpl, args, {
        invokeArgs,
        shouldCheckChange,
      });
    }

    const {ref} = commitRes;
    if (shouldCheckChange) {
      await this._checkChange(ref);
    }

    this._clearTimer();
    this._scheduleSync(this._pushDelay);

    return {result, ref};
  }
}

export class ReplicacheTest extends Replicache {
  static async new({
    batchURL,
    dataLayerAuth,
    diffServerAuth,
    diffServerURL,
    name = '',
    repmInvoker,
  }: {
    diffServerURL: string;
    batchURL?: string;
    dataLayerAuth?: string;
    diffServerAuth?: string;
    name?: string;
    repmInvoker: Invoker;
  }): Promise<ReplicacheTest> {
    const rep = new ReplicacheTest({
      batchURL,
      dataLayerAuth,
      diffServerAuth,
      diffServerURL,
      name,
      repmInvoker,
      syncInterval: null,
    });
    await rep._opened;
    return rep;
  }

  beginSync(): Promise<BeginSyncResult> {
    return super._beginSync();
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
