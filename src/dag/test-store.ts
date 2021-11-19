import {parse as parseHash} from '../hash';
import {Store} from './store';
import {Chunk, ChunkHasher, defaultChunkHasher, readChunk} from './chunk';
import {assertNotTempHash, Hash} from '../hash';
import {chunkMetaKey, parse as parseKey} from './key';
import {KeyType} from './key';
import {TestMemStore} from '../kv/test-mem-store';
import {assertArray, assertString} from '../asserts';

export class TestStore extends Store {
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
        yield readChunk(pk.hash, value, toRefs(refsValue));
      }
    }
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
