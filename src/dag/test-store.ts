import {parse as parseHash} from '../hash';
import {StoreImpl} from './store-impl';
import {
  Chunk,
  ChunkHasher,
  defaultChunkHasher,
  createChunkWithHash,
} from './chunk';
import {assertNotTempHash, Hash} from '../hash';
import {chunkMetaKey, parse as parseKey} from './key';
import {KeyType} from './key';
import {TestMemStore} from '../kv/test-mem-store';
import {assertArray, assertString} from '../asserts';

export class TestStore extends StoreImpl {
  readonly kvStore: TestMemStore;

  constructor(
    kvStore = new TestMemStore(),
    chunkHasher: ChunkHasher = defaultChunkHasher,
    assertValidHash = assertNotTempHash,
  ) {
    super(kvStore, chunkHasher, assertValidHash);
    this.kvStore = kvStore;
  }

  *chunks(): Generator<Chunk, void, unknown> {
    for (const [key, value] of this.kvStore.entries()) {
      const pk = parseKey(key);
      if (pk.type === KeyType.ChunkData) {
        const refsValue = this.kvStore.map().get(chunkMetaKey(pk.hash));
        yield createChunkWithHash(pk.hash, value, toRefs(refsValue));
      }
    }
  }

  clear(): void {
    this.kvStore.clear();
  }
}

function toRefs(refs: unknown): Hash[] {
  if (refs === undefined) {
    return [];
  }
  assertArray(refs);
  return refs.map(h => {
    assertString(h);
    return parseHash(h);
  });
}
