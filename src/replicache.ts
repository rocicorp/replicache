import {LogContext, OptionalLogger} from '@rocicorp/logger';
import {resolver, Lock} from './deps';
import {deepClone, deepEqual, ReadonlyJSONValue} from './json';
import type {JSONValue} from './json';
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
import {ConnectionLoop, MAX_DELAY_MS, MIN_DELAY_MS} from './connection-loop';
import {defaultPuller} from './puller';
import {defaultPusher} from './pusher';
import type {ReplicacheOptions} from './replicache-options';
import {PullDelegate, PushDelegate} from './connection-loop-delegates';
import type {Subscription} from './subscriptions';
import {
  subscriptionsForChangedKeys,
  subscriptionsForIndexDefinitionChanged,
} from './subscriptions';
import {IDBStore} from './kv/mod';
import * as dag from './dag/mod';
import * as db from './db/mod';
import * as sync from './sync/mod';
import {
  assertHash,
  assertNotTempHash,
  emptyHash,
  Hash,
  newTempHash,
} from './hash';
import * as persist from './persist/mod';
import {requestIdle} from './request-idle';
import type {HTTPRequestInfo} from './http-request-info';
import {assertNotUndefined} from './asserts';
import {
  getLicenseStatus,
  licenseActive,
  PROD_LICENSE_SERVER_URL,
  TEST_LICENSE_KEY,
  LicenseStatus,
} from '@rocicorp/licensing/src/client';
import {browserSimpleFetch} from './simple-fetch';
import {initBgIntervalProcess} from './persist/bg-interval';

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

export const REPLICACHE_FORMAT_VERSION = 4;
const LAZY_STORE_SOURCE_CHUNK_CACHE_SIZE_LIMIT = 100 * 2 ** 20; // 100 MB
const MUTATION_RECOVERY_LAZY_STORE_SOURCE_CHUNK_CACHE_SIZE_LIMIT = 10 * 2 ** 20; // 10 MB
const RECOVER_MUTATIONS_INTERVAL_MS = 5 * 60 * 1000; // 5 mins
const LICENSE_ACTIVE_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export type MaybePromise<T> = T | Promise<T>;

type ToPromise<P> = P extends Promise<unknown> ? P : Promise<P>;

export function makeIdbName(name: string, schemaVersion?: string): string {
  const n = `rep:${name}:${REPLICACHE_FORMAT_VERSION}`;
  return schemaVersion ? `${n}:${schemaVersion}` : n;
}

/**
 * The maximum number of time to call out to getAuth before giving up
 * and throwing an error.
 */
const MAX_REAUTH_TRIES = 8;

const PERSIST_TIMEOUT = 1000;

const noop = () => {
  // noop
};

