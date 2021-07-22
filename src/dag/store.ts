import type {Store as KVStore} from '../kv/store.js';
import {Read} from './read.js';
import {Write} from './write.js';

export class Store {
  private readonly _kv: KVStore;

  constructor(kv: KVStore) {
    this._kv = kv;
  }

  async read(): Promise<Read> {
    return new Read(await this._kv.read());
  }

  async write(): Promise<Write> {
    return new Write(await this._kv.write());
  }

  async close(): Promise<void> {
    await this._kv.close();
  }
}
