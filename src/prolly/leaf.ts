import {Chunk} from '../dag/chunk';
import type {Entry} from './mod';
import * as flatbuffers from 'flatbuffers';
import {Leaf as LeafFB} from './generated/leaf/leaf';
import {LeafEntry as LeafEntryFB} from './generated/leaf/leaf-entry';
import {arrayCompare} from './array-compare';
import {assertNotNull} from '../assert-not-null';

export class Leaf {
  readonly chunk: Chunk;

  private constructor(chunk: Chunk) {
    this.chunk = chunk;
  }

  static async new(entries: Iterable<Entry>): Promise<Leaf> {
    const builder = new flatbuffers.Builder();
    const leafEntries = [];
    for (const entry of entries) {
      const leafEntry = LeafEntryFB.createLeafEntry(
        builder,
        LeafEntryFB.createKeyVector(builder, entry.key),
        LeafEntryFB.createValVector(builder, entry.val),
      );
      leafEntries.push(leafEntry);
    }
    const root = LeafFB.createLeaf(
      builder,
      LeafFB.createEntriesVector(builder, leafEntries),
    );
    builder.finish(root);
    const data = builder.asUint8Array();

    const chunk = await Chunk.new(data, []);
    return new Leaf(chunk);
  }

  static load(chunk: Chunk): Leaf {
    // Validate at load-time so we can assume data is valid thereafter.
    const buf = new flatbuffers.ByteBuffer(chunk.data);
    const root = LeafFB.getRootAsLeaf(buf);

    // Rust has a 'missing entries' error but the TS/JS bindings has no way to
    // distinguish if the entries is present and empty vs missing.

    const entriesLength = root.entriesLength();

    let prev: Uint8Array | null = null;
    for (let i = 0; i < entriesLength; i++) {
      const entry = root.entries(i);
      assertNotNull(entry);
      const ek = entry.keyArray();

      if (prev !== null) {
        if (!ek) {
          throw new Error('missing key');
        }
        const ord = arrayCompare(prev, ek);
        if (ord === 0) {
          throw new Error('duplicate key');
        }
        if (ord > 0) {
          throw new Error('unsorted key');
        }
      }
      if (!ek) {
        throw new Error('missing key');
      }
      if (entry.valArray() === null) {
        throw new Error('missing val');
      }
      prev = ek;
    }

    return new Leaf(chunk);
  }

  *entries(): Generator<Entry, void> {
    const buf = new flatbuffers.ByteBuffer(this.chunk.data);
    const root = LeafFB.getRootAsLeaf(buf);
    for (let i = 0; i < root.entriesLength(); i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const entry = root.entries(i)!;
      yield {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        key: entry.keyArray()!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        val: entry.valArray()!,
      };
    }
  }

  [Symbol.iterator](): Generator<Entry, void> {
    return this.entries();
  }

  getEntryByIndex(i: number): LeafEntryFB {
    const buf = new flatbuffers.ByteBuffer(this.chunk.data);
    const root = LeafFB.getRootAsLeaf(buf);
    const entry = root.entries(i);
    assertNotNull(entry);
    return entry;
  }

  binarySearch(key: Uint8Array): {found: boolean; index: number} {
    const buf = new flatbuffers.ByteBuffer(this.chunk.data);
    const root = LeafFB.getRootAsLeaf(buf);

    let size = root.entriesLength();
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const entry = root.entries(mid)!;
      // No way that key can be None.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const cmp = arrayCompare(entry.keyArray()!, key);
      base = cmp > 0 ? base : mid;
      size -= half;
    }
    // base is always in [0, size) because base <= mid.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const entry = root.entries(base)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const cmp = arrayCompare(entry.keyArray()!, key);
    if (cmp === 0) {
      return {found: true, index: base};
    }
    return {found: false, index: base + cmp};
  }
}
