import {MemStore} from './mem-store';
import type {Value} from './store';

export class TestMemStore extends MemStore {
  /**
   * This exposes the underlying map for testing purposes.
   */
  entries(): IterableIterator<[string, Value]> {
    return this._map.entries();
  }

  map(): Map<string, Value> {
    return this._map;
  }
}
