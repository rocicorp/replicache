import type {LogLevel, LogSink} from '@rocicorp/logger';
import type {Pusher} from './pusher';
import type {Puller} from './puller';
import type {MutatorDefs, RequestOptions} from './replicache';
import type * as kv from './kv/mod';

/**
 * The options passed to [[Replicache]].
 */

export interface ReplicacheOptions<MD extends MutatorDefs> {
  /**
   * This is the URL to the server endpoint dealing with the push updates. See
   * [Push Endpoint Reference](https://doc.replicache.dev/server-push) for more
   * details.
   *
   * If not provided, push requests will not be made unless a custom
   * [[ReplicacheOptions.pusher]] is provided.
   */
  pushURL?: string;

  /**
   * This is the authorization token used when doing a
   * [pull](https://doc.replicache.dev/server-pull#authorization) and
   * [push](https://doc.replicache.dev/server-push#authorization).
   */
  auth?: string;

  /**
   * This is the URL to the server endpoint dealing with pull. See [Pull
   * Endpoint Reference](https://doc.replicache.dev/server-pull) for more
   * details.
   *
   * If not provided, pull requests will not be made unless a custom
   * [[ReplicacheOptions.puller]] is provided.
   */
  pullURL?: string;

  /**
   * The name of the Replicache database.
   *
   * It is important to use user specific names so that if there are multiple
   * tabs open for different distinct users their data is kept separate.
   *
   * For efficiency and performance, a new [[Replicache]] instance will
   * initialize its state from the persisted state of an existing [[Replicache]]
   * instance with the same `name`, domain and browser profile.
   *
   * Mutations from one [[Replicache]] instance may be pushed using the
   * [[ReplicacheOptions.auth]], [[ReplicacheOptions.pushURL]],
   * [[ReplicacheOptions.pullURL]], [[ReplicacheOptions.pusher]], and
   * [[ReplicacheOptions.puller]]  of another Replicache instance with the same
   * `name`, domain and browser profile.
   *
   * You can use multiple Replicache instances for the same user as long as the
   * names are unique.  e.g. `name: `$userID:$roomID`
   */
  name: string;

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
   * Determines how much logging to do. When this is set to `'debug'`,
   * Replicache will also log `'info'` and `'error'` messages. When set to
   * `'info'` we log `'info'` and `'error'` but not `'debug'`. When set to
   * `'error'` we only log `'error'` messages.
   * Default is `'info'`.
   */
  logLevel?: LogLevel;

  /**
   * Enables custom handling of logs. By default logs are logged to the console.
   * If you would like logs to be sent somewhere else (e.g. to a cloud logging
   * service like DataDog) you can provide a custom `LogSink`.  Logs above
   * [[logLevel]] are sent to this `LogSink`.
   */
  logSink?: LogSink;

  /**
   * An object used as a map to define the *mutators*. These gets registered at
   * startup of [[Replicache]].
   *
   * *Mutators* are used to make changes to the data.
   *
   * #### Example
   *
   * The registered *mutations* are reflected on the
   * [[Replicache.mutate|mutate]] property of the [[Replicache]] instance.
   *
   * ```ts
   * const rep = new Replicache({
   *   name: 'user-id',
   *   mutators: {
   *     async createTodo(tx: WriteTransaction, args: JSONValue) {
   *       const key = `/todo/${args.id}`;
   *       if (await tx.has(key)) {
   *         throw new Error('Todo already exists');
   *       }
   *       await tx.put(key, args);
   *     },
   *     async deleteTodo(tx: WriteTransaction, id: number) {
   *       ...
   *     },
   *   },
   * });
   * ```
   *
   * This will create the function to later use:
   *
   * ```ts
   * await rep.mutate.createTodo({
   *   id: 1234,
   *   title: 'Make things work offline',
   *   complete: true,
   * });
   * ```
   *
   * #### Replays
   *
   * *Mutators* run once when they are initially invoked, but they might also be
   * *replayed* multiple times during sync. As such *mutators* should not modify
   * application state directly. Also, it is important that the set of
   * registered mutator names only grows over time. If Replicache syncs and
   * needed *mutator* is not registered, it will substitute a no-op mutator, but
   * this might be a poor user experience.
   *
   * #### Server application
   *
   * During push, a description of each mutation is sent to the server's [push
   * endpoint](https://doc.replicache.dev/server-push) where it is applied. Once
   * the *mutation* has been applied successfully, as indicated by the client
   * view's
   * [`lastMutationId`](https://doc.replicache.dev/server-pull#lastmutationid)
   * field, the local version of the *mutation* is removed. See the [design
   * doc](https://doc.replicache.dev/design#commits) for additional details on
   * the sync protocol.
   *
   * #### Transactionality
   *
   * *Mutators* are atomic: all their changes are applied together, or none are.
   * Throwing an exception aborts the transaction. Otherwise, it is committed.
   * As with [[query]] and [[subscribe]] all reads will see a consistent view of
   * the cache while they run.
   */
  mutators?: MD;

  /**
   * Options to use when doing pull and push requests.
   */
  requestOptions?: RequestOptions;

  /**
   * Allows passing in a custom implementation of a [[Puller]] function. This
   * function is called when doing a pull and it is responsible for
   * communicating with the server.
   *
   * Normally, this is just a POST to a URL with a JSON body but you can provide
   * your own function if you need to do things differently.
   */
  puller?: Puller;

  /**
   * Allows passing in a custom implementation of a [[Pusher]] function. This
   * function is called when doing a push and it is responsible for
   * communicating with the server.
   *
   * Normally, this is just a POST to a URL with a JSON body but you can provide
   * your own function if you need to do things differently.
   */
  pusher?: Pusher;

  /**
   * The license key for Replicache. This parameter is required for Replicache to
   * function. See https://replicache.dev for how to acquire a license key.
   *
   * YOU SHOULD PASS TEST_LICENSE_KEY IN AUTOMATED TESTS. It disables license
   * checks for several minutes. If you pass a normal license key in tests, each test
   * that instantiates Replicache will attempt to perform a license check against
   * Replicache's licensing server, potentially increasing your monthly active browser
   * profile count, slowing the test down, and spamming Replicache's servers.
   */
  licenseKey: string;

  /**
   * Allows implementing the underlying storage layer completely in JavaScript.
   *
   * @experimental This option is experimental and might be removed or changed
   * in the future without following semver versioning. Please be cautious.
   */
  experimentalKVStore?: kv.Store;
}
