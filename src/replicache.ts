import type {ReadonlyJSONValue} from './json';
import type {MaybePromise} from './maybe-promise';
import type {Puller} from './puller';
import type {Pusher} from './pusher';
import {ReplicacheInternal} from './replicache-internal';
import type {ReplicacheOptions} from './replicache-options';
import type {
  ClientStateNotFoundReason,
  MakeMutators,
  MutatorDefs,
  Poke,
  RequestOptions,
} from './replicache-types';
import type {CreateIndexDefinition, ReadTransaction} from './transactions';

// eslint-disable-next-line @typescript-eslint/ban-types
export class Replicache<MD extends MutatorDefs = {}> {
  protected _internal: ReplicacheInternal<MD>;

  constructor(options: ReplicacheOptions<MD>) {
    this._internal = new ReplicacheInternal(options);
  }

  /** The URL to use when doing a pull request. */
  get pullURL(): string {
    return this._internal.pullURL;
  }
  set pullURL(pullURL: string) {
    this._internal.pullURL = pullURL;
  }

  /** The URL to use when doing a push request. */
  get pushURL(): string {
    return this._internal.pushURL;
  }
  set pushURL(pushURL: string) {
    this._internal.pushURL = pushURL;
  }

  /** The authorization token used when doing a push request. */
  get auth(): string {
    return this._internal.auth;
  }
  set auth(auth: string) {
    this._internal.auth = auth;
  }

  /** The name of the Replicache database. */
  get name(): string {
    return this._internal.name;
  }

  /**
   * This is the name Replicache uses for the IndexedDB database where data is
   * stored.
   */
  get idbName(): string {
    return this._internal.idbName;
  }

  /** The schema version of the data understood by this application. */
  get schemaVersion(): string {
    return this._internal.schemaVersion;
  }

  /**
   * The mutators that was registered in the constructor.
   */
  get mutate(): MakeMutators<MD> {
    return this._internal.mutate;
  }

  /**
   * The duration between each periodic [[pull]]. Setting this to `null`
   * disables periodic pull completely. Pull will still happen if you call
   * [[pull]] manually.
   */
  get pullInterval(): number | null {
    return this._internal.pullInterval;
  }
  set pullInterval(pullInterval: number | null) {
    this._internal.pullInterval = pullInterval;
  }

  /**
   * The delay between when a change is made to Replicache and when Replicache
   * attempts to push that change.
   */
  get pushDelay(): number {
    return this._internal.pushDelay;
  }
  set pushDelay(pushDelay: number) {
    this._internal.pushDelay = pushDelay;
  }

  /**
   * The function to use to pull data from the server.
   */
  get puller(): Puller {
    return this._internal.puller;
  }
  set puller(puller: Puller) {
    this._internal.puller = puller;
  }

  /**
   * The function to use to push data to the server.
   */
  get pusher(): Pusher {
    return this._internal.pusher;
  }
  set pusher(pusher: Pusher) {
    this._internal.pusher = pusher;
  }

  /**
   * The options used to control the [[pull]] and push request behavior. This
   * object is live so changes to it will affect the next pull or push call.
   */
  get requestOptions(): Required<RequestOptions> {
    return this._internal.requestOptions;
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
  get onSync(): ((syncing: boolean) => void) | null {
    return this._internal.onSync;
  }
  set onSync(onSync: ((syncing: boolean) => void) | null) {
    this._internal.onSync = onSync;
  }

  /**
   * `onClientStateNotFound` is called when the persistent client has been
   * garbage collected. This can happen if the client has not been used for over
   * a week.
   *
   * It can also happen if the server no longer knows about this client.
   *
   * The default behavior is to reload the page (using `location.reload()`). Set
   * this to `null` or provide your own function to prevent the page from
   * reloading automatically.
   */
  get onClientStateNotFound():
    | ((reason: ClientStateNotFoundReason) => void)
    | null {
    return this._internal.onClientStateNotFound;
  }
  set onClientStateNotFound(
    onClientStateNotFound: ((reason: ClientStateNotFoundReason) => void) | null,
  ) {
    this._internal.onClientStateNotFound = onClientStateNotFound;
  }

  /**
   * This gets called when we get an HTTP unauthorized (401) response from the
   * push or pull endpoint. Set this to a function that will ask your user to
   * reauthenticate.
   */
  get getAuth():
    | (() => MaybePromise<string | null | undefined>)
    | null
    | undefined {
    return this._internal.getAuth;
  }
  set getAuth(
    getAuth: (() => MaybePromise<string | null | undefined>) | null | undefined,
  ) {
    this._internal.getAuth = getAuth;
  }

  /**
   * The browser profile ID for this browser profile. Every instance of Replicache
   * browser-profile-wide shares the same profile ID.
   */
  get profileID(): Promise<string> {
    return this._internal.profileID;
  }

  /**
   * The client ID for this instance of Replicache. Each instance of Replicache
   * gets a unique client ID.
   */
  get clientID(): Promise<string> {
    return this._internal.clientID;
  }

  /**
   * `onOnlineChange` is called when the [[online]] property changes. See
   * [[online]] for more details.
   */
  get onOnlineChange(): ((online: boolean) => void) | null {
    return this._internal.onOnlineChange;
  }
  set onOnlineChange(handler: ((online: boolean) => void) | null) {
    this._internal.onOnlineChange = handler;
  }

  /**
   * A rough heuristic for whether the client is currently online. Note that
   * there is no way to know for certain whether a client is online - the next
   * request can always fail. This property returns true if the last sync attempt succeeded,
   * and false otherwise.
   */
  get online(): boolean {
    return this._internal.online;
  }

  /**
   * Whether the Replicache database has been closed. Once Replicache has been
   * closed it no longer syncs and you can no longer read or write data out of
   * it. After it has been closed it is pretty much useless and should not be
   * used any more.
   */
  get closed(): boolean {
    return this._internal.closed;
  }

  /**
   * Closes this Replicache instance.
   *
   * When closed all subscriptions end and no more read or writes are allowed.
   */
  async close(): Promise<void> {
    return this._internal.close();
  }

  /**
   * Creates a persistent secondary index in Replicache which can be used with scan.
   *
   * If the named index already exists with the same definition this returns success
   * immediately. If the named index already exists, but with a different definition
   * an error is thrown.
   */
  async createIndex(def: CreateIndexDefinition): Promise<void> {
    return this._internal.createIndex(def);
  }

  /**
   * Drops an index previously created with [[createIndex]].
   */
  async dropIndex(name: string): Promise<void> {
    return this._internal.dropIndex(name);
  }

  /**
   * Pull pulls changes from the [[pullURL]]. If there are any changes
   * local changes will get replayed on top of the new server state.
   */
  pull(): void {
    this._internal.pull();
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
    return this._internal.poke(poke);
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
    return this._internal.subscribe(body, {onData, onError, onDone});
  }

  /**
   * Query is used for read transactions. It is recommended to use transactions
   * to ensure you get a consistent view across multiple calls to `get`, `has`
   * and `scan`.
   */
  async query<R>(body: (tx: ReadTransaction) => Promise<R> | R): Promise<R> {
    return this._internal.query(body);
  }
}
