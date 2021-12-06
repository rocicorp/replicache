import type {Chunk} from './chunk';
import type { ReadonlyJSONValue } from '../mod';
import type { Hash } from '../hash';

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
  commit(): Promise<void>;
}



// Cache is another DagStore using kv.memstore
  // Refcounting
    // May get refcounting behavior we want automatically
  // Cache
    // Reads end up acquiring short write locks on the cacheStore to update cache, hurting paralization
    // Need to track sizes and access order in another data structure, probably a Set
    // How do we purge an an entry from the cache?
      // Need to introduce some way of 
  // We get transactions from kv.Memstore
  // get a natural place to store/remove heads

// Cache is a Map
  // Refcounting
    // need to implement
  // Cache
    // Map hash => chunk  
  // Locking and transaction?
    // Have to have behavior where writes are accumulated in a seperate map and only applied on commit



// For both
  // Put chunks have to be cached til they are persisted, is knowing about temp hashes cleaner here?
  // Need to think about lock ordering, want to avoid deadlocks 

