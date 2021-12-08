import {deepClone, deepEqual, ReadonlyJSONValue} from './json';
import type {JSONValue} from './json';
import type {KeyTypeForScanOptions, ScanOptions} from './scan-options';
import {Pusher, PushError} from './pusher';
import {Puller, PullError, PullResponse} from './puller';
import {
  SubscriptionTransactionWrapper,
  IndexTransactionImpl,
  ReadTransactionImpl,
  WriteTransactionImpl,
} from './transactions';
import type {
  CreateIndexDefinition,
  ReadTransaction,
  WriteTransaction,
} from './transactions';
import {ScanResult} from './scan-iterator';
import {ConnectionLoop, MAX_DELAY_MS, MIN_DELAY_MS} from './connection-loop';
import {getLogger, LogContext} from './logger';
import type {Logger} from './logger';
import {defaultPuller} from './puller';
import {defaultPusher} from './pusher';
import {resolver} from './resolver';
import type {ReplicacheOptions} from './replicache-options';
import {PullDelegate, PushDelegate} from './connection-loop-delegates';
import type {Subscription} from './subscriptions';
import {
  subscriptionsForChangedKeys,
  subscriptionsForIndexDefinitionChanged,
} from './subscriptions';
import {IDBStore, MemStore} from './kv/mod';
import type * as kv from './kv/mod';
import * as dag from './dag/mod';
import * as db from './db/mod';
import * as sync from './sync/mod';
import {
  assertHash,
  assertNotTempHash,
  emptyHash,
  Hash,
  initHasher,
  newTempHash,
} from './hash';
import {Lock} from './rw-lock';
import * as persist from './persist/mod';
import {requestIdle} from './request-idle';

export type BeginPullResult = {
  requestID: string;
  syncHead: Hash;
  ok: boolean;
};

export type Poke = {
  baseCookie: ReadonlyJSONValue;
  pullResponse: PullResponse;
};

export const httpStatusUnauthorized = 401;

const REPLICACHE_FORMAT_VERSION = 3;

export type MaybePromise<T> = T | Promise<T>;

type ToPromise<P> = P extends Promise<unknown> ? P : Promise<P>;

/** The key name to use in localStorage when synchronizing changes. */
const storageKeyName = (name: string) => `/replicache/root/${name}`;

/**
 * The maximum number of time to call out to getDataLayerAuth before giving up
 * and throwing an error.
 */
export const MAX_REAUTH_TRIES = 8;

const PERSIST_TIMEOUT = 1000;

const noop = () => {
  // noop
};

/**
 * This type describes the data we send on the BroadcastChannel when things
 * change.
 */
type BroadcastData = {
  root?: string;
  changedKeys: sync.ChangedKeysMap;
  index?: string;
};

/**
 * When using localStorage instead of BroadcastChannel we need to use a JSON
 * string.
 */
type StorageBroadcastData = Omit<BroadcastData, 'changedKeys'> & {
  changedKeys: [string, string[]][];
};

