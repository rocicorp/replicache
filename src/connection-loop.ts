import {resolver} from './resolver.js';
import {sleep} from './sleep.js';

const DEBOUNCE_DELAY = 10;

const MIN_DELAY = 30;
const MAX_DELAY = 60_000;

const MAX_CONNECTIONS = 3;

type SendRecord = {duration: number; ok: boolean};

export interface ConnectionLoopDelegate {
  invokeSend(): unknown;
  debounceDelay?(): number;
  maxConnections?(): number;
  watchdogTimer?(): number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log?(...args: any[]): void;
}

export class ConnectionLoop {
  // ConnectionLoop runs a loop sending network requests (either pushes or
  // pulls) to the server. Our goal, generally, is to send requests as fast as
  // we can, but to adjust in case of slowness, network errors, etc. We will
  // send requests in parallel if the server supports it. We also debounce
  // pushes since they frequently happen in series very near to one another
  // (e.g., during drag'n drops).
  //
  // The loop flows through the following states forever, until it is closed:
  //
  // Pending: Wait for event or watchdog
  //          |
  //          v
  // Debounce: Wait for more events (we debounce pushes)
  //          |
  //          v
  // Wait for available connection (we limit number of parallel requests
  // allowed)
  //          |
  //          v
  // Wait to send (if requests are taking too long, we will slow down)
  //          |
  //          v
  // Send (asynchronously, wrt the loop)
  //          |
  //          v
  // Back to the pending!

  // Controls whether the next iteration of the loop will wait at the pending
  // state.
  private _pendingResolver = resolver<void>();

  // Controls when send() will return. This is purely a convenience to callers
  // who might want to know when the related push/pull operation actually
  // competed without using the onSync API.
  private _currentResolver = resolver<void>();

  private readonly _delegate: ConnectionLoopDelegate;
  private _closed = false;

  constructor(delegate: ConnectionLoopDelegate) {
    this._delegate = delegate;
    this.run();
  }

  close(): void {
    this._closed = true;
  }

  async send(): Promise<void> {
    this._pendingResolver.resolve();
    await this._currentResolver.promise;
  }

  async run(): Promise<void> {
    const sendRecords: SendRecord[] = [];
    let delay = MIN_DELAY;
    let recoverResolver = resolver();
    let lastSendTime = 0;

    // The number of active connections.
    let counter = 0;
    const delegate = this._delegate;
    const {
      debounceDelay = () => DEBOUNCE_DELAY,
      maxConnections = () => MAX_CONNECTIONS,
      watchdogTimer,
      log,
    } = delegate;

    log?.('Starting connection loop');

    while (!this._closed) {
      log?.(
        didLastSendRequestFail(sendRecords)
          ? 'Last request failed. Trying again'
          : 'Waiting for a send',
      );

      // The current resolver is used to make the individual calls to exeute
      // have the correct "duration".
      const currentResolver = resolver();
      this._currentResolver = currentResolver;
      // Don't let this rejected promise escape.
      currentResolver.promise.catch(() => 0);

      // Wait until send is called or until the watchdog timer fires.
      const races = [this._pendingResolver.promise];
      if (watchdogTimer) {
        races.push(sleep(watchdogTimer()));
      }
      await Promise.race(races);

      await sleep(debounceDelay());

      // This resolver is used to wait for incoming push calls.
      this._pendingResolver = resolver();

      if (counter >= maxConnections()) {
        log?.('Too many pushes. Waiting until one finishes...');
        await this._waitUntilAvailableConnection();
        log?.('...finished');
      }

      // We need to delay the next request even if there are no active requests
      // in case of error.
      if (counter > 0 || didLastSendRequestFail(sendRecords)) {
        delay = computeDelayAndUpdateDurations(
          delay,
          maxConnections(),
          sendRecords,
        );
        log?.(
          didLastSendRequestFail(sendRecords)
            ? 'Last connection errored. Sleeping for'
            : 'More than one outstanding connection (' +
                counter +
                '). Sleeping for',
          delay,
          'ms',
        );

        const timeSinceLastSend = Date.now() - lastSendTime;
        if (delay > timeSinceLastSend) {
          await Promise.race([
            sleep(delay - timeSinceLastSend),
            recoverResolver.promise,
          ]);
        }
      }

      counter++;
      (async () => {
        const start = Date.now();
        let err: unknown;
        try {
          lastSendTime = start;
          await delegate.invokeSend();
        } catch (e) {
          err = e;
        }
        sendRecords.push({duration: Date.now() - start, ok: !err});
        if (recovered(sendRecords)) {
          recoverResolver.resolve();
          recoverResolver = resolver();
        }
        counter--;
        this._connectionAvailable();
        if (err) {
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

  private _connectionAvailable() {
    if (this._waitingConnectionResolve) {
      const resolve = this._waitingConnectionResolve;
      this._waitingConnectionResolve = undefined;
      resolve();
    }
  }

  private _waitUntilAvailableConnection() {
    const {promise, resolve} = resolver();
    this._waitingConnectionResolve = resolve;
    return promise;
  }
}

// Number of connections to remember when computing the new delay.
const CONNECTION_MEMORY_COUNT = 9;

function computeDelayAndUpdateDurations(
  delay: number,
  maxConnections: number,
  sendRecords: SendRecord[],
): number {
  const {length} = sendRecords;
  if (length === 0) {
    return delay;
  }

  const {duration, ok} = sendRecords[sendRecords.length - 1];

  if (!ok) {
    return Math.min(MAX_DELAY, delay * 2);
  }

  if (length === 1) {
    return (duration / maxConnections) | 0;
  }

  // length > 1
  const previous: SendRecord = sendRecords[sendRecords.length - 2];

  // Prune
  if (sendRecords.length > CONNECTION_MEMORY_COUNT) {
    sendRecords.shift();
  }

  if (ok && !previous.ok) {
    // Recovered
    return MIN_DELAY;
  }

  const med = median(
    sendRecords.filter(({ok}) => ok).map(({duration}) => duration),
  );

  return (med / maxConnections) | 0;
}

function median(values: number[]) {
  values.sort();
  const {length} = values;
  const half = length >> 1;
  if (length % 2 === 1) {
    return values[half];
  }
  return (values[half - 1] + values[half]) / 2;
}

function didLastSendRequestFail(sendRecords: SendRecord[]) {
  return sendRecords.length > 0 && !sendRecords[sendRecords.length - 1].ok;
}

function recovered(sendRecords: SendRecord[]) {
  return (
    sendRecords.length > 1 &&
    !sendRecords[sendRecords.length - 2].ok &&
    sendRecords[sendRecords.length - 1].ok
  );
}
