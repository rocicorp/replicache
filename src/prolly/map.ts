import type * as dag from '../dag/mod';
import {arrayCompare} from './array-compare';
import {Leaf} from './leaf';
import type {Entry} from './mod';
import {PeekIterator} from './peek-iterator';
import {stringCompare} from './string-compare';

class ProllyMap {
  private _base: Leaf | undefined;
  // TODO: Should really be a BTreeMap because we want ordering... Will do hacky sort
  // for now.
  private readonly _pending: Map<string, Uint8Array | null>;

  constructor(base: Leaf | undefined, pending: Map<string, Uint8Array | null>) {
    this._base = base;
    this._pending = pending;
  }

  static new(): ProllyMap {
    return new ProllyMap(undefined, new Map());
  }

  static async load(hash: string, read: dag.Read): Promise<ProllyMap> {
    const chunk = await read.getChunk(hash);
    if (chunk === undefined) {
      throw new Error(`Chunk not found: ${hash}`);
    }
    const base = Leaf.load(chunk);
    return new ProllyMap(base, new Map());
  }

  has(key: string): boolean {
    const p = this._pending.get(key);
    if (p !== undefined) {
      // if null the key was deleted.
      return p !== null;
    }

    return this._baseHas(key);
  }

  private _baseHas(key: string): boolean {
    if (this._base === undefined) {
      return false;
    }
    return this._base.binarySearch(key).found;
  }

  get(key: string): Uint8Array | undefined {
    const ks = key;
    const p = this._pending.get(ks);
    switch (p) {
      case null:
        return undefined;
      case undefined:
        return this._baseGet(key);
      default:
        return p;
    }
  }

  private _baseGet(key: string): Uint8Array | undefined {
    if (this._base === undefined) {
      return undefined;
    }
    const {found, index} = this._base.binarySearch(key);
    if (!found) {
      return undefined;
    }
    return this._base.getEntryByIndex(index).valArray() ?? undefined;
  }

  put(key: string, val: Uint8Array): void {
    this._pending.set(key, val);
  }

  del(key: string): void {
    this._pending.set(key, null);
  }

  entries(): IterableIterator<Entry> {
    return new Iter(this._base, this._pending);
  }

  [Symbol.iterator](): IterableIterator<Entry> {
    return this.entries();
  }

  async flush(write: dag.Write): Promise<string> {
    const newBase = Leaf.new(this);
    await write.putChunk(newBase.chunk);
    this._base = newBase;
    this._pending.clear();
    return this._base.chunk.hash;
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
        keys.push(b.value.key);
        b = itB.next();
      } else if (!a.done && b.done) {
        keys.push(a.value.key);
        a = itA.next();
      } else if (!a.done && !b.done) {
        const ord = stringCompare(a.value.key, b.value.key);
        switch (ord) {
          case -1:
            keys.push(a.value.key);
            a = itA.next();
            break;
          case 0:
            if (arrayCompare(a.value.val, b.value.val) !== 0) {
              keys.push(a.value.key);
            }
            a = itA.next();
            b = itB.next();
            break;
          case +1:
            keys.push(b.value.key);
            b = itB.next();
            break;
        }
      }
    }
    return keys;
  }

  pendingChangedKeys(): string[] {
    const keys = [];
    const entries = [...this._pending].sort((a, b) =>
      stringCompare(a[0], b[0]),
    );

    for (const [key, pendingVal] of entries) {
      if (pendingVal !== null) {
        // TODO(arv): Use strings for keys.
        const baseVal = this._baseGet(key);
        if (baseVal !== undefined) {
          if (arrayCompare(baseVal, pendingVal) !== 0) {
            keys.push(key);
          }
        } else {
          keys.push(key);
        }
      } else {
        // pending was deleted.
        if (this._baseHas(key)) {
          keys.push(key);
        }
      }
    }
    return keys;
  }
}

const emptyIterator: Iterator<Entry> = {
  next() {
    return {done: true, value: undefined};
  },
};

type DeletableEntry = {
  // TODO(arv): Use string here
  key: string;
  val: Uint8Array | null;
};

// TODO(arv): Refactor to use generator(s)?
class Iter implements IterableIterator<Entry> {
  private readonly _base: PeekIterator<Entry>;
  private readonly _pending: PeekIterator<DeletableEntry>;

  constructor(base: Leaf | undefined, pending: Map<string, Uint8Array | null>) {
    this._base = new PeekIterator(
      base ? base[Symbol.iterator]() : emptyIterator,
    );

    // Since we do not have a BTreeMap we have to sort the pending entries.
    const p: [string, Uint8Array | null][] = [...pending];
    p.sort((a, b) => stringCompare(a[0], b[0]));
    const entries: DeletableEntry[] = p.map(([key, val]) => ({
      key,
      val,
    }));
    this._pending = new PeekIterator(entries.values());
  }

  [Symbol.iterator](): IterableIterator<Entry> {
    return this;
  }

  next(): IteratorResult<Entry> {
    for (;;) {
      const ni = this._nextInternal();
      if (ni.done) {
        return ni;
      }
      if (ni.value.val === null) {
        // Key was deleted
        continue;
      }
      return ni as IteratorResult<Entry>;
    }
  }

  private _nextBase(): IteratorResult<DeletableEntry> {
    return this._base.next();
  }

  private _nextPending(): IteratorResult<DeletableEntry> {
    return this._pending.next();
  }

  private _nextInternal(): IteratorResult<DeletableEntry> {
    const baseKeyIterRes = this._base.peek();
    const pendingKeyIterRes = this._pending.peek();

    if (pendingKeyIterRes.done) {
      return this._nextBase();
    }

    if (baseKeyIterRes.done) {
      return this._nextPending();
    }

    const pendingKey = pendingKeyIterRes.value.key;
    const baseKey = baseKeyIterRes.value.key;

    let r: IteratorResult<DeletableEntry> = {done: true, value: undefined};
    const cmp = arrayCompare(baseKey, pendingKey);
    if (cmp <= 0) {
      r = this._nextBase();
    }
    if (cmp >= 0) {
      r = this._nextPending();
    }
    return r;
  }
}

export {ProllyMap as Map};
