import type {Read} from './store.js';

export const deleteSentinel = null;
export type DeleteSentinel = typeof deleteSentinel;

export class WriteImplBase {
  protected readonly _pending: Map<string, Uint8Array | DeleteSentinel> =
    new Map();
  private readonly _read: Read;

  constructor(read: Read) {
    this._read = read;
  }

  async has(key: string): Promise<boolean> {
    switch (this._pending.get(key)) {
      case undefined:
        return this._read.has(key);
      case deleteSentinel:
        return false;
      default:
        return true;
    }
  }

  async get(key: string): Promise<Uint8Array | undefined> {
    const v = this._pending.get(key);
    switch (v) {
      case deleteSentinel:
        return undefined;
      case undefined:
        return this._read.get(key);
      default:
        return v;
    }
  }

  async put(key: string, value: Uint8Array): Promise<void> {
    this._pending.set(key, value);
  }

  async del(key: string): Promise<void> {
    this._pending.set(key, deleteSentinel);
  }

  release(): void {
    this._read.release();
  }
}
