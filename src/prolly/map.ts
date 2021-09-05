import * as dag from '../dag/mod';
import {assertJSONValue, deepEqual, deepFreeze, ImmutableJSONValue, JSONValue} from '../json';
import {stringCompare} from './string-compare';
import { assertArray, assertString } from '../asserts';

export type Entry = Readonly<[key: string, value: ImmutableJSONValue]>;

export const deleteSentinel = Symbol();
export type DeleteSentinel = typeof deleteSentinel;

class ProllyMap {
  private _entries: Entry[];
  private _changedKeys: Set<string> = new Set();

  constructor(items: Record<string, JSONValue> = {}) {
    this._entries = Object.entries(items)
        .map(e => deepFreeze(e) as Entry)
        .sort((a, b) =>
            stringCompare(a[0], b[0]),
    );
  }

  static async load(hash: string, read: dag.Read): Promise<ProllyMap> {
    const chunk = await read.getChunk(hash);
    if (chunk === undefined) {
      throw new Error(`Chunk not found: ${hash}`);
    }

    // Validate at load-time so we can assume data is valid thereafter.
    const entries = chunk.data;
    // Assert that the shape/type is correct
    assertEntries(entries);
    // But also assert that entries is sorted and has no duplicate keys.
    const seen = new Set();
    for (let i = 0; i < entries.length - 1; i++) {
      const entry = entries[i];
      const next = entries[i + 1];
      if (entry[0] === next[0] || seen.has(entry[0])) {
        throw new Error('duplicate key');
      }
      if (entry[0] > next[0]) {
        throw new Error('unsorted key');
      }
      seen.add(entry[0]);
    }

    const map = new ProllyMap();
    map._entries = entries;
    return map;
  }

  private _binarySearch(key: string): {found: boolean; index: number} {
    const entries = this._entries;
    let size = entries.length;
    if (size === 0) {
      return {found: false, index: 0};
    }
    let base = 0;

    while (size > 1) {
      const half = Math.floor(size / 2);
      const mid = base + half;
      // mid is always in [0, size), that means mid is >= 0 and < size.
      // mid >= 0: by definition
      // mid < size: mid = size / 2 + size / 4 + size / 8 ...
      const entry = entries[mid];
      // No way that key can be None.
      const cmp = stringCompare(entry[0], key);
      base = cmp > 0 ? base : mid;
      size -= half;
    }
    // base is always in [0, size) because base <= mid.
    const entry = entries[base];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const cmp = stringCompare(entry[0], key);
    if (cmp === 0) {
      return {found: true, index: base};
    }
    return {found: false, index: base + cmp};
  }

  has(key: string): boolean {
    const {found} = this._binarySearch(key);
    return found;
  }

  get(key: string): ImmutableJSONValue | undefined {
    const {found, index} = this._binarySearch(key);
    if (!found) {
      return undefined;
    }
    const [, value] = this._entries[index];
    return value;
  }

  put(key: string, val: JSONValue): void {
    const frozen = deepFreeze(val);
    const {found, index} = this._binarySearch(key);
    if (found) {
      this._entries[index] = [key, frozen];
    } else {
      this._entries.splice(index, 0, [key, frozen]);
    }
    this._changedKeys.add(key);
  }

  del(key: string): void {
    const {found, index} = this._binarySearch(key);
    if (found) {
      this._entries.splice(index, 1);
    }
    this._changedKeys.add(key);
  }

  entries(): IterableIterator<Entry> {
    return this._entries[Symbol.iterator]();
  }

  [Symbol.iterator](): IterableIterator<Entry> {
    return this.entries();
  }

  async flush(write: dag.Write): Promise<string> {
    // TODO: how come ts doesn't complain about passing the mutable array?
    const chunk = dag.Chunk.new(this._entries, []);
    await write.putChunk(chunk);
    this._entries = [...this._entries];
    return chunk.hash;
  }

  static changedKeys(am: ProllyMap, bm: ProllyMap): string[] {
    const itA = am.entries();
    const itB = bm.entries();
    const keys: string[] = [];

    let a = itA.next();
    let b = itB.next();
    for (;;) {
      if (a.done && b.done) {
        break;
      }

      if (a.done && !b.done) {
        keys.push(b.value[0]);
        b = itB.next();
      } else if (!a.done && b.done) {
        keys.push(a.value[0]);
        a = itA.next();
      } else if (!a.done && !b.done) {
        const ord = stringCompare(a.value[0], b.value[0]);
        switch (ord) {
          case -1:
            keys.push(a.value[0]);
            a = itA.next();
            break;
          case 0:
            if (!deepEqual(a.value[1], b.value[1])) {
              keys.push(a.value[0]);
            }
            a = itA.next();
            b = itB.next();
            break;
          case +1:
            keys.push(b.value[0]);
            b = itB.next();
            break;
        }
      }
    }
    return keys;
  }

  pendingChangedKeys(): string[] {
    return [...this._changedKeys];
  }
}

type DeletableEntry = [key: string, val: JSONValue | DeleteSentinel];

export {ProllyMap as Map};

function assertEntry(v: unknown): asserts v is Entry {
  assertArray(v);
  if (v.length !== 2) {
    throw new Error('Invalid entry length');
  }
  assertString(v[0]);
  assertJSONValue(v[1]);
}

function assertEntries(v: unknown): asserts v is Entry[] {
  assertArray(v);
  for (const e of v) {
    assertEntry(e);
  }
}
