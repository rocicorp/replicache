import type {JsonType} from './json.js';
import type {ScanItem} from './scan-item.js';
import type {ScanOptions} from './scan-options.js';
import type {DatabaseInfo} from './database-info.js';
import type {
  RepmInvoke,
  Invoke,
  OpenTransactionRequest,
} from './repm-invoker.js';
import {ReadTransactionImpl, WriteTransaction} from './transactions.js';
import type {ReadTransaction} from './transactions.js';

type Mutator<Return extends JsonType | void, Args extends JsonType> = (
  args: Args,
) => Promise<Return | void>;
type MutatorImpl<Return extends JsonType | void, Args extends JsonType> = (
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
  private readonly _batchUrl: string;
  private _dataLayerAuth: string;
  private readonly _diffServerAuth: string;
  private readonly _diffServerUrl: string;
  private readonly _name: string;
  private readonly _repmInvoke: RepmInvoke;

  private _closed = false;
  private _online = true;
  protected _opened: Promise<unknown> | null = null;
  private _root: Promise<string | undefined> = Promise.resolve(undefined);
  private readonly _mutatorRegistry = new Map<
    string,
    MutatorImpl<JsonType, JsonType>
  >();
  private _syncPromise: Promise<void> | null = null;
  private readonly _subscriptions = new Set<Subscription<unknown>>();
  protected _syncInterval: number | null = 60_000;
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
    batchUrl = '',
    dataLayerAuth = '',
    diffServerAuth = '',
    diffServerUrl,
    name = '',
    repmInvoke,
  }: {
    batchUrl?: string;
    dataLayerAuth?: string;
    diffServerAuth?: string;
    diffServerUrl: string;
    name?: string;
    repmInvoke: RepmInvoke;
  }) {
    this._batchUrl = batchUrl;
    this._dataLayerAuth = dataLayerAuth;
    this._diffServerAuth = diffServerAuth;
    this._diffServerUrl = diffServerUrl;
    this._name = name;
    this._repmInvoke = repmInvoke;
    this._open();
  }

  /**
   * Lists information about available local databases.
   */
  static async list({
    repmInvoke,
  }: {
    repmInvoke: RepmInvoke;
  }): Promise<DatabaseInfo[]> {
    const res = await repmInvoke('', 'list');
    return res['databases'];
  }

  private async _open(): Promise<void> {
    this._opened = this._repmInvoke(this._name, 'open');
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
    {repmInvoke}: {repmInvoke: RepmInvoke},
  ): Promise<void> {
    await repmInvoke(name, 'drop');
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
    if (this._timerId !== 0) {
      clearTimeout(this._timerId);
      this._timerId = 0;
    }
    this._syncInterval = duration;
    this._scheduleSync();
  }

  private _scheduleSync(): void {
    if (this._syncInterval !== null) {
      this._timerId = setTimeout(() => this.sync(), this._syncInterval);
    }
  }

  async close(): Promise<void> {
    this._closed = true;
    const p = this._invoke('close');

    // Clear timer

    // Clear subscriptions
    for (const subscription of this._subscriptions) {
      subscription.controller.close();
    }
    this._subscriptions.clear();

    await p;
  }

  async _getRoot(): Promise<string | undefined> {
    if (this._closed) {
      return undefined;
    }
    const res = await this._invoke('getRoot');
    return res.root;
  }

  async _checkChange(root: string | undefined): Promise<void> {
    const currentRoot = await this._root; // instantaneous except maybe first time
    if (root !== undefined && root !== currentRoot) {
      this._root = Promise.resolve(root);
      await this._fireOnChange();
    }
  }

  private _invoke: Invoke = async (
    rpc: string,
    args?: JsonType,
  ): Promise<JsonType> => {
    await this._opened;
    return await this._repmInvoke(this._name, rpc, args);
  };

  /** Get a single value from the database. */
  get(key: string): Promise<JsonType | undefined> {
    return this.query(tx => tx.get(key));
  }

  /** Determines if a single key is present in the database. */
  has(key: string): Promise<boolean> {
    return this.query(tx => tx.has(key));
  }

  /** Gets many values from the database. */
  scan({prefix = '', start, limit = 50}: ScanOptions = {}): Promise<
    Iterable<ScanItem>
  > {
    return this.query(tx => tx.scan({prefix, start, limit}));
  }

  private async _sync(): Promise<void> {
    try {
      const beginSyncResult = await this._beginSync();

      if (beginSyncResult.syncHead !== '00000000000000000000000000000000') {
        await this._maybeEndSync(beginSyncResult);
      }
      this._online = true;
    } catch (e) {
      // We purposely don't rethrow here because a common case is that an
      // exception is from beginSync() and we are offline. We don't want such
      // cases to look so exceptional in the console output.
      //
      // TODO: we can rethrow here once replicache-internal is improved to not
      // treat offlineness as an error.
      console.info('Error: $e');
      this._online = false;
    }
  }

  protected async _beginSync(): Promise<BeginSyncResult> {
    const beginSyncResult = await this._invoke('beginSync', {
      batchPushURL: this._batchUrl,
      diffServerURL: this._diffServerUrl,
      dataLayerAuth: this._dataLayerAuth,
      diffServerAuth: this._diffServerAuth,
    });

    const {syncInfo} = beginSyncResult;

    let reauth = false;

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

    const {batchPushInfo} = syncInfo;
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

    checkStatus(syncInfo.clientViewInfo, 'client view');

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

  private async _replay<A extends JsonType>(
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
      return;
    }

    if (this._timerId !== 0) {
      clearTimeout(this._timerId);
      this._timerId = 0;
    }
    this._fireOnSync(true);

    try {
      this._syncPromise = this._sync();
      await this._syncPromise;
    } finally {
      this._syncPromise = null;
      this._fireOnSync(false);
      this._scheduleSync();
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
          return {ok: true, value: await s.callback(tx)};
        } catch (ex) {
          return {ok: false, error: ex};
        }
      });
      return await Promise.all(promises);
    });
    for (let i = 0; i < subscriptions.length; i++) {
      const result = results[i];
      if (result.ok) {
        subscriptions[i].controller.enqueue(result.value);
      } else {
        subscriptions[i].controller.error(result.error);
        // After error the stream is no longer usable.
        this._subscriptions.delete(subscriptions[i]);
      }
    }
  }

  /**
   * Subcribe to changes to the underlying data. This returns a stream that can
   * be listened to. Every time the underlying data changes the listener is
   * invoked. The listener is also invoked once the first time the subscription
   * is added. There is currently no guarantee that the result of this
   * subscription changes and it might get called with the same value over and
   * over.
   */
  subscribe<R>(
    callback: (tx: ReadTransaction) => Promise<R>,
  ): ReadableStream<R> {
    let controller: ReadableStreamDefaultController<R>;

    const stream = new ReadableStream<R>({
      start: async (c: ReadableStreamDefaultController<R>): Promise<void> => {
        controller = c;
        // One initial call.
        const res = await this.query(callback);
        c.enqueue(res);
        this._subscriptions.add(subscription as Subscription<unknown>);
      },
      cancel: (): void => {
        this._subscriptions.delete(subscription as Subscription<unknown>);
      },
    });

    const subscription = {
      callback,
      // ReadableStream calls start synchronously so controller is defined here.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      controller,
    };

    return stream;
  }

  /**
   * Query is used for read transactions. It is recommended to use transactions
   * to ensure you get a consistent view across multiple calls to `get`, `has`
   * and `scan`.
   */
  async query<R>(callback: (tx: ReadTransaction) => Promise<R>): Promise<R> {
    const res = await this._invoke('openTransaction', {});
    const txId = res['transactionId'];
    try {
      const tx = new ReadTransactionImpl(this._invoke, txId);
      return await callback(tx);
    } finally {
      // No need to await the response.
      this._closeTransaction(txId);
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
  register<Return extends JsonType | void, Args extends JsonType>(
    name: string,
    mutatorImpl: MutatorImpl<Return, Args>,
  ): Mutator<Return, Args> {
    this._mutatorRegistry.set(
      name,
      (mutatorImpl as unknown) as MutatorImpl<JsonType, JsonType>,
    );
    return async (args: Args): Promise<Return> =>
      (await this._mutate(name, mutatorImpl, args, {shouldCheckChange: true}))
        .result;
  }

  async _mutate<R extends JsonType | void, A extends JsonType>(
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

    const {transactionId} = await this._invoke(
      'openTransaction',
      actualInvokeArgs,
    );
    let result: R;
    try {
      const tx = new WriteTransaction(this._invoke, transactionId);
      result = await mutatorImpl(tx, args);
    } catch (ex) {
      // No need to await the response.
      this._closeTransaction(transactionId);
      throw ex;
    }
    const commitRes = await this._invoke('commitTransaction', {
      transactionId,
    });
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
    return {result, ref};
  }

  private async _closeTransaction(txId: number): Promise<void> {
    try {
      await this._invoke('closeTransaction', {transactionId: txId});
    } catch (ex) {
      console.error('Failed to close transaction', ex);
    }
  }
}

export class ReplicacheTest extends Replicache {
  static async new({
    batchUrl,
    dataLayerAuth,
    diffServerAuth,
    diffServerUrl,
    name = '',
    repmInvoke,
  }: {
    diffServerUrl: string;
    batchUrl?: string;
    dataLayerAuth?: string;
    diffServerAuth?: string;
    name?: string;
    repmInvoke: RepmInvoke;
  }): Promise<ReplicacheTest> {
    const rep = new ReplicacheTest({
      batchUrl,
      dataLayerAuth,
      diffServerAuth,
      diffServerUrl,
      name,
      repmInvoke,
    });
    await rep._opened;
    // await this._root;
    return rep;
  }

  /** @override */
  protected _syncInterval: number | null = null;

  beginSync(): Promise<BeginSyncResult> {
    return super._beginSync();
  }

  maybeEndSync(beginSyncResult: BeginSyncResult): Promise<void> {
    return super._maybeEndSync(beginSyncResult);
  }
}

type Subscription<R> = {
  callback: (tx: ReadTransaction) => Promise<R>;
  controller: ReadableStreamDefaultController<R>;
};
