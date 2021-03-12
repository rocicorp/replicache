import {expect} from '@esm-bundle/chai';
import {SinonFakeTimers, useFakeTimers} from 'sinon';
import {ConnectionLoop, ConnectionLoopDelegate} from './connection-loop.js';
import {sleep} from './sleep.js';

let clock: SinonFakeTimers;
setup(function () {
  clock = useFakeTimers(0);
});

teardown(function () {
  clock.restore();
});

let loop: ConnectionLoop;
let printTime: () => string;

const ps = new Set();

function execute() {
  const p = loop?.execute();
  ps.add(p);
  return p;
}

async function waitForAll() {
  await Promise.allSettled(ps);
  ps.clear();
}

let counter = 0;
const log: string[] = [];

function createLoop(
  partialDelegate: Partial<ConnectionLoopDelegate> & {
    requestTime: number;
    shouldError?: boolean;
  } = {requestTime: 90},
) {
  log.length = 0;
  counter = 0;
  const start = Date.now();

  const Reset = '\x1b[0m';
  const FgMagenta = '\x1b[35m';
  printTime = () => `[time: ${FgMagenta}${Date.now() - start}${Reset}]`;

  const delegate: ConnectionLoopDelegate = {
    closed: () => false,
    invokeExecute: async () => {
      const c = counter++;
      const {requestTime = 90, shouldError = false} = partialDelegate;
      const logTimes = true;
      console.log(
        'Starting request',
        c,
        'expected time',
        requestTime,
        printTime(),
      );
      log.push('s' + c + (logTimes ? ':' + Date.now() : ''));
      await sleep(requestTime);
      if (shouldError) {
        log.push('e' + c + (logTimes ? ':' + Date.now() : ''));
      } else {
        log.push('f' + c + (logTimes ? ':' + Date.now() : ''));
      }
      console.log('Stopping request', c, printTime());
      if (shouldError) {
        throw Error('Intentional error');
      }
    },
    printTime,
    ...partialDelegate,
  };

  loop = new ConnectionLoop(delegate);
}

test('basic sequential by awaiting', async () => {
  const requestTime = 200;
  const debounceDelay = 3;
  createLoop({requestTime, debounceDelay});

  let p = loop.execute();
  await clock.runAllAsync();
  await p;
  expect(Date.now()).to.equal(requestTime + debounceDelay);

  expect(log).to.deep.equal(['s0:3', 'f0:203']);

  p = loop.execute();
  await clock.runAllAsync();
  await p;
  expect(Date.now()).to.equal(2 * (requestTime + debounceDelay));

  p = loop.execute();
  await clock.runAllAsync();
  await p;
  expect(Date.now()).to.equal(3 * (requestTime + debounceDelay));

  expect(log).to.deep.equal([
    's0:3',
    'f0:203',
    's1:206',
    'f1:406',
    's2:409',
    'f2:609',
  ]);
});

test('sync calls collapsed', async () => {
  let closed = false;

  const debounceDelay = 5;
  const requestTime = 50;
  createLoop({
    closed: () => closed,
    requestTime,
    debounceDelay,
  });

  execute();
  expect(log).to.deep.equal([]);
  execute();
  expect(log).to.deep.equal([]);
  execute();
  expect(log).to.deep.equal([]);

  await clock.tickAsync(debounceDelay);
  expect(Date.now()).to.equal(debounceDelay);

  expect(log).to.deep.equal(['s0:5']);

  await clock.tickAsync(requestTime);
  expect(Date.now()).to.equal(debounceDelay + requestTime);

  expect(log).to.deep.equal(['s0:5', 'f0:55']);

  await waitForAll();
  closed = true;
});

test('concurrent connections', async () => {
  const debounceDelay = 5;
  const minDelay = 30;
  const maxConnections = 3;
  // The request time is selected to make the delay not adjust itself.
  const requestTime = minDelay * maxConnections;

  createLoop({
    requestTime,
    debounceDelay,
    maxConnections,
  });

  execute();

  await clock.runToLastAsync();
  expect(Date.now()).to.equal(debounceDelay);

  expect(log).to.deep.equal(['s0:5']);
  execute();
  expect(log).to.deep.equal(['s0:5']);

  await clock.tickAsync(minDelay);
  expect(Date.now()).to.equal(debounceDelay + minDelay);

  expect(log).to.deep.equal(['s0:5', 's1:35']);

  execute();
  await clock.tickAsync(minDelay);
  expect(Date.now()).to.equal(debounceDelay + 2 * minDelay);

  expect(log).to.deep.equal(['s0:5', 's1:35', 's2:65']);

  execute();
  await clock.tickAsync(minDelay);
  expect(Date.now()).to.equal(debounceDelay + 3 * minDelay);

  expect(log).to.deep.equal(['s0:5', 's1:35', 's2:65', 'f0:95', 's3:95']);

  await clock.tickAsync(minDelay);
  expect(Date.now()).to.equal(4 * minDelay + debounceDelay);

  expect(log).to.deep.equal([
    's0:5',
    's1:35',
    's2:65',
    'f0:95',
    's3:95',
    'f1:125',
  ]);

  await clock.tickAsync(minDelay);
  expect(Date.now()).to.equal(5 * minDelay + debounceDelay);

  expect(log).to.deep.equal([
    's0:5',
    's1:35',
    's2:65',
    'f0:95',
    's3:95',
    'f1:125',
    'f2:155',
  ]);

  await clock.tickAsync(minDelay);
  expect(Date.now()).to.equal(6 * minDelay + debounceDelay);

  expect(log).to.deep.equal([
    's0:5',
    's1:35',
    's2:65',
    'f0:95',
    's3:95',
    'f1:125',
    'f2:155',
    'f3:185',
  ]);

  await clock.runAllAsync();
  await waitForAll();
});

