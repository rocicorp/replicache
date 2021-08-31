import {resolver} from './resolver';

export class Lock {
  private _lockP: Promise<void> | null = null;

  async lock(): Promise<() => void> {
    const previous = this._lockP;
    const {promise, resolve} = resolver();
    this._lockP = promise;
    await previous;
    return resolve;
  }

  withLock<R>(f: () => R | Promise<R>): Promise<R> {
    return run(this.lock(), f);
  }
}

export class RWLock {
  private _lock = new Lock();
  private _writeP: Promise<void> | null = null;
  private _readP: Promise<void>[] = [];

  read(): Promise<() => void> {
    return this._lock.withLock(async () => {
      await this._writeP;
      const {promise, resolve} = resolver();
      this._readP.push(promise);
      return resolve;
    });
  }

  withRead<R>(f: () => R | Promise<R>): Promise<R> {
    return run(this.read(), f);
  }

  async write(): Promise<() => void> {
    return await this._lock.withLock(async () => {
      await this._writeP;
      await Promise.all(this._readP);
      const {promise, resolve} = resolver();
      this._writeP = promise;
      this._readP = [];
      return resolve;
    });
  }

  withWrite<R>(f: () => R | Promise<R>): Promise<R> {
    return run(this.write(), f);
  }
}

async function run<R>(
  p: Promise<() => void>,
  f: () => R | Promise<R>,
): Promise<R> {
  const release = await p;
  try {
    return await f();
  } finally {
    release();
  }
}
