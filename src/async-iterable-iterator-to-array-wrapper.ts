import {asyncIterableToArray} from './async-iterable-to-array';

/**
 * A class that wraps an async iterable iterator to add a [[toArray]] method.
 *
 * Usage:
 *
 * ```ts
 * const keys: string[] = await rep.scan().keys().toArray();
 * ```
 */

export class AsyncIterableIteratorToArrayWrapper<V>
  implements AsyncIterableIterator<V>
{
  private readonly _it: AsyncIterableIterator<V>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly next: (v?: any) => Promise<IteratorResult<V>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly return?: (value?: any) => Promise<IteratorResult<V>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly throw?: (e?: any) => Promise<IteratorResult<V>>;

  constructor(it: AsyncIterableIterator<V>) {
    this._it = it;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.next = (v: any) => it.next(v);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion
    this.return = it.return ? (v: any) => it.return!(v) : undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion
    this.throw = it.throw ? (v: any) => it.throw!(v) : undefined;
  }

  toArray(): Promise<V[]> {
    return asyncIterableToArray(this._it);
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<V> {
    return this._it[Symbol.asyncIterator]();
  }
}