/**
 * The type used to describe the mutator definitions passed into [[Replicache]]
 * constructor as part of the [[ReplicacheOptions]].
 *
 * See [[ReplicacheOptions]] [[ReplicacheOptions.mutators|mutators]] for more
 * info.
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

type UnknownSubscription = Subscription<JSONValue | undefined, unknown>;
type SubscriptionSet = Set<UnknownSubscription>;

// eslint-disable-next-line @typescript-eslint/ban-types
export class Replicache<MD extends MutatorDefs = {}> {
  /** The URL to use when doing a pull request. */
  pullURL: string;

  /** The URL to use when doing a push request. */
  pushURL: string;

  /** The authorization token used when doing a push request. */
  auth: string;

  /** The name of the Replicache database. */
  readonly name: string;

  /**
   * This is the name Replicache uses for the IndexedDB database where data is
   * stored.
   */
  get idbName(): string {
    const n = `${this.name}:${REPLICACHE_FORMAT_VERSION}`;
    return this.schemaVersion ? `${n}:${this.schemaVersion}` : n;
  }

  /** The schema version of the data understood by this application. */
  schemaVersion: string;

  private _closed = false;
  private _online = true;
  private readonly _logger: Logger;
  private readonly _ready: Promise<void>;
  private readonly _clientIDPromise: Promise<string>;
  private _root: Promise<Hash | undefined> = Promise.resolve(undefined);
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

  private readonly _subscriptions: SubscriptionSet = new Set();
  private readonly _pendingSubscriptions: SubscriptionSet = new Set();

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

  /**
   * The function to use to pull data from the server.
   */
  puller: Puller;

  /**
   * The function to use to push data to the server.
   */
  pusher: Pusher;

  private readonly _memKVStore: kv.Store;
  private readonly _memdag: dag.Store;
  private readonly _perdag: dag.Store;
  private _hasPendingSubscriptionRuns = false;
  private readonly _lc: LogContext;

  private _endHearbeats = noop;
  private _endClientsGC = noop;

  private readonly _persistLock = new Lock();
  private _persistIsScheduled = false;

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
   * @deprecated Use [[getAuth]] instead.
   */
  getPullAuth:
    | (() => MaybePromise<string | null | undefined>)
    | null
    | undefined = null;

  /**
   * This gets called when we get an HTTP unauthorized (401) response from the push
   * endpoint. Set this to a function that will ask your user to reauthenticate.
   * @deprecated Use [[getAuth]] instead.
   */
  getPushAuth:
    | (() => MaybePromise<string | null | undefined>)
    | null
    | undefined = null;

  /**
   * This gets called when we get an HTTP unauthorized (401) response from the
   * push or pull endpoint. Set this to a function that will ask your user to
   * reauthenticate.
   */
  getAuth: (() => MaybePromise<string | null | undefined>) | null | undefined =
    null;

  constructor(options: ReplicacheOptions<MD> = {}) {
    const {
      name = 'default',
      logLevel = 'info',
      pullAuth,
      pullURL = '',
      pushAuth,
      auth,
      pushDelay = 10,
      pushURL = '',
      schemaVersion = '',
      pullInterval = 60_000,
      mutators = {} as MD,
      requestOptions = {},
      puller = defaultPuller,
      pusher = defaultPusher,
      experimentalKVStore,
    } = options;
    this.auth = auth ?? pullAuth ?? pushAuth ?? '';
    this.pullURL = pullURL;
    this.pushURL = pushURL;
    if (name === '') {
      throw new Error('name must be non-empty');
    }
    this.name = name;
    this.schemaVersion = schemaVersion;
    this.pullInterval = pullInterval;
    this.pushDelay = pushDelay;
    this.puller = puller;
    this.pusher = pusher;

    this._memKVStore = new MemStore();
    this._memdag = new dag.Store(
      this._memKVStore,
      this._memdagHashFunction(),
      assertHash,
    );
    const perKvStore = experimentalKVStore || new IDBStore(this.idbName);
    this._perdag = new dag.Store(
      perKvStore,
      dag.defaultChunkHasher,
      assertNotTempHash,
    );

    // Use a promise-resolve pair so that we have a promise to use even before
    // we call the Open RPC.
    const readyResolver = resolver<void>();
    this._ready = readyResolver.promise;

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

    this._logger = getLogger([], logLevel);

    this.mutate = this._registerMutators(mutators);

    this._lc = new LogContext(logLevel).addContext('db', name);

    const clientIDResolver = resolver<string>();
    this._clientIDPromise = clientIDResolver.promise;

    void this._open(clientIDResolver.resolve, readyResolver.resolve);
  }

  protected _memdagHashFunction(): <V extends ReadonlyJSONValue>(
    data: V,
  ) => Hash {
    return newTempHash;
  }

  private async _open(
    resolveClientID: (clientID: string) => void,
    resolveReady: () => void,
  ): Promise<void> {
    // If we are currently closing a Replicache instance with the same name,
    // wait for it to finish closing.
    await closingInstances.get(this.name);

    await initHasher();

    const initClientP = persist.initClient(this._perdag);

    await db.maybeInitDefaultDB(this._memdag);

    const [clientID] = await initClientP;
    resolveClientID(clientID);

    // Now we have both a clientID and DB!
    resolveReady();

    if (hasBroadcastChannel) {
      this._broadcastChannel = new BroadcastChannel(storageKeyName(this.name));
      this._broadcastChannel.onmessage = (e: MessageEvent<BroadcastData>) =>
        this._onBroadcastMessage(e.data);
    } else {
      window.addEventListener('storage', this._onStorage);
    }
    this._root = this._getRoot();
    await this._root;

    this.pull();
    this._push();

    this._endHearbeats = persist.startHeartbeats(clientID, this._perdag);
    this._endClientsGC = persist.initClientGC(clientID, this._perdag);
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
    const {promise, resolve} = resolver();
    closingInstances.set(this.name, promise);

    this._endHearbeats();
    this._endClientsGC();

    await this._ready;
    const closingPromises = [this._memdag.close(), this._perdag.close()];

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

    await Promise.all(closingPromises);
    closingInstances.delete(this.name);
    resolve();
  }

  private async _getRoot(): Promise<Hash | undefined> {
    if (this._closed) {
      return undefined;
    }
    await this._ready;
    return await db.getRoot(this._memdag, db.DEFAULT_HEAD_NAME);
  }

  private _onStorage = (e: StorageEvent) => {
    const {key, newValue} = e;
    if (newValue && key === storageKeyName(this.name)) {
      const {root, changedKeys, index} = JSON.parse(
        newValue,
      ) as StorageBroadcastData;

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
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
    await this._fireSubscriptions(subscriptions, false);
  }

  private _broadcastChange(
    root: Hash | undefined,
    changedKeys: sync.ChangedKeysMap,
    index: string | undefined,
  ) {
    if (this._broadcastChannel) {
      const data = {root, changedKeys, index};
      this._broadcastChannel.postMessage(data);
    } else {
      // local storage needs a string...
      const data = {root, changedKeys: [...changedKeys.entries()], index};
      localStorage[storageKeyName(this.name)] = JSON.stringify(data);
    }
  }

  private async _checkChange(
    root: Hash | undefined,
    changedKeys: sync.ChangedKeysMap,
  ): Promise<void> {
    const currentRoot = await this._root; // instantaneous except maybe first time
    if (root !== undefined && root !== currentRoot) {
      this._root = Promise.resolve(root);
      this._broadcastChange(root, changedKeys, undefined);
      await this._fireOnChange(changedKeys);
    }
  }

  /**
   * Get a single value from the database.
   * @deprecated Use [[query]] instead.
   */
  get(key: string): Promise<ReadonlyJSONValue | undefined> {
    return this.query(tx => tx.get(key));
  }

  /**
   * Determines if a single `key` is present in the database.
   * @deprecated Use [[query]] instead.
   */
  has(key: string): Promise<boolean> {
    return this.query(tx => tx.has(key));
  }

  /**
   * Whether the database is empty.
   * @deprecated Use [[query]] instead.
   */
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
   * @deprecated Use [[query]] instead.
   */
  scan<Options extends ScanOptions, Key extends KeyTypeForScanOptions<Options>>(
    options?: Options,
  ): ScanResult<Key, ReadonlyJSONValue> {
    return new ScanResult<Key>(
      options,
      async () => {
        await this._ready;
        const dagRead = await this._memdag.read();
        return db.readFromDefaultHead(dagRead);
      },
      true, // shouldCloseTransaction
      false, // shouldClone
    );
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
    await this._ready;
    const clientID = await this._clientIDPromise;
    await this._memdag.withWrite(async dagWrite => {
      const dbWrite = await db.Write.newIndexChange(
        db.whenceHead(db.DEFAULT_HEAD_NAME),
        dagWrite,
      );
      const tx = new IndexTransactionImpl(clientID, dbWrite, this._lc);
      await f(tx);
      await tx.commit();
    });
  }

  protected async _maybeEndPull(
    beginPullResult: BeginPullResult,
  ): Promise<void> {
    if (this._closed) {
      return;
    }

    let {syncHead} = beginPullResult;
    const {requestID} = beginPullResult;

    await this._ready;
    const lc = this._lc
      .addContext('rpc', 'maybeEndPull')
      .addContext('request_id', requestID);
    const {replayMutations, changedKeys} = await sync.maybeEndPull(
      this._memdag,
      lc,
      syncHead,
    );

    if (!replayMutations || replayMutations.length === 0) {
      // All done.
      await this._checkChange(syncHead, changedKeys);
      this._schedulePersist();
      return;
    }

    // Replay.
    for (const mutation of replayMutations) {
      syncHead = await this._replay(
        syncHead,
        mutation.original,
        mutation.name,
        mutation.args,
      );
    }

    await this._maybeEndPull({...beginPullResult, syncHead});
  }

  private async _replay<A extends JSONValue>(
    basis: Hash,
    original: Hash,
    name: string,
    args: A,
  ): Promise<Hash> {
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
    const res = await this._mutate(
      name,
      mutatorImpl,
      args,
      {basis, original},
      true, // isReplay
    );

    return res.ref;
  }

  private async _invokePull(): Promise<boolean> {
    if (this.pullURL === '' && this.puller === defaultPuller) {
      return true;
    }
    return await this._wrapInOnlineCheck(async () => {
      try {
        this._changeSyncCounters(0, 1);
        const beginPullResult = await this._beginPull(MAX_REAUTH_TRIES);
        if (!beginPullResult.ok) {
          return false;
        }
        if (beginPullResult.syncHead !== emptyHash) {
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

      if (e instanceof PushError || e instanceof PullError) {
        online = false;
        this._logger.info?.(
          `${name} threw:\n`,
          e,
          '\nwith cause:\n',
          e.causedBy,
        );
      } else {
        this._logger.info?.(`${name} threw:\n`, e);
      }
      return false;
    } finally {
      if (this._online !== online) {
        this._online = online;
        this.onOnlineChange?.(online);
      }
    }
  }

  protected async _invokePush(maxAuthTries: number): Promise<boolean> {
    if (this.pushURL === '' && this.pusher === defaultPusher) {
      return true;
    }
    return await this._wrapInOnlineCheck(async () => {
      let pushResponse;
      try {
        this._changeSyncCounters(1, 0);
        await this._ready;
        const clientID = await this._clientIDPromise;
        const requestID = sync.newRequestID(clientID);
        const lc = this._lc
          .addContext('rpc', 'push')
          .addContext('request_id', requestID);
        pushResponse = await sync.push(
          requestID,
          this._memdag,
          lc,
          clientID,
          this.pusher,
          this.pushURL,
          this.auth,
          this.schemaVersion,
        );
      } finally {
        this._changeSyncCounters(-1, 0);
      }

      const httpRequestInfo = pushResponse;

      if (httpRequestInfo) {
        const reauth = checkStatus(
          httpRequestInfo,
          'push',
          this.pushURL,
          this._logger,
        );

        // TODO: Add back support for mutationInfos? We used to log all the errors
        // here.

        if (reauth && (this.getAuth || this.getPushAuth)) {
          if (maxAuthTries === 0) {
            this._logger.info?.('Tried to reauthenticate too many times');
            return false;
          }
          const auth = await (this.getAuth
            ? this.getAuth()
            : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              this.getPushAuth!());
          if (auth !== null && auth !== undefined) {
            this.auth = auth;
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

  /**
   * Applies an update from the server to Replicache.
   * Throws an error if cookie does not match. In that case the server thinks
   * this client has a different cookie than it does; the caller should disconnect
   * from the server and re-register, which transmits the cookie the client actually
   * has.
   *
   * @experimental - This method is under development and its semantics will change.
   */
  async poke(poke: Poke): Promise<void> {
    await this._ready;
    // TODO(MP) Previously we created a request ID here and included it with the
    // PullRequest to the server so we could tie events across client and server
    // together. Since the direction is now reversed, creating and adding a request ID
    // here is kind of silly. We should consider creating the request ID
    // on the *server* and passing it down in the poke for inclusion here in the log
    // context.
    const clientID = await this._clientIDPromise;
    const requestID = sync.newRequestID(clientID);
    const lc = this._lc
      .addContext('rpc', 'handlePullResponse')
      .addContext('request_id', requestID);
    const syncHead = await sync.handlePullResponse(
      lc,
      this._memdag,
      poke.baseCookie,
      poke.pullResponse,
    );
    if (syncHead === null) {
      throw new Error(
        'unexpected base cookie for poke: ' + JSON.stringify(poke),
      );
    }

    await this._maybeEndPull({
      requestID,
      syncHead,
      ok: true,
    });
  }

  protected async _beginPull(maxAuthTries: number): Promise<BeginPullResult> {
    await this._ready;
    const clientID = await this._clientIDPromise;

    const requestID = sync.newRequestID(clientID);
    const lc = this._lc
      .addContext('rpc', 'beginPull')
      .addContext('request_id', requestID);
    const req = {
      pullAuth: this.auth,
      pullURL: this.pullURL,
      schemaVersion: this.schemaVersion,
      puller: this.puller,
    };
    const beginPullResponse = await sync.beginPull(
      clientID,
      req,
      req.puller,
      requestID,
      this._memdag,
      lc,
    );

    const {httpRequestInfo, syncHead} = beginPullResponse;

    const reauth = checkStatus(
      httpRequestInfo,
      'pull',
      this.pullURL,
      this._logger,
    );
    if (reauth && (this.getAuth || this.getPullAuth)) {
      if (maxAuthTries === 0) {
        this._logger.info?.('Tried to reauthenticate too many times');
        return {requestID, syncHead: emptyHash, ok: false};
      }

      let auth;
      try {
        // Don't want to say we are syncing when we are waiting for auth
        this._changeSyncCounters(0, -1);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        auth = await (this.getAuth ? this.getAuth() : this.getPullAuth!());
      } finally {
        this._changeSyncCounters(0, 1);
      }
      if (auth !== null && auth !== undefined) {
        this.auth = auth;
        // Try again now instead of waiting for next pull.
        return await this._beginPull(maxAuthTries - 1);
      }
    }

    return {requestID, syncHead, ok: httpRequestInfo.httpStatusCode === 200};
  }

  protected async _persist(): Promise<void> {
    if (this._closed) {
      return;
    }
    await this._ready;
    const clientID = await this.clientID;
    return this._persistLock.withLock(() =>
      persist.persist(clientID, this._memdag, this._perdag),
    );
  }

  private _schedulePersist(): void {
    if (this._persistIsScheduled) {
      return;
    }
    this._persistIsScheduled = true;
    void (async () => {
      await requestIdle(PERSIST_TIMEOUT);
      await this._persist();
      this._persistIsScheduled = false;
    })();
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
      // Run in a new microtask.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      Promise.resolve().then(() => this.onSync?.(syncing));
    }
  }

  private async _fireOnChange(changedKeys: sync.ChangedKeysMap): Promise<void> {
    const subscriptions = subscriptionsForChangedKeys(
      this._subscriptions,
      changedKeys,
    );
    await this._fireSubscriptions(subscriptions, false);
  }

  private async _indexDefinitionChanged(name: string): Promise<void> {
    // When an index definition changes we fire all subscriptions that uses
    // index scans with that index.
    const subscriptions = subscriptionsForIndexDefinitionChanged(
      this._subscriptions,
      name,
    );
    await this._fireSubscriptions(subscriptions, false);
    this._broadcastChange(await this._root, new Map(), name);
  }

  private async _fireSubscriptions(
    subscriptions: Iterable<Subscription<JSONValue | undefined, unknown>>,
    skipEqualsCheck: boolean,
  ) {
    const subs = [...subscriptions];
    if (subs.length === 0) {
      return;
    }

    type R =
      | {ok: true; value: JSONValue | undefined}
      | {ok: false; error: unknown};
    const results = await this._queryInternal(async tx => {
      const promises = subs.map(async s => {
        // Tag the result so we can deal with success vs error below.
        const stx = new SubscriptionTransactionWrapper(tx);
        try {
          const value = await s.body(stx);
          return {ok: true, value} as R;
        } catch (error) {
          return {ok: false, error} as R;
        } finally {
          // We need to keep track of the subscription keys even if there was an
          // exception because changes to the keys can make the subscription
          // body succeeed.
          s.keys = stx.keys;
          s.scans = stx.scans;
        }
      });
      return await Promise.all(promises);
    });
    for (let i = 0; i < subs.length; i++) {
      const s = subs[i];
      const result = results[i];
      if (result.ok) {
        const {value} = result;
        if (skipEqualsCheck || !deepEqual(value, s.lastValue)) {
          s.lastValue = value;
          s.onData(value);
        }
      } else {
        s.onError?.(result.error);
      }
    }
  }

  /**
   * Subscribe to changes to the underlying data. Every time the underlying data
   * changes `body` is called and if the result of `body` changes compared to
   * last time `onData` is called. The function is also called once the first
   * time the subscription is added.
   *
   * This returns a function that can be used to cancel the subscription.
   *
   * If an error occurs in the `body` the `onError` function is called if
   * present. Otherwise, the error is thrown.
   */
  subscribe<R extends ReadonlyJSONValue | undefined, E>(
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
    } as unknown as UnknownSubscription;
    this._subscriptions.add(s);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this._scheduleInitialSubscriptionRun(s);

    return (): void => {
      this._subscriptions.delete(s);
    };
  }
  private async _scheduleInitialSubscriptionRun(s: UnknownSubscription) {
    this._pendingSubscriptions.add(s);

    if (!this._hasPendingSubscriptionRuns) {
      this._hasPendingSubscriptionRuns = true;
      await Promise.resolve();
      this._hasPendingSubscriptionRuns = false;
      const subscriptions = [...this._pendingSubscriptions];
      this._pendingSubscriptions.clear();
      await this._fireSubscriptions(subscriptions, true);
    }
  }

  /**
   * Query is used for read transactions. It is recommended to use transactions
   * to ensure you get a consistent view across multiple calls to `get`, `has`
   * and `scan`.
   */
  async query<R>(body: (tx: ReadTransaction) => Promise<R> | R): Promise<R> {
    return this._queryInternal(body);
  }

  private async _queryInternal<R>(
    body: (tx: ReadTransactionImpl) => Promise<R> | R,
  ): Promise<R> {
    await this._ready;
    const clientID = await this._clientIDPromise;
    return await this._memdag.withRead(async dagRead => {
      const dbRead = await db.readFromDefaultHead(dagRead);
      const tx = new ReadTransactionImpl(clientID, dbRead, this._lc);
      return await body(tx);
    });
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
      (
        await this._mutate(
          name,
          mutatorImpl,
          args,
          undefined, // rebaseOpts
          false, // isReplay
        )
      ).result;
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
    rebaseOpts: sync.RebaseOpts | undefined,
    isReplay: boolean,
  ): Promise<{result: R; ref: Hash}> {
    // Ensure that we run initial pending subscribe functions before starting a
    // write transaction.
    if (this._hasPendingSubscriptionRuns) {
      await Promise.resolve();
    }

    await this._ready;
    const clientID = await this._clientIDPromise;
    return await this._memdag.withWrite(async dagWrite => {
      let whence: db.Whence | undefined;
      let originalHash: Hash | null = null;
      if (rebaseOpts === undefined) {
        whence = db.whenceHead(db.DEFAULT_HEAD_NAME);
      } else {
        await sync.validateRebase(rebaseOpts, dagWrite, name, args);
        whence = db.whenceHash(rebaseOpts.basis);
        originalHash = rebaseOpts.original;
      }

      const dbWrite = await db.Write.newLocal(
        whence,
        name,
        deepClone(args ?? null),
        originalHash,
        dagWrite,
      );

      const tx = new WriteTransactionImpl(clientID, dbWrite, this._lc);
      const result: R = await mutatorImpl(tx, args);

      const [ref, changedKeys] = await tx.commit(!isReplay);
      if (!isReplay) {
        this._pushConnectionLoop.send();
        await this._checkChange(ref, changedKeys);
        this._schedulePersist();
      }

      return {result, ref};
    });
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
    // TODO(arv): Maybe we should not log the server URL when the error comes
    // from a Pusher/Puller?
    logger.error?.(
      `Got error response from server (${serverURL}) doing ${verb}: ${httpStatusCode}` +
        (errorMessage ? `: ${errorMessage}` : ''),
    );
  }
  return httpStatusCode === httpStatusUnauthorized;
}

const hasBroadcastChannel = typeof BroadcastChannel !== 'undefined';

// This map is used to keep track of closing instances of Replicache. When an
// instance is opening we wait for any currently closing instances.
const closingInstances: Map<string, Promise<unknown>> = new Map();
