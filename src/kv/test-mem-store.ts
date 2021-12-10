import {stringCompare} from '../string-compare';
import {MemStore} from './mem-store';
import type {Value} from './store';

export class TestMemStore extends MemStore {
  snapshot(): Record<string, Value> {
    const entries = [...this._map.entries()];
    entries.sort((a, b) => stringCompare(a[0], b[0]));
    return Object.fromEntries(entries);
  }

  restoreSnapshot(snapshot: Record<string, Value>): void {
    this._map.clear();

    for (const [k, v] of Object.entries(snapshot)) {
      this._map.set(k, v);
    }
  }

  /**
   * This exposes the underlying map for testing purposes.
   */
  entries(): IterableIterator<[string, Value]> {
    return this._map.entries();
  }

  map(): Map<string, Value> {
    return this._map;
  }

  clear(): void {
    this._map.clear();
  }
}