/**
 * The type used to describe the mutator definitions passed into [Replicache](classes/Replicache)
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
    return makeIdbName(this.name, this.schemaVersion);
  }

  /** The schema version of the data understood by this application. */
  readonly schemaVersion: string;

  private get _idbDatabase(): persist.IndexedDBDatabase {
    return {
      name: this.idbName,
      replicacheName: this.name,
      replicacheFormatVersion: REPLICACHE_FORMAT_VERSION,
      schemaVersion: this.schemaVersion,
    };
  }
  private _closed = false;
  private _online = true;
  private readonly _logger: OptionalLogger;
  private readonly _ready: Promise<void>;
  private readonly _clientIDPromise: Promise<string>;
  private readonly _licenseCheckPromise: Promise<boolean>;

  /* The license is active if we have sent at least one license active ping
   * (and we will continue to). We do not send license active pings when
   * licensing is disabled (license key is undefined) or for the TEST_LICENSE_KEY.
   */
  protected _licenseActivePromise: Promise<boolean>;
  private _stopLicenseActive = noop;
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

  private readonly _licenseKey: string | undefined;

  private readonly _memdag: dag.Store;
  private readonly _perdag: dag.Store;
  private readonly _idbDatabases: persist.IDBDatabasesStore =
    new persist.IDBDatabasesStore();
  private _hasPendingSubscriptionRuns = false;
  private readonly _lc: LogContext;

  private _stopHeartbeats = noop;
  private _stopClientsGC = noop;
  private _recoverMutationsIntervalID: ReturnType<typeof setInterval> | 0 = 0;

  private readonly _persistLock = new Lock();
  private _persistIsScheduled = false;
  private _recoveringMutations = false;

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
   * `onClientStateNotFound` is called when the persistent client has been
   * garbage collected. This can happen if the client has not been used for over
   * a week.
   *
   * The default behavior is to reload the page (using `location.reload()`). Set
   * this to `null` or provide your own function to prevent the page from
   * reloading automatically.
   */
  onClientStateNotFound: (() => void) | null = reload;

  /**
   * This gets called when we get an HTTP unauthorized (401) response from the
   * push or pull endpoint. Set this to a function that will ask your user to
   * reauthenticate.
   */
  getAuth: (() => MaybePromise<string | null | undefined>) | null | undefined =
    null;

  constructor(options: ReplicacheOptions<MD>) {
    const {
      name,
      logLevel = 'info',
      pullURL = '',
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
      experimentalLicenseKey,
    } = options;
    this.auth = auth ?? '';
    this.pullURL = pullURL;
    this.pushURL = pushURL;
    if (name === undefined || name === '') {
      throw new Error('name is required and must be non-empty');
    }
    this.name = name;
    this.schemaVersion = schemaVersion;
    this.pullInterval = pullInterval;
    this.pushDelay = pushDelay;
    this.puller = puller;
    this.pusher = pusher;

    this._logger = new LogContext(logLevel);
    this._lc = new LogContext(logLevel).addContext('db', name);

    const perKvStore = experimentalKVStore || new IDBStore(this.idbName);
    this._perdag = new dag.StoreImpl(
      perKvStore,
      dag.throwChunkHasher,
      assertNotTempHash,
    );
    this._memdag = new dag.LazyStore(
      this._perdag,
      LAZY_STORE_SOURCE_CHUNK_CACHE_SIZE_LIMIT,
      this._memdagHashFunction(),
      assertHash,
    );

    // Use a promise-resolve pair so that we have a promise to use even before
    // we call the Open RPC.
    const readyResolver = resolver<void>();
    this._ready = readyResolver.promise;

    this._licenseKey = experimentalLicenseKey;
    const licenseCheckResolver = resolver<boolean>();
    this._licenseCheckPromise = licenseCheckResolver.promise;
    const licenseActiveResolver = resolver<boolean>();
    this._licenseActivePromise = licenseActiveResolver.promise;

    const {minDelayMs = MIN_DELAY_MS, maxDelayMs = MAX_DELAY_MS} =
      requestOptions;
    this._requestOptions = {maxDelayMs, minDelayMs};

    this._pullConnectionLoop = new ConnectionLoop(
      new PullDelegate(
        this,
        () => this._invokePull(),
        this._lc.addContext('PULL'),
      ),
    );

    this._pushConnectionLoop = new ConnectionLoop(
      new PushDelegate(
        this,
        () => this._invokePush(),
        this._lc.addContext('PUSH'),
      ),
    );

    this.mutate = this._registerMutators(mutators);

    const clientIDResolver = resolver<string>();
    this._clientIDPromise = clientIDResolver.promise;

    void this._open(
      clientIDResolver.resolve,
      readyResolver.resolve,
      licenseCheckResolver.resolve,
      licenseActiveResolver.resolve,
    );
  }

  protected _memdagHashFunction(): <V extends ReadonlyJSONValue>(
    data: V,
  ) => Hash {
    return newTempHash;
  }

  private async _open(
    resolveClientID: (clientID: string) => void,
    resolveReady: () => void,
    resolveLicenseCheck: (valid: boolean) => void,
    resolveLicenseActive: (active: boolean) => void,
  ): Promise<void> {
    // If we are currently closing a Replicache instance with the same name,
    // wait for it to finish closing.
    await closingInstances.get(this.name);
    await this._idbDatabases.putDatabase(this._idbDatabase);
    const [clientID, client, clients] = await persist.initClient(this._perdag);
    resolveClientID(clientID);
    await this._memdag.withWrite(async write => {
      await write.setHead(db.DEFAULT_HEAD_NAME, client.headHash);
      await write.commit();
    });

    // Now we have both a clientID and DB!
    resolveReady();

    this._root = this._getRoot();
    await this._root;

    await this._licenseCheck(resolveLicenseCheck);

    this.pull();
    this._push();

    this._stopHeartbeats = persist.startHeartbeats(
      clientID,
      this._perdag,
      () => {
        this._fireOnClientStateNotFound(clientID);
      },
      this._lc,
    );
    this._stopClientsGC = persist.initClientGC(
      clientID,
      this._perdag,
      this._lc,
    );
    this._recoverMutationsIntervalID = setInterval(
      () => this._recoverMutations(),
      RECOVER_MUTATIONS_INTERVAL_MS,
    );
    void this._recoverMutations(clients);

    this._stopLicenseActive = await this._startLicenseActive(
      resolveLicenseActive,
      this._lc,
    );

    getDocument()?.addEventListener(
      'visibilitychange',
      this._onVisibilityChange,
    );
  }

  private _onVisibilityChange = async () => {
    if (this._closed) {
      return;
    }

    // In case of running in a worker, we don't have a document.
    if (getDocument()?.visibilityState !== 'visible') {
      return;
    }

    await this._checkForClientStateNotFoundAndCallHandler();
  };

  private async _checkForClientStateNotFoundAndCallHandler(): Promise<boolean> {
    const clientID = await this._clientIDPromise;
    const hasClientState = await this._perdag.withRead(read =>
      persist.hasClientState(clientID, read),
    );
    if (!hasClientState) {
      this._fireOnClientStateNotFound(clientID);
    }
    return !hasClientState;
  }

  private async _licenseCheck(
    resolveLicenseCheck: (valid: boolean) => void,
  ): Promise<void> {
    // Licensing is experimental, so if a key is not set don't do anything.
    if (this._licenseKey === undefined) {
      resolveLicenseCheck(true);
      return;
    }
    this._logger.info?.(`Licensing enabled. Key: ${this._licenseKey}`);
    if (this._licenseKey === TEST_LICENSE_KEY) {
      this._logger.info?.(
        `Skipping license check for TEST_LICENSE_KEY. ` +
          `You may ONLY use this key for automated (e.g., unit/CI) testing. ` +
          // TODO(phritz) maybe use a more specific URL
          `See https://replicache.dev for more information.`,
      );
      resolveLicenseCheck(true);
      return;
    }
    try {
      const status = await getLicenseStatus(
        browserSimpleFetch,
        PROD_LICENSE_SERVER_URL,
        this._licenseKey,
      );
      if (status === LicenseStatus.Valid) {
        this._logger.info?.(`License is valid.`);
      } else {
        this._logger.error?.(`License is not valid; status: ${status}`);
        // TODO(phritz) kill switch
        resolveLicenseCheck(false);
        return;
      }
    } catch (err) {
      this._logger.info?.(`Error checking license: ${err}`);
      // Note: on error we fall through to assuming the license is valid.
    }
    resolveLicenseCheck(true);
  }

  private async _startLicenseActive(
    resolveLicenseActive: (valid: boolean) => void,
    lc: LogContext,
  ): Promise<() => void> {
    if (
      this._licenseKey === undefined ||
      this._licenseKey === TEST_LICENSE_KEY
    ) {
      resolveLicenseActive(false);
      return noop;
    }

    const markActive = async () => {
      try {
        // TODO(phritz) add browser profile
        await licenseActive(
          browserSimpleFetch,
          PROD_LICENSE_SERVER_URL,
          this._licenseKey as string,
          'TODO-BROWSER-PROFILE-ID',
        );
      } catch (err) {
        this._logger.info?.(`Error sending license active ping: ${err}`);
      }
    };
    await markActive();
    resolveLicenseActive(true);

    return initBgIntervalProcess(
      'LicenseActive',
      markActive,
      LICENSE_ACTIVE_INTERVAL_MS,
      lc,
    );
  }

  /**
   * The client ID for this instance of Replicache. Each instance of Replicache
   * gets a unique client ID.
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

    this._stopLicenseActive();
    this._stopHeartbeats();
    this._stopClientsGC();
    if (this._recoverMutationsIntervalID) {
      clearInterval(this._recoverMutationsIntervalID);
    }

    getDocument()?.removeEventListener(
      'visibilitychange',
      this._onVisibilityChange,
    );

    await this._ready;
    const closingPromises = [
      this._memdag.close(),
      this._perdag.close(),
      this._idbDatabases.close(),
    ];

    this._pullConnectionLoop.close();
    this._pushConnectionLoop.close();

    // Clear subscriptions
    for (const subscription of this._subscriptions) {
      subscription.onDone?.();
    }
    this._subscriptions.clear();

    await Promise.all(closingPromises);
    closingInstances.delete(this.name);
    resolve();
  }

  /**
   * Indicates whether the license passed to Replicache is valid. The
   * TEST_LICENSE_KEY is always valid, but may only be used for automated
   * testing.
   */
  get licenseValid(): Promise<boolean> {
    return this._licenseCheckPromise;
  }

  private async _getRoot(): Promise<Hash | undefined> {
    if (this._closed) {
      return undefined;
    }
    await this._ready;
    return await db.getRoot(this._memdag, db.DEFAULT_HEAD_NAME);
  }

  private async _checkChange(
    root: Hash | undefined,
    changedKeys: sync.ChangedKeysMap,
  ): Promise<void> {
    const currentRoot = await this._root; // instantaneous except maybe first time
    if (root !== undefined && root !== currentRoot) {
      this._root = Promise.resolve(root);
      await this._fireOnChange(changedKeys);
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
        mutation.timestamp,
      );
    }

    await this._maybeEndPull({...beginPullResult, syncHead});
  }

  private async _replay<A extends JSONValue>(
    basis: Hash,
    original: Hash,
    name: string,
    args: A,
    timestamp: number,
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
      timestamp,
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
        const beginPullResult = await this._beginPull();
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
        if (online) {
          void this._recoverMutations();
        }
      }
    }
  }

  private async _wrapInReauthRetries<R>(
    f: () => Promise<{
      httpRequestInfo: HTTPRequestInfo | undefined;
      result: R;
    }>,
    verb: string,
    serverURL: string,
    preAuth: () => MaybePromise<void> = noop,
    postAuth: () => MaybePromise<void> = noop,
  ): Promise<{
    result: R;
    authFailure: boolean;
  }> {
    let reauthAttempts = 0;
    let lastResult;
    do {
      const {httpRequestInfo, result} = await f();
      lastResult = result;
      if (!httpRequestInfo) {
        return {
          result,
          authFailure: false,
        };
      }
      const {errorMessage, httpStatusCode} = httpRequestInfo;

      if (errorMessage || httpStatusCode >= 400) {
        // TODO(arv): Maybe we should not log the server URL when the error comes
        // from a Pusher/Puller?
        this._logger.error?.(
          `Got error response from server (${serverURL}) doing ${verb}: ${httpStatusCode}` +
            (errorMessage ? `: ${errorMessage}` : ''),
        );
      }
      if (httpStatusCode !== httpStatusUnauthorized) {
        return {
          result,
          authFailure: false,
        };
      }
      if (!this.getAuth) {
        return {
          result,
          authFailure: true,
        };
      }
      let auth;
      try {
        await preAuth();
        auth = await this.getAuth();
      } finally {
        await postAuth();
      }
      if (auth === null || auth === undefined) {
        return {
          result,
          authFailure: true,
        };
      }
      this.auth = auth;
      reauthAttempts++;
    } while (reauthAttempts < MAX_REAUTH_TRIES);
    this._logger.info?.('Tried to reauthenticate too many times');
    return {
      result: lastResult,
      authFailure: true,
    };
  }

  protected async _invokePush(): Promise<boolean> {
    if (this.pushURL === '' && this.pusher === defaultPusher) {
      return true;
    }

    return this._wrapInOnlineCheck(async () => {
      const {result: pushResponse} = await this._wrapInReauthRetries(
        async () => {
          await this._ready;
          const clientID = await this._clientIDPromise;
          const requestID = sync.newRequestID(clientID);
          const lc = this._lc
            .addContext('rpc', 'push')
            .addContext('request_id', requestID);
          try {
            this._changeSyncCounters(1, 0);
            const pushResponse = await sync.push(
              requestID,
              this._memdag,
              lc,
              clientID,
              this.pusher,
              this.pushURL,
              this.auth,
              this.schemaVersion,
            );
            return {result: pushResponse, httpRequestInfo: pushResponse};
          } finally {
            this._changeSyncCounters(-1, 0);
          }
        },
        'push',
        this.pushURL,
      );
      // No pushResponse means we didn't do a push because there were no
      // pending mutations.
      return pushResponse === undefined || pushResponse.httpStatusCode === 200;
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

  protected async _beginPull(): Promise<BeginPullResult> {
    const {
      result: {beginPullResponse, requestID},
    } = await this._wrapInReauthRetries(
      async () => {
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
        return {
          result: {beginPullResponse, requestID},
          httpRequestInfo: beginPullResponse.httpRequestInfo,
        };
      },
      'pull',
      this.pullURL,
      () => this._changeSyncCounters(0, -1),
      () => this._changeSyncCounters(0, 1),
    );
    const {syncHead, httpRequestInfo} = beginPullResponse;
    return {requestID, syncHead, ok: httpRequestInfo.httpStatusCode === 200};
  }

  protected async _persist(): Promise<void> {
    if (this._closed) {
      return;
    }
    await this._ready;
    const clientID = await this.clientID;
    try {
      await this._persistLock.withLock(() =>
        persist.persist(clientID, this._memdag, this._perdag),
      );
    } catch (e) {
      if (e instanceof persist.ClientStateNotFoundError) {
        this._fireOnClientStateNotFound(clientID);
      } else {
        throw e;
      }
    }
  }
  private _fireOnClientStateNotFound(clientID: sync.ClientID) {
    this._logger.error?.(`Client state not found, clientID: ${clientID}`);
    this.onClientStateNotFound?.();
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
        if (s.onError) {
          s.onError(result.error);
        } else {
          this._logger.error?.(result.error);
        }
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

    void this._scheduleInitialSubscriptionRun(s);

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
    return this._memdag.withRead(async dagRead => {
      const dbRead = await db.readFromDefaultHead(dagRead);
      const tx = new ReadTransactionImpl(clientID, dbRead, this._lc);
      try {
        return await body(tx);
      } catch (ex) {
        throw await this._convertToClientStateNotFoundError(ex);
      }
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
          performance.now(),
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
    timestamp: number,
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
        timestamp,
      );

      const tx = new WriteTransactionImpl(clientID, dbWrite, this._lc);
      try {
        const result: R = await mutatorImpl(tx, args);

        const [ref, changedKeys] = await tx.commit(!isReplay);
        if (!isReplay) {
          this._pushConnectionLoop.send();
          await this._checkChange(ref, changedKeys);
          this._schedulePersist();
        }

        return {result, ref};
      } catch (ex) {
        throw await this._convertToClientStateNotFoundError(ex);
      }
    });
  }

  /**
   * In the case we get a ChunkNotFoundError we check if the client got garbage
   * collected and if so change the error to a ClientNotFoundError instead
   */
  private async _convertToClientStateNotFoundError(
    ex: unknown,
  ): Promise<unknown> {
    if (
      ex instanceof dag.ChunkNotFoundError &&
      (await this._checkForClientStateNotFoundAndCallHandler())
    ) {
      return new persist.ClientStateNotFoundError(await this._clientIDPromise);
    }

    return ex;
  }

  protected async _recoverMutations(
    preReadClientMap?: persist.ClientMap,
  ): Promise<boolean> {
    if (this._recoveringMutations || !this.online || this.closed) {
      return false;
    }
    const stepDescription = 'Recovering mutations.';
    this._lc.debug?.('Start:', stepDescription);
    try {
      this._recoveringMutations = true;
      await this._ready;
      await this._recoverMutationsFromPerdag(
        this._idbDatabase,
        this._perdag,
        preReadClientMap,
      );
      for (const database of Object.values(
        await this._idbDatabases.getDatabases(),
      )) {
        if (this.closed) {
          this._lc.debug?.('Exiting early due to close:', stepDescription);
          return true;
        }
        if (
          database.name === this.idbName ||
          database.replicacheName !== this.name ||
          // TODO: when REPLICACHE_FORMAT_VERSION is update
          // need to also handle previous REPLICACHE_FORMAT_VERSIONs
          database.replicacheFormatVersion !== REPLICACHE_FORMAT_VERSION
        ) {
          continue;
        }
        await this._recoverMutationsFromPerdag(database);
      }
    } catch (e) {
      this._logMutationRecoveryError(e, stepDescription);
    } finally {
      this._lc.debug?.('End:', stepDescription);
      this._recoveringMutations = false;
    }
    return true;
  }

  private async _recoverMutationsFromPerdag(
    database: persist.IndexedDBDatabase,
    perdag?: dag.Store,
    preReadClientMap?: persist.ClientMap,
  ): Promise<void> {
    const stepDescription = `Recovering mutations from db ${database.name}.`;
    this._lc.debug?.('Start:', stepDescription);
    let perDagToClose: dag.Store | undefined = undefined;
    try {
      if (!perdag) {
        const perKvStore = new IDBStore(database.name);
        perdag = perDagToClose = new dag.StoreImpl(
          perKvStore,
          dag.throwChunkHasher,
          assertNotTempHash,
        );
      }
      let clientMap: persist.ClientMap | undefined =
        preReadClientMap ||
        (await perdag.withRead(read => persist.getClients(read)));
      const clientIDsVisited = new Set<sync.ClientID>();
      while (clientMap) {
        let newClientMap: persist.ClientMap | undefined;
        for (const [clientID, client] of clientMap) {
          if (this.closed) {
            this._lc.debug?.('Exiting early due to close:', stepDescription);
            return;
          }
          if (!clientIDsVisited.has(clientID)) {
            clientIDsVisited.add(clientID);
            newClientMap = await this._recoverMutationsOfClient(
              client,
              clientID,
              perdag,
              database,
            );
            if (newClientMap) {
              break;
            }
          }
        }
        clientMap = newClientMap;
      }
    } catch (e) {
      this._logMutationRecoveryError(e, stepDescription);
    } finally {
      await perDagToClose?.close();
      this._lc.debug?.('End:', stepDescription);
    }
  }

  /**
   * @returns When mutations are recovered the resulting updated client map.
   *   Otherwise undefined, which can be because there were no mutations to
   *   recover, or because an error occurred when trying to recover the
   *   mutations.
   */
  private async _recoverMutationsOfClient(
    client: persist.Client,
    clientID: sync.ClientID,
    perdag: dag.Store,
    database: persist.IndexedDBDatabase,
  ): Promise<persist.ClientMap | undefined> {
    const selfClientID = await this._clientIDPromise;
    if (selfClientID === clientID) {
      return undefined;
    }
    if (client.lastServerAckdMutationID >= client.mutationID) {
      return undefined;
    }
    const stepDescription = `Recovering mutations for ${clientID}.`;
    this._lc.debug?.('Start:', stepDescription);
    let dagForOtherClientToClose: dag.LazyStore | undefined;
    try {
      const dagForOtherClient = (dagForOtherClientToClose = new dag.LazyStore(
        perdag,
        MUTATION_RECOVERY_LAZY_STORE_SOURCE_CHUNK_CACHE_SIZE_LIMIT,
        dag.throwChunkHasher,
        assertHash,
      ));

      await dagForOtherClient.withWrite(async write => {
        await write.setHead(db.DEFAULT_HEAD_NAME, client.headHash);
        await write.commit();
      });

      const pushRequestID = sync.newRequestID(clientID);
      const pushDescription = 'recoveringMutationsPush';
      const pushLC = this._lc
        .addContext('rpc', pushDescription)
        .addContext('request_id', pushRequestID);
      const pushSucceeded = await this._wrapInOnlineCheck(async () => {
        const {result: pushResponse} = await this._wrapInReauthRetries(
          async () => {
            assertNotUndefined(dagForOtherClient);
            const pushResponse = await sync.push(
              pushRequestID,
              dagForOtherClient,
              pushLC,
              clientID,
              this.pusher,
              this.pushURL,
              this.auth,
              database.schemaVersion,
            );
            return {result: pushResponse, httpRequestInfo: pushResponse};
          },
          pushDescription,
          this.pushURL,
        );
        return !!pushResponse && pushResponse.httpStatusCode === 200;
      }, pushDescription);
      if (!pushSucceeded) {
        this._lc.debug?.(
          `Failed to recover mutations for client ${clientID} due to a push error.`,
        );
        return;
      }

      const requestID = sync.newRequestID(clientID);
      const pullDescription = 'recoveringMutationsPull';
      const pullLC = this._lc
        .addContext('rpc', pullDescription)
        .addContext('request_id', requestID);
      const beginPullRequest = {
        pullAuth: this.auth,
        pullURL: this.pullURL,
        schemaVersion: database.schemaVersion,
        puller: this.puller,
      };
      let pullResponse: PullResponse | undefined;
      const pullSucceeded = await this._wrapInOnlineCheck(async () => {
        const {result: beginPullResponse} = await this._wrapInReauthRetries(
          async () => {
            const beginPullResponse = await sync.beginPull(
              clientID,
              beginPullRequest,
              beginPullRequest.puller,
              requestID,
              dagForOtherClient,
              pullLC,
              false,
            );
            return {
              result: beginPullResponse,
              httpRequestInfo: beginPullResponse.httpRequestInfo,
            };
          },
          pullDescription,
          this.pullURL,
        );
        pullResponse = beginPullResponse.pullResponse;
        return (
          !!pullResponse &&
          beginPullResponse.httpRequestInfo.httpStatusCode === 200
        );
      }, pullDescription);
      if (!pullSucceeded) {
        this._lc.debug?.(
          `Failed to recover mutations for client ${clientID} due to a pull error.`,
        );
        return;
      }

      this._lc.debug?.(
        `Client ${selfClientID} recovered mutations for client ` +
          `${clientID}.  Details`,
        {
          mutationID: client.mutationID,
          lastServerAckdMutationID: client.lastServerAckdMutationID,
          lastMutationID: pullResponse?.lastMutationID,
        },
      );
      const newClientMap = await persist.updateClients(
        (clients: persist.ClientMap) => {
          assertNotUndefined(pullResponse);
          const clientToUpdate = clients.get(clientID);
          if (
            !clientToUpdate ||
            clientToUpdate.lastServerAckdMutationID >=
              pullResponse.lastMutationID
          ) {
            return persist.noClientUpdates;
          }
          return {
            clients: new Map(clients).set(clientID, {
              ...clientToUpdate,
              lastServerAckdMutationID: pullResponse.lastMutationID,
            }),
          };
        },
        perdag,
      );
      return newClientMap;
    } catch (e) {
      this._logMutationRecoveryError(e, stepDescription);
      return;
    } finally {
      await dagForOtherClientToClose?.close();
      this._lc.debug?.('End:', stepDescription);
    }
  }
  private _logMutationRecoveryError(e: unknown, stepDescription: string) {
    if (this.closed) {
      this._lc.debug?.(
        `Mutation recovery error likely due to close during:\n${stepDescription}\nError:\n`,
        e,
      );
    } else {
      this._lc.error?.(
        `Mutation recovery error during:\n${stepDescription}\nError:\n`,
        e,
      );
    }
  }
}

// This map is used to keep track of closing instances of Replicache. When an
// instance is opening we wait for any currently closing instances.
const closingInstances: Map<string, Promise<unknown>> = new Map();

/**
 * Returns the document object. This is wrapped in a function because Replicache
 * runs in environments that do not have a document (such as Web Workers, Deno
 * etc)
 */
function getDocument(): Document | undefined {
  return typeof document !== 'undefined' ? document : undefined;
}

function reload(): void {
  if (typeof location !== 'undefined') {
    location.reload();
  }
}
