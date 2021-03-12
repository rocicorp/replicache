import {resolver} from './resolver.js';
import {sleep} from './sleep.js';

const DEBOUNCE_DELAY = 10;

const MIN_DELAY = 30;
const MAX_DELAY = 60_000;

const MAX_CONNECTIONS = 3;

type Duration = {duration: number; ok: boolean};
type Durations = Duration[];

export interface ConnectionLoopDelegate {
  closed(): boolean;
  invokeExecute(): unknown;
  debounceDelay?: number;
  maxConnections?: number;
  printTime(): string;
  watchdogTimer?: number;
}

export class ConnectionLoop {
  private _pendingResolver = resolver<void>();
  private _currentResolver = resolver<void>();
  private _pushCounter = 0;

  private readonly _delegate: ConnectionLoopDelegate;
  private _lastSendTime = 0;

  constructor(delegate: ConnectionLoopDelegate) {
    this._delegate = delegate;
    this.run();
  }

  async execute(): Promise<void> {
    this._pendingResolver.resolve();
    // await a promise to allow the currentPushResolver to be created inside the
    // connection loop.
    await Promise.resolve(0);
    await this._currentResolver.promise;
  }

  async run(): Promise<void> {
    const durations: Durations = [];
    let delay = MIN_DELAY;
    let lastConnectionErrored = false;
    const delegate = this._delegate;
    const {
      debounceDelay = DEBOUNCE_DELAY,
      maxConnections = MAX_CONNECTIONS,
      watchdogTimer,
    } = delegate;

    console.log('Starting connection loop', delegate.printTime());

    while (!delegate.closed()) {
      console.log('Waiting for a push', delegate.printTime());

      if (watchdogTimer) {
        await Promise.race([
          this._pendingResolver.promise,
          sleep(watchdogTimer),
        ]);
      } else {
        await this._pendingResolver.promise;
      }

      // This resolvers is used to make the individual calls to push have the
      // correct "duration".
      const currentResolver = resolver();
      this._currentResolver = currentResolver;
      // Don't let this rejected promise escape.
      currentResolver.promise.catch(() => 0);

      if (debounceDelay) {
        await sleep(debounceDelay);
      }

      // This resolver is used to wait for incoming push calls.
      this._pendingResolver = resolver();

      if (lastConnectionErrored || this._pushCounter >= maxConnections) {
        console.log(
          'Too many pushes. Waiting until one finishes',
          delegate.printTime(),
        );
        await this._waitUntilAvailableConnection();
      }

      if (lastConnectionErrored || this._pushCounter > 0) {
        if (lastConnectionErrored) {
          console.log(
            'Last connection errored. Sleeping for',
            delay,
            'ms',
            delegate.printTime(),
          );
        } else {
          console.log(
            'More than one outstanding connection (',
            this._pushCounter,
            '). Sleeping for',
            delay,
            'ms',
            delegate.printTime(),
          );
        }

        if (lastConnectionErrored) {
          await sleep(delay);
        } else {
          const timeSinceLastSend = Date.now() - this._lastSendTime;

          console.log(
            'XXX',
            delay,
            timeSinceLastSend,
            delay > timeSinceLastSend,
            delay - timeSinceLastSend,
          );

          if (delay > timeSinceLastSend) {
            await sleep(delay - timeSinceLastSend);
          }
        }
      }

      this._pushCounter++;
      (async () => {
        const start = Date.now();
        let err: unknown;
        try {
          this._lastSendTime = start;
          await delegate.invokeExecute();
        } catch (e) {
          err = e;
        }
        const stop = Date.now();
        lastConnectionErrored = err !== undefined;
        delay = computeDelayAndUpdateDurations(
          delay,
          stop - start,
          !err,
          maxConnections,
          durations,
        );
        console.log(
          'Last connection took',
          stop - start,
          'ms. New delay is ',
          delay,
          this._delegate.printTime(),
        );
        this._pushCounter--;
        this._wakeUpWaitingPush();
        if (lastConnectionErrored) {
          currentResolver.reject(err);
          // Keep trying
          this._pendingResolver.resolve();
        } else {
          currentResolver.resolve();
        }
      })();
    }
  }

  private _waitingConnectionResolve: (() => void) | undefined = undefined;

  private _wakeUpWaitingPush() {
    if (this._waitingConnectionResolve) {
      console.log('wakeUpWaitingPush');
      const resolve = this._waitingConnectionResolve;
      this._waitingConnectionResolve = undefined;
      resolve();
    }
  }

  private _waitUntilAvailableConnection() {
    const {promise, resolve} = resolver();
    console.assert(!this._waitingConnectionResolve);
    this._waitingConnectionResolve = resolve;
    return promise;
  }
}

// Number of connections to remember when computing the new delay.
const CONNECTION_MEMORY_COUNT = 9;

function computeDelayAndUpdateDurations(
  delay: number,
  duration: number,
  ok: boolean,
  maxConnections: number,
  durations: Durations,
): number {
  const last: Duration | undefined = durations[durations.length - 1];
  if (ok) {
    durations.push({duration, ok});
  }
  if (durations.length === 1) {
    return (duration / maxConnections) | 0;
  }
  if (!ok) {
    return Math.min(MAX_DELAY, delay * 2);
  }

  if (!last.ok) {
    // Recovered
    return MIN_DELAY;
  }

  const med = median(durations);
  if (durations.length > CONNECTION_MEMORY_COUNT) {
    durations.shift();
  }
  return (med / maxConnections) | 0;
}

function median(durations: Durations) {
  const a = durations.filter(({ok}) => ok).map(({duration}) => duration);
  a.sort();
  const {length} = a;
  const half = length >> 1;
  if (length % 2 === 1) {
    return a[half];
  }
  return (a[half - 1] + a[half]) / 2;
}
