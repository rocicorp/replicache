import type * as kv from '../kv/mod';
import type {ChunkHasher} from './chunk';
import {Read} from './read';
import {Write} from './write';

export class Store {
  private readonly _kv: kv.Store;

  readonly chunkHasher: ChunkHasher;

  constructor(kv: kv.Store, chunkHasher: ChunkHasher) {
    this._kv = kv;
    this.chunkHasher = chunkHasher;
  }

  async read(): Promise<Read> {
    return new Read(await this._kv.read(), this.chunkHasher);
  }

  async withRead<R>(fn: (read: Read) => R | Promise<R>): Promise<R> {
    return this._kv.withRead(kvr => fn(new Read(kvr, this.chunkHasher)));
  }

  async write(): Promise<Write> {
    return new Write(await this._kv.write(), this.chunkHasher);
  }

  async withWrite<R>(fn: (Write: Write) => R | Promise<R>): Promise<R> {
    return this._kv.withWrite(kvw => fn(new Write(kvw, this.chunkHasher)));
  }

  async close(): Promise<void> {
    await this._kv.close();
  }
}
