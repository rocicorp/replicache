import {RWLock} from '../rw-lock.js';

export interface Store {
  read(): Promise<Read>;
  write(): Promise<Write>;
  close(): Promise<void>;
}

export interface StoreWithRelease {
  read(): Promise<Read & Release>;
  withRead<T>(fn: (read: Read) => Promise<T> | T): Promise<T>;
  write(): Promise<Write & Release>;
  withWrite<T>(fn: (write: Write) => Promise<T> | T): Promise<T>;
  close(): Promise<void>;
}

export interface Read {
  has(key: string): Promise<boolean>;
  get(key: string): Promise<Uint8Array | undefined>;
}

interface WriteBasic {
  put(key: string, value: Uint8Array): Promise<void>;
  del(key: string): Promise<void>;
}

interface WriteTransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface Write extends Read, WriteBasic, WriteTransaction {}

export interface Release {
  release(): void;
}

/**
 * Creates a new store that wraps read and write in an RWLock.
 */
export class WrapStore implements StoreWithRelease, Read, WriteBasic {
  private readonly _store: Store;
  private readonly _rwLock = new RWLock();

  constructor(store: Store) {
    this._store = store;
    this._rwLock = new RWLock();
  }

  async put(key: string, value: Uint8Array): Promise<void> {
    await this.withWrite(async write => {
      await write.put(key, value);
      await write.commit();
    });
  }

  async del(key: string): Promise<void> {
    await this.withWrite(async write => {
      await write.del(key);
      await write.commit();
    });
  }

  has(key: string): Promise<boolean> {
    return this.withRead(read => read.has(key));
  }

  get(key: string): Promise<Uint8Array | undefined> {
    return this.withRead(read => read.get(key));
  }

  async read(): Promise<Read & Release> {
    const release = await this._rwLock.read();
    return makeRelease(await this._store.read(), release);
  }

  async withRead<T>(fn: (read: Read) => Promise<T> | T): Promise<T> {
    let release;
    try {
      release = await this._rwLock.read();
      return await fn(await this._store.read());
    } finally {
      release?.();
    }
  }

  async write(): Promise<Write & Release> {
    const release = await this._rwLock.write();
    return makeRelease(await this._store.write(), release);
  }

  async withWrite<T>(fn: (write: Write) => Promise<T> | T): Promise<T> {
    let release;
    try {
      release = await this._rwLock.write();
      return await fn(await this._store.write());
    } finally {
      release?.();
    }
  }

  async close(): Promise<void> {
    await this._store.close();
  }
}

function makeRelease<T extends Read | Write>(
  impl: T,
  release: () => void,
): T & Release {
  const o = Object.create(impl, {
    release: {
      value: release,
    },
  });
  return o;
}
