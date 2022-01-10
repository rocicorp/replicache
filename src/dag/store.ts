import type {Chunk} from './chunk';
import type {ReadonlyJSONValue} from '../mod';
import type {Hash} from '../hash';

export interface Store {
  read(): Promise<Read>;
  withRead<R>(fn: (read: Read) => R | Promise<R>): Promise<R>;
  write(): Promise<Write>;
  withWrite<R>(fn: (Write: Write) => R | Promise<R>): Promise<R>;
  close(): Promise<void>;
}

export interface Read {
  hasChunk(hash: Hash): Promise<boolean>;
  getChunk(hash: Hash): Promise<Chunk | undefined>;
  getHead(name: string): Promise<Hash | undefined>;
  close(): void;
  get closed(): boolean;
}

export interface Write extends Read {
  createChunk<V extends ReadonlyJSONValue>(
    data: V,
    refs: readonly Hash[],
  ): Chunk<V>;
  putChunk(c: Chunk): Promise<void>;
  setHead(name: string, hash: Hash): Promise<void>;
  removeHead(name: string): Promise<void>;
  assertValidHash(hash: Hash): void;
  commit(): Promise<void>;
}
