import {parse as parseHash} from '../hash';
import {Store} from './store';
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
import {stringCompare} from '../string-compare';

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

  chunks(): Chunk[] {
    const rv: Chunk[] = [];
    for (const [key, value] of this.kvStore.entries()) {
      const pk = parseKey(key);
      if (pk.type === KeyType.ChunkData) {
        const refsValue = this.kvStore.map().get(chunkMetaKey(pk.hash));
        rv.push(createChunkWithHash(pk.hash, value, toRefs(refsValue)));
      }
    }
    return sortByHash(rv);
  }

  clear(): void {
    this.kvStore.clear();
  }
}

export function sortByHash(arr: Iterable<Chunk>): Chunk[] {
  return [...arr].sort((a, b) => stringCompare(String(a.hash), String(b.hash)));
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
