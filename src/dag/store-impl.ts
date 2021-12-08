import type {Hash} from '../hash';
import type * as kv from '../kv/mod';
import type {ChunkHasher} from './chunk';
import {ReadImpl} from './read-impl';
import type {Read, Write} from './store';
import {WriteImpl} from './write-impl';

export class StoreImpl {
  private readonly _kv: kv.Store;
  private readonly _chunkHasher: ChunkHasher;
  private readonly _assertValidHash: (hash: Hash) => void;

  constructor(
    kv: kv.Store,
    chunkHasher: ChunkHasher,
    assertValidHash: (hash: Hash) => void,
  ) {
    this._kv = kv;
    this._chunkHasher = chunkHasher;
    this._assertValidHash = assertValidHash;
  }

  async read(): Promise<Read> {
    return new ReadImpl(await this._kv.read(), this._assertValidHash);
  }

  async withRead<R>(fn: (read: Read) => R | Promise<R>): Promise<R> {
    return this._kv.withRead(kvr =>
      fn(new ReadImpl(kvr, this._assertValidHash)),
    );
  }

  async write(): Promise<Write> {
    return new WriteImpl(
      await this._kv.write(),
      this._chunkHasher,
      this._assertValidHash,
    );
  }

  async withWrite<R>(fn: (write: WriteImpl) => R | Promise<R>): Promise<R> {
    return this._kv.withWrite(kvw =>
      fn(new WriteImpl(kvw, this._chunkHasher, this._assertValidHash)),
    );
  }

  async close(): Promise<void> {
    await this._kv.close();
  }
}
