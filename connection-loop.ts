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

  async push() {
    this._pendingPushResolver.resolve();
    // await a promise to allow the currentPushResolver to be created inside the
    // connection loop.
    await Promise.resolve(0);
    await this._currentPushResolver.promise;
  }

  async connectionLoop() {
    const durations: Durations = [];
    let delay = MIN_DELAY;
    let lastConnectionErrored = false;
    console.log('Starting connection loop');
    for (;;) {
      // SHould be while (!closed)?
      console.log('Waiting for a push');
      await this._pendingPushResolver.promise;
      this._currentPushResolver = resolver();
      await sleep(PUSH_DELAY);
      this._pendingPushResolver = resolver();

      if (pushCounter >= MAX_CONNECTIONS) {
        console.log('Too many pushes. Waiting until one finishes');
        await waitUntilAvailableConnections();
      }
      if (pushCounter > 0 || lastConnectionErrored) {
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
        try {
          await invokePush();
          lastConnectionErrored = false;
        } catch {
          lastConnectionErrored = true;
        }
        const stop = Date.now();
        delay = computeDelayAndUpdateDurations(
          delay,
          start,
          stop,
          !lastConnectionErrored,
          durations,
        );
        console.log(
          'Last connection took',
          stop - start,
          'ms. New delay is ',
          delay,
        );
        pushCounter--;
        wakeUpWaitingPushes();
        this._currentPushResolver.resolve();
      })();
    }
  }
}

class CancelToken {
  readonly promise: Promise<void>;
  readonly cancel: () => void;
  constructor() {
    ({promise: this.promise, resolve: this.cancel} = resolver());
  }
}

function sleep(ms: number, cancelPromise?: Promise<unknown>) {
  let id: ReturnType<typeof setTimeout> | 0 = 0;
  let reject: (message: Error) => void;
  const promise = new Promise<void>((resolve, rej) => {
    reject = rej;
    id = setTimeout(() => {
      id = 0;
      resolve();
    }, ms);
  });

  if (cancelPromise) {
    cancelPromise.then(() => {
      if (id) {
        clearTimeout(id);
        reject(new Error('sleep cancelled'));
      }
    });
  }
  return promise;
}

let shouldError = 0;

async function invokePush() {
  console.log('push ->', new Date());
  await sleep(100 + Math.random() * 100);
  if (Math.random() < shouldError) {
    await sleep(1000);
    console.log('<- push ERROR', new Date());
    throw new Error('Intentional error');
  }
  console.log('<- push', new Date());
}

const waitingConnectionResolvers: Set<() => void> = new Set();

function wakeUpWaitingPushes() {
  if (waitingConnectionResolvers.size > 0) {
    console.log('wakeUpWaitingPushes', waitingConnectionResolvers.size);
  }
  for (const resolve of waitingConnectionResolvers) {
    waitingConnectionResolvers.delete(resolve);
    resolve();
  }
}

function waitUntilAvailableConnections() {
  const {promise, resolve} = resolver();
  waitingConnectionResolvers.add(resolve);
  return promise;
}

export function resolver<R = void>(): {
  promise: Promise<R>;
  resolve: (res: R) => void;
} {
  let resolve!: (res: R) => void;
  const promise = new Promise<R>(res => {
    resolve = res;
  });
  return {promise, resolve};
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

// setTimeout(() => 0, 3000);

const rep = new Replicache();
rep.connectionLoop();

// sample calls to push

// Sync calls all get collapsed
rep.push();
rep.push();
rep.push();

await sleep(1_000);

console.log('\nTesting pushDelay');

for (let i = 0; i < 5; i++) {
  rep.push();
  const start = performance.now();
  await sleep(0); // Browsers clamp at 4ms? deno at 2?
  console.log('slept for', performance.now() - start, 'ms');
}

await sleep(1_000);

console.log('\nTesting longer sequence of pushes');
for (let i = 0; i < 50; i++) {
  await sleep(10 + 50 * Math.random());
  rep.push();
}

await sleep(1_000);
console.log('\nTesting with errors sequence of pushes');

for (let i = 0; i < 20; i++) {
  await sleep(10 + 50 * Math.random());
  rep.push();
}
shouldError = 1;
for (let i = 0; i < 20; i++) {
  await sleep(10 + 50 * Math.random());
  rep.push();
}
shouldError = 0;
for (let i = 0; i < 50; i++) {
  await sleep(10 + 50 * Math.random());
  rep.push();
}

await sleep(1_000);
console.log('\nTest ordering');
rep.push().then(() => console.log('A'));
rep.push().then(() => console.log('B'));
rep.push().then(() => console.log('C'));

await sleep(1_000);
console.log('\nTest error again');

shouldError = 1;

for (let i = 0; i < 50; i++) {
  await sleep(500 + 1000 * Math.random());
  rep.push();
}
