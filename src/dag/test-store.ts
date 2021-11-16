import {Store} from './store';
import * as kv from '../kv/mod';
import {ChunkHasher, defaultChunkHasher} from './chunk';

export class TestStore extends Store {
  constructor(
    kvStore: kv.Store = new kv.MemStore(),
    chunkkHasher: ChunkHasher = defaultChunkHasher,
  ) {
    super(kvStore, chunkkHasher);
  }
}
