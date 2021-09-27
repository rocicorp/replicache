import type {Pusher} from './pusher';
import type {Puller} from './puller';
import type {LogLevel} from './logger';
import type {MutatorDefs, RequestOptions} from './replicache';
import type * as kv from './kv/mod';

/**
 * The options passed to [[Replicache]].
 */

export interface ReplicacheOptions<MD extends MutatorDefs> {
  /**
   * This is the
   * [authorization](https://doc.replicache.dev/server-push#authorization) token
   * used when doing a [push](https://doc.replicache.dev/server-push).
   * @deprecated Use [[auth]] instead.
   */
  pushAuth?: string;

  /**
   * This is the URL to the server endpoint dealing with the push updates. See
   * [Push Endpoint Reference](https://doc.replicache.dev/server-push) for more
   * details.
   */
  pushURL?: string;

  /**
   * This is the
   * [authorization](https://doc.replicache.dev/server-pull#authorization) token
   * used when doing a [pull](https://doc.replicache.dev/server-pull).
   * @deprecated Use [[auth]] instead.
   */
  pullAuth?: string;

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
   * Allows using an in memory store instead of IndexedDB. This is useful for
   * testing for example. Notice that when this is `true` no data is persisted
   * in Replicache and all the data that has not yet been synced when Replicache
   * is [[closed]] or the page is unloaded is lost.
   */
  useMemstore?: boolean;

  /**
   * Determines how much logging to do. When this is set to `'debug'`,
   * Replicache will also log `'info'` and `'error'` messages. When set to
   * `'info'` we log `'info'` and `'error'` but not `'debug'`. When set to
   * `'error'` we only log `'error'` messages.
   */
  logLevel?: LogLevel;

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
   * Allows implementing the underlying storage layer completely in JavaScript.
   *
   * @experimental This option is experimental and might be removed or changed
   * in the future without following semver versioning. Please be cautious.
   */
  experimentalKVStore?: kv.Store;
}