test('maxConnections 1', async () => {
  const debounceDelay = 5;
  const maxConnections = 1;
  const requestTime = 90;

  createLoop({
    requestTime,
    debounceDelay,
    maxConnections,
  });

  execute();
  await clock.runToLastAsync();

  expect(log).to.deep.equal(['s0:5']);

  execute();
  await clock.tickAsync(requestTime);

  expect(log).to.deep.equal(['s0:5', 'f0:95', 's1:95']);

  execute();
  await clock.tickAsync(requestTime);

  expect(log).to.deep.equal(['s0:5', 'f0:95', 's1:95', 'f1:185', 's2:185']);

  await clock.tickAsync(requestTime);

  expect(log).to.deep.equal([
    's0:5',
    'f0:95',
    's1:95',
    'f1:185',
    's2:185',
    'f2:275',
  ]);

  await clock.runAllAsync();
  await waitForAll();
});

test('Adjust delay', async () => {
  const debounceDelay = 5;
  const maxConnections = 3;
  const requestTimes = [100, 200, 150];
  let i = 0;

  createLoop({
    get requestTime() {
      const t = requestTimes[i];
      i = (i + 1) % requestTimes.length;
      return t;
    },
    debounceDelay,
    maxConnections,
  });

  // reset
  i = 0;

  // 0
  execute();
  await clock.runToLastAsync();

  // 1
  execute();
  await clock.tickAsync(30);

  // 2
  execute();
  await clock.tickAsync(30);

  // 3
  execute();
  await clock.tickAsync(50);

  expect(log).to.deep.equal(['s0:5', 's1:35', 's2:65', 'f0:105', 's3:105']);

  // 4
  execute();
  await clock.tickAsync(50);

  // 5
  execute();
  await clock.tickAsync(50);

  // 6
  execute();
  await clock.tickAsync(50);

  await clock.runAllAsync();
  expect(log).to.deep.equal([
    's0:5',
    's1:35',
    's2:65',
    'f0:105',
    's3:105',
    'f3:205',
    's4:205',
    'f2:215',
    'f1:235',
    's5:238',
    's6:279',
    'f6:379',
    'f5:388',
    'f4:405',
  ]);
  await waitForAll();
});

test('error', async () => {
  const debounceDelay = 5;
  const maxConnections = 3;
  const requestTime = 90;
  let i = 0;

  createLoop({
    get shouldError() {
      const e = i > 2 && i < 17;
      i++;
      return e;
    },
    debounceDelay,
    requestTime,
    maxConnections,
  });

  // reset
  i = 0;

  for (let i = 0; i < 25; i++) {
    execute().catch(() => 0);
    await clock.tickAsync(30);
  }

  await clock.tickAsync(302375 - requestTime - Date.now());

  for (let i = 0; i < 5; i++) {
    execute();
    await clock.tickAsync(30);
  }

  await clock.runAllAsync();

  expect(log).to.deep.equal([
    's0:5',
    's1:35',
    's2:65',
    'f0:95',
    's3:95',
    'f1:125',
    's4:125',
    'f2:155',
    's5:155',
    'e3:185',
    'e4:215',
    'e5:245',
    's6:335',
    'e6:425',
    's7:905',
    'e7:995',
    's8:1955',
    'e8:2045',
    's9:3965',
    'e9:4055',
    's10:7895',
    'e10:7985',
    's11:15665',
    'e11:15755',
    's12:31115',
    'e12:31205',
    's13:61925',
    'e13:62015',
    's14:122015',
    'e14:122105',
    's15:182105',
    'e15:182195',
    's16:242195',
    'e16:242285',
    's17:302285',
    'f17:302375', // first success
    's18:302375', // now we go back to 3 concurrent connections
    's19:302405',
    's20:302435',
    'f18:302465',
    'f19:302495',
    'f20:302525',
  ]);
});

test('resolve order', async () => {
  createLoop({
    requestTime: 50,
  });

  const plog: string[] = [];
  execute().then(() => plog.push('A'));
  execute().then(() => plog.push('B'));
  execute().then(() => plog.push('C'));

  await clock.tickAsync(40);

  execute().then(() => plog.push('D'));
  execute().then(() => plog.push('E'));
  execute().then(() => plog.push('F'));

  await clock.runAllAsync();

  expect(plog).to.deep.equal(['A', 'B', 'C', 'D', 'E', 'F']);
  expect(log).to.deep.equal(['s0:10', 's1:50', 'f0:60', 'f1:100']);
});
