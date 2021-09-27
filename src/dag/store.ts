import type * as kv from '../kv/mod';
import {Read} from './read';
import {Write} from './write';

export class Store {
  private readonly _kv: kv.Store;

  constructor(kv: kv.Store) {
    this._kv = kv;
  }

  async read(): Promise<Read> {
    return new Read(await this._kv.read());
  }

  async withRead<R>(fn: (read: Read) => R | Promise<R>): Promise<R> {
    return this._kv.withRead(kvr => fn(new Read(kvr)));
  }

  async write(): Promise<Write> {
    return new Write(await this._kv.write());
  }

  async withWrite<R>(fn: (Write: Write) => R | Promise<R>): Promise<R> {
    return this._kv.withWrite(kvw => fn(new Write(kvw)));
  }

  async close(): Promise<void> {
    await this._kv.close();
  }
}
