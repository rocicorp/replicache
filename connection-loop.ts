let pushCounter = 0;
const MIN_DELAY = 30;
const MAX_DELAY = 60_000;

const MAX_CONNECTIONS = 3;

// Number of connections to remember when computing the new delay.
const CONNECTION_MEMORY_COUNT = 10;

type Duration = {start: number; stop: number; ok: boolean};
type Durations = Duration[];

const PUSH_DELAY = 10;

class Replicache {
  private _pendingPushResolver = resolver<void>();
  private _currentPushResolver = resolver<void>();
  private _closed = false;

  async push() {
    this._pendingPushResolver.resolve();
    // await a promise to allow the currentPushResolver to be created inside the
    // connection loop.
    await Promise.resolve(0);
    await this._currentPushResolver.promise;
  }

  async connectionPushLoop() {
    const durations: Durations = [];
    let delay = MIN_DELAY;
    let lastConnectionErrored = false;
    console.log('Starting connection loop');

    while (!this._closed) {
      console.log('Waiting for a push');
      await this._pendingPushResolver.promise;

      // This resolvers is used to make the individual calls to push have the
      // correct "duration".
      const currentPushResolver = resolver();
      this._currentPushResolver = currentPushResolver;
      currentPushResolver.promise.catch(() => 0);

      await sleep(PUSH_DELAY);

      // This resolver is used to wait for incoming push calls.
      this._pendingPushResolver = resolver();

      if (pushCounter >= MAX_CONNECTIONS) {
        console.log('Too many pushes. Waiting until one finishes');
        await waitUntilAvailableConnection();
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
        let err;
        try {
          await invokePush();
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
        wakeUpWaitingPush();
        if (lastConnectionErrored) {
          currentPushResolver.reject(err);
        } else {
          currentPushResolver.resolve();
        }
      })();
    }
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

let waitingConnectionResolve: (() => void) | undefined;

function wakeUpWaitingPush() {
  if (waitingConnectionResolve) {
    console.log('wakeUpWaitingPush');
    const resolve = waitingConnectionResolve;
    waitingConnectionResolve = undefined;
    resolve();
  }
}

function waitUntilAvailableConnection() {
  const {promise, resolve} = resolver();
  console.assert(!waitingConnectionResolve);
  waitingConnectionResolve = resolve;
  return promise;
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

  const okDurations = durations.filter(({ok}) => ok);
  const average =
    okDurations.reduce((p, c) => p + c.stop - c.start, 0) / okDurations.length;

  if (durations.length > CONNECTION_MEMORY_COUNT) {
    durations.shift();
  }
  return average / MAX_CONNECTIONS;
}

// console.log(
//   computeDelayAndUpdateDurations(100, 0, 200, true, [
//     {start: 100, stop: 200, ok: true},
//   ]),
// );

const rep = new Replicache();
rep.connectionPushLoop();

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
