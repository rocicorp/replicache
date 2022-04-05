import type {Hash} from './hash';
import type {JSONValue, ReadonlyJSONValue} from './json';
import type {MaybePromise} from './maybe-promise';
import type {PullResponse} from './puller';
import type {WriteTransaction} from './transactions';

export type BeginPullResult = {
  requestID: string;
  syncHead: Hash;
  ok: boolean;
};

export type Poke = {
  baseCookie: ReadonlyJSONValue;
  pullResponse: PullResponse;
};

type ToPromise<P> = P extends Promise<unknown> ? P : Promise<P>;

/**
 * The type used to describe the mutator definitions passed into [Replicache](classes/Replicache)
 * constructor as part of the [[ReplicacheOptions]].
 *
 * See [[ReplicacheOptions]] [[ReplicacheOptions.mutators|mutators]] for more
 * info.
 */
export type MutatorDefs = {
  [key: string]: (
    tx: WriteTransaction,
    // Not sure how to not use any here...
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args?: any,
  ) => MaybePromise<JSONValue | void>;
};

export type MutatorReturn = MaybePromise<JSONValue | void>;

export type MakeMutator<
  F extends (tx: WriteTransaction, ...args: [] | [JSONValue]) => MutatorReturn,
> = F extends (tx: WriteTransaction, ...args: infer Args) => infer Ret
  ? (...args: Args) => ToPromise<Ret>
  : never;

export type MakeMutators<T extends MutatorDefs> = {
  readonly [P in keyof T]: MakeMutator<T[P]>;
};

/**
 * Base options for [[PullOptions]] and [[PushOptions]]
 */
export interface RequestOptions {
  /**
   * When there are pending pull or push requests this is the _minimum_ amount
   * of time to wait until we try another pull/push.
   */
  minDelayMs?: number;

  /**
   * When there are pending pull or push requests this is the _maximum_ amount
   * of time to wait until we try another pull/push.
   */
  maxDelayMs?: number;
}

/**
 * The reason [[onClientStateNotFound]] was called.
 */
export type ClientStateNotFoundReason =
  | {type: 'NotFoundOnServer'}
  | {type: 'NotFoundOnClient'};
