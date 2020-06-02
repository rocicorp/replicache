import type {JsonType} from './json.js';
import type {ScanItem} from './scan-item.js';
import type {ScanOptions} from './scan-options.js';
import type {DatabaseInfo} from './database-info.js';
import type {
  FullInvoke as RepmInvoke,
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

export default class Replicache implements ReadTransaction {
  private _closed = false;
  protected _opened: Promise<unknown> | null = null;
  private readonly _name: string;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  private readonly _diffServerUrl: string;
  private _root: Promise<string | undefined> = Promise.resolve(undefined);
  private readonly _repmInvoke: RepmInvoke;
  private readonly _mutatorRegistry = new Map<
    string,
    MutatorImpl<JsonType, JsonType>
  >();

  constructor({
    diffServerUrl,
    name = '',
    repmInvoke,
  }: {
    diffServerUrl: string;
    name?: string;
    repmInvoke: RepmInvoke;
  }) {
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
    // if (_syncInterval != null) {
    //   await sync();
    // }
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

  get closed(): boolean {
    return this._closed;
  }

  async close(): Promise<void> {
    this._closed = true;
    const p = this._invoke('close');

    // Clear timer

    // Clear subscriptions

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
      // await this._fireOnChange();
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
  get(key: string): Promise<JsonType> {
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
  ): Promise<{result: R; ref?: string}> {
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
    diffServerUrl,
    name = '',
    repmInvoke,
  }: {
    diffServerUrl: string;
    name?: string;
    repmInvoke: RepmInvoke;
  }): Promise<ReplicacheTest> {
    const rep = new ReplicacheTest({diffServerUrl, name, repmInvoke});
    await rep._opened;
    // await this._root;
    return rep;
  }
}
