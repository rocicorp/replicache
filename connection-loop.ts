let pushCounter = 0;
const MIN_DELAY = 30;
const MAX_DELAY = 60_000;

const MAX_CONNECTIONS = 3;

// Number of connections to remember when computing the new delay.
const CONNECTION_MEMORY_COUNT = 10;

type Duration = {start: number; stop: number; ok: boolean};
type Durations = Duration[];

const PUSH_DELAY = 10;

interface ConnectionLoopDelegate {
  closed(): boolean;
  invokeExecute(): Promise<void>;
}

class ConnectionLoop {
  private _pendingResolver = resolver<void>();
  private _currentResolver = resolver<void>();

  private readonly _delegate: ConnectionLoopDelegate;

  constructor(delegate: ConnectionLoopDelegate) {
    this._delegate = delegate;
    this.run();
  }

  async execute() {
    this._pendingResolver.resolve();
    // await a promise to allow the currentPushResolver to be created inside the
    // connection loop.
    await Promise.resolve(0);
    await this._currentResolver.promise;
  }

  async run() {
    const durations: Durations = [];
    let delay = MIN_DELAY;
    let lastConnectionErrored = false;
    console.log('Starting connection loop');

    while (!this._delegate.closed()) {
      console.log('Waiting for a push');
      await this._pendingResolver.promise;

      // This resolvers is used to make the individual calls to push have the
      // correct "duration".
      const currentResolver = resolver();
      this._currentResolver = currentResolver;
      currentResolver.promise.catch(() => 0);

      await sleep(PUSH_DELAY);

      // This resolver is used to wait for incoming push calls.
      this._pendingResolver = resolver();

      if (pushCounter >= MAX_CONNECTIONS) {
        console.log('Too many pushes. Waiting until one finishes');
        await this._waitUntilAvailableConnection();
      }

      if (lastConnectionErrored || pushCounter > 0) {
        if (lastConnectionErrored) {
          console.log('Last connection errored. Sleeping for', delay, 'ms');
        } else {
          console.log(
            'More than one outstanding connection (',
            pushCounter,
            '). Sleeping for',
            delay,
            'ms',
          );
        }
        await sleep(delay);
      }

      pushCounter++;
      (async () => {
        const start = Date.now();
        let err: unknown;
        try {
          await this._delegate.invokeExecute();
        } catch (e) {
          err = e;
        }
        const stop = Date.now();
        lastConnectionErrored = err !== undefined;
        delay = computeDelayAndUpdateDurations(
          delay,
          start,
          stop,
          !err,
          durations,
        );
        console.log(
          'Last connection took',
          stop - start,
          'ms. New delay is ',
          delay,
        );
        pushCounter--;
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

class Replicache {
  private _closed = false;
  private _connectionLoop: ConnectionLoop = new ConnectionLoop({
    closed: () => this._closed,
    invokeExecute: () => invokePush(),
  });

  async push() {
    return this._connectionLoop.execute();
  }
}

function sleep(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(() => resolve(), ms);
  });
}

let shouldError = 0;
shouldError = 0;

let pushID = 0;

async function invokePush() {
  const id = pushID++;
  const e = Math.random() < shouldError;
  console.log(`push ${id} ->`, new Date());
  await sleep(100 + Math.random() * 100);

  if (e) {
    await sleep(1000);
    console.log(`<- push ${id} ERROR`, new Date());
    throw new Error('Intentional error');
  }
  console.log(`<- push ${id}`, new Date());
}

interface Resolver<R = void, E = unknown> {
  promise: Promise<R>;
  resolve: (res: R) => void;
  reject: (err: E) => void;
}

export function resolver<R = void, E = unknown>(): Resolver<R, E> {
  let resolve!: (res: R) => void;
  let reject!: (err: E) => void;
  const promise = new Promise<R>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {promise, resolve, reject};
}

function computeDelayAndUpdateDurations(
  delay: number,
  start: number,
  stop: number,
  ok: boolean,
  durations: Durations,
): number {
  const last: Duration | undefined = durations[durations.length - 1];
  durations.push({start, stop, ok});
  if (durations.length === 1) {
    return (stop - start) / MAX_CONNECTIONS;
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
  return (med / MAX_CONNECTIONS) | 0;
}

function median(durations: Durations) {
  const a = durations.filter(({ok}) => ok).map(({start, stop}) => stop - start);
  a.sort();
  const {length} = a;
  const half = length >> 1;
  if (length % 2 === 1) {
    return a[half];
  }
  return (a[half - 1] + a[half]) / 2;
}

// console.log(
//   computeDelayAndUpdateDurations(100, 0, 200, true, [
//     {start: 100, stop: 200, ok: true},
//   ]),
// );

const rep = new Replicache();

// sample calls to push

const ps = new Set();

function push() {
  const p = rep.push();
  ps.add(p);
  return p;
}

async function waitForAll() {
  await Promise.allSettled(ps);
  ps.clear();
}

// Sync calls all get collapsed
push();
push();
push();

await waitForAll();

console.log('\nTesting pushDelay');

for (let i = 0; i < 10; i++) {
  push();
  const start = performance.now();
  await sleep(0); // Browsers clamp at 4ms? deno at 2?
  console.log('slept for', performance.now() - start, 'ms');
}

await waitForAll();

console.log('\nTesting longer sequence of pushes');
for (let i = 0; i < 50; i++) {
  await sleep(10 + 50 * Math.random());
  push();
}

await waitForAll();

console.log('\nTesting with errors sequence of pushes');

for (let i = 0; i < 20; i++) {
  await sleep(10 + 50 * Math.random());
  push();
}

await waitForAll();
shouldError = 1;

for (let i = 0; i < 20; i++) {
  await sleep(100 + 50 * Math.random());
  push().catch(err => console.error(err));
}

await waitForAll();
shouldError = 0;

for (let i = 0; i < 50; i++) {
  await sleep(10 + 50 * Math.random());
  push();
}

await waitForAll();

console.log('\nTest ordering');
push().then(() => console.log('A'));
push().then(() => console.log('B'));
push().then(() => console.log('C'));

await waitForAll();

console.log('\nTest error again');

shouldError = 1;

for (let i = 0; i < 10; i++) {
  await sleep(500 + 1000 * Math.random());
  push().catch(() => 1);
}

await waitForAll();

shouldError = 1;
push().catch(() => 0);
await waitForAll();

await sleep(5_000);

shouldError = 0;

await sleep(5_000);

await waitForAll();
