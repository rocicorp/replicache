import type {JsonType} from './json.js';
import type {ScanItem} from './scan-item.js';
import type {ScanOptions} from './scan-options.js';
import type {DatabaseInfo} from './database-info.js';
import type {FullInvoke as RepmInvoke, Invoke} from './repm-invoker.js';
import {ReadTransaction, ReadTransactionImpl} from './transactions.js';

export default class Replicache implements ReadTransaction {
  private _closed = false;
  protected _opened: Promise<unknown> | null = null;
  private readonly _name: string;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  private readonly _diffServerUrl: string;
  private _root: Promise<string | null> = Promise.resolve(null);
  private readonly _repmInvoke: RepmInvoke;

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

  async _getRoot(): Promise<string | null> {
    if (this._closed) {
      return null;
    }
    const res = await this._invoke('getRoot');
    return res.root;
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
