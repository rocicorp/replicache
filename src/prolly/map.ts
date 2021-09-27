import {assertArray, assertNotNull, assertString} from '../asserts';
import * as dag from '../dag/mod';
import {assertJSONValue, deepEqual, ReadonlyJSONValue} from '../json';
import {stringCompare} from './string-compare';
import * as flatbuffers from 'flatbuffers';
import {Leaf as LeafFB} from './generated/leaf/leaf';
import * as utf8 from '../utf8';
import {LeafEntry as LeafEntryFB} from './generated/leaf/leaf-entry';

export type Entry = readonly [key: string, value: ReadonlyJSONValue];

class ProllyMap {
  // _entries is using a copy on write strategy.
  private _entries: ReadonlyArray<Entry> | Entry[];
  private _isReadonly = true;

  private _pendingChangedKeys: Set<string> = new Set();

  constructor(entries: ReadonlyArray<Entry>) {
    this._entries = entries;
  }

  // entries are only ever used through these two getters. This is to ensure we
  // do a copy on write so that we never mutate the entries that was passed in
  // or handed out as mutable.
  private get _readonlyEntries(): ReadonlyArray<Entry> {
    return this._entries;
  }

  private get _mutableEntries(): Entry[] {
    if (this._isReadonly) {
      this._isReadonly = false;
      this._entries = [...this._entries];
    }
    return this._entries as Entry[];
  }

  static async load(hash: string, read: dag.Read): Promise<ProllyMap> {
    const chunk = await read.getChunk(hash);
    if (chunk === undefined) {
      throw new Error(`Chunk not found: ${hash}`);
    }

    return fromChunk(chunk);
  }

  has(key: string): boolean {
    return binarySearch(key, this._readonlyEntries) >= 0;
  }

  get(key: string): ReadonlyJSONValue | undefined {
    const index = binarySearch(key, this._readonlyEntries);
    if (index < 0) {
      return undefined;
    }
    return this._readonlyEntries[index][1];
  }

  isEmpty(): boolean {
    return this._readonlyEntries.length === 0;
  }

  put(key: string, val: ReadonlyJSONValue): void {
    const entries = this._mutableEntries;
    const index = binarySearch(key, entries);
    if (index >= 0) {
      entries[index] = [key, val];
    } else {
      entries.splice(-index - 1, 0, [key, val]);
    }
    this._pendingChangedKeys.add(key);
  }

  /**
   * Removes a `key` and its value from the map. Returns `true` if there was a
   * `key` to remove.
   */
  del(key: string): boolean {
    const index = binarySearch(key, this._readonlyEntries);
    if (index >= 0) {
      this._mutableEntries.splice(index, 1);
      this._pendingChangedKeys.add(key);
      return true;
    }
    return false;
  }

  entries(): IterableIterator<Entry> {
    return this._entries.values();
  }

  [Symbol.iterator](): IterableIterator<Entry> {
    return this.entries();
  }

  async flush(write: dag.Write): Promise<string> {
    const entries = this._entries;
    // Now it is no longer safe to mutate the entries.
    this._isReadonly = true;
    const chunk = dag.Chunk.new(entries, []);
    this._pendingChangedKeys.clear();
    await write.putChunk(chunk);
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
    const keys = [...this._pendingChangedKeys];
    return keys.sort((a, b) => stringCompare(a[0], b[0]));
  }
}

export function fromChunk(chunk: dag.Chunk): ProllyMap {
  // Validate at load-time so we can assume data is valid thereafter.
  const entries = chunk.data;
  // Assert that the shape/type is correct
  assertEntries(entries);

  // But also assert that entries is sorted and has no duplicate keys.
  validateKeys(entries);
  return new ProllyMap(entries);
}

function validateKeys(entries: ReadonlyArray<Entry>) {
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
}

function assertEntry(v: ReadonlyJSONValue): asserts v is Entry {
  assertArray(v);
  if (v.length !== 2) {
    throw new Error('Invalid entry length');
  }
  assertString(v[0]);
  assertJSONValue(v[1]);
}

function assertEntries(
  v: ReadonlyJSONValue,
): asserts v is ReadonlyArray<Entry> {
  assertArray(v);
  for (const e of v as ReadonlyArray<ReadonlyJSONValue>) {
    assertEntry(e);
  }
}

// If the key is in entries then the return value is the index of the key. If
// the key is not in entries then the return value is the index to insert the
// key at. Except that we return the negative index -1. The way to think about
// this is that if we need to insert at 0 we return -1. This is modelled after
// the Java API.
export function binarySearch(
  key: string,
  entries: ReadonlyArray<Entry>,
): number {
  let size = entries.length;
  if (size === 0) {
    return -1;
  }
  let base = 0;

  while (size > 1) {
    const half = Math.floor(size / 2);
    const mid = base + half;
    // mid is always in [0, size), that means mid is >= 0 and < size.
    // mid >= 0: by definition
    // mid < size: mid = size / 2 + size / 4 + size / 8 ...
    const entry = entries[mid];
    const cmp = stringCompare(entry[0], key);
    base = cmp > 0 ? base : mid;
    size -= half;
  }

  // base is always in [0, size) because base <= mid.
  const entry = entries[base];
  const cmp = stringCompare(entry[0], key);
  if (cmp === 0) {
    return base;
  }
  const index = base + (cmp === -1 ? 1 : 0);
  return -index - 1;
}

export function entriesFromFlatbuffer(data: Uint8Array): Entry[] {
  const buf = new flatbuffers.ByteBuffer(data);
  const root = LeafFB.getRootAsLeaf(buf);
  const entries: Entry[] = [];
  for (let i = 0; i < root.entriesLength(); i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const entry = root.entries(i)!;
    const keyArray = entry.keyArray();
    assertNotNull(keyArray);
    const key = utf8.decode(keyArray);
    const valArray = entry.valArray();
    assertNotNull(valArray);
    const val = JSON.parse(utf8.decode(valArray));
    entries.push([key, val]);
  }
  return entries;
}

export function entriesToFlatbuffer(entries: Entry[]): Uint8Array {
  const builder = new flatbuffers.Builder();
  const leafEntries = [];
  for (const entry of entries) {
    const leafEntry = LeafEntryFB.createLeafEntry(
      builder,
      LeafEntryFB.createKeyVector(builder, utf8.encode(entry[0])),
      LeafEntryFB.createValVector(
        builder,
        utf8.encode(JSON.stringify(entry[1])),
      ),
    );
    leafEntries.push(leafEntry);
  }
  const root = LeafFB.createLeaf(
    builder,
    LeafFB.createEntriesVector(builder, leafEntries),
  );
  builder.finish(root);
  return builder.asUint8Array();
}

export {ProllyMap as Map};
