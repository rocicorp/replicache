import type {JsonType} from './json.js';
import type {DatabaseInfo} from './database-info.js';
import type {
  InvokeMapNoArgs,
  InvokeMap,
  FullInvoke as RepmInvoke,
} from './repm-invoker.js';

export default class Replicache {
  private _closed = false;
  protected _opened: Promise<unknown> | null = null;
  private readonly _name: string;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  private readonly _diffServerUrl: string;
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

    // console.log(this._diffServerUrl);
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
    // _root = _getRoot();
    // await _root;
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

  private _invoke<Rpc extends keyof InvokeMapNoArgs>(
    rpc: Rpc,
  ): Promise<InvokeMapNoArgs[Rpc]>;
  private _invoke<Rpc extends keyof InvokeMap>(
    rpc: Rpc,
    args: InvokeMap[Rpc][0],
  ): Promise<InvokeMap[Rpc][1]>;
  private async _invoke(rpc: string, args?: JsonType): Promise<JsonType> {
    await this._opened;
    return await this._repmInvoke(this._name, rpc, args);
  }
}

/*
  invoke<Rpc extends keyof InvokeMapNoArgs>(
    dbName: string,
    rpc: Rpc,
  ): Promise<InvokeMapNoArgs[Rpc]>;
  invoke<Rpc extends keyof InvokeMap>(
    dbName: string,
    rpc: Rpc,
    args: InvokeMap[Rpc][0],
  ): Promise<InvokeMap[Rpc][1]>;
  invoke(dbName: string, rpc: string, args?: JsonType): Promise<JsonType>;
  */

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
