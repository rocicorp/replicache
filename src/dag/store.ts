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

interface GetChunk {
  getChunk(hash: Hash): Promise<Chunk | undefined>;
}

export interface Read extends GetChunk {
  hasChunk(hash: Hash): Promise<boolean>;
  mustGetChunk(hash: Hash): Promise<Chunk>;
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

export class MissingChunkError extends Error {
  name = 'MissingChunkError';
  readonly hash: Hash;
  constructor(hash: Hash) {
    super(`Missing chunk ${hash}`);
    this.hash = hash;
  }
}

export async function mustGetChunk(
  store: GetChunk,
  hash: Hash,
): Promise<Chunk> {
  const chunk = await store.getChunk(hash);
  if (chunk) {
    return chunk;
  }
  throw new MissingChunkError(hash);
}
