// NodeJS does not have fetch
import fetch from 'node-fetch';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).fetch = fetch;

import {ReadableStream} from 'web-streams-polyfill';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).ReadableStream = ReadableStream;

import {open} from 'fs/promises';
import type {FileHandle} from 'fs/promises';

import {ReplicacheTest, httpStatusUnauthorized} from './replicache.js';
import {RepmHttpInvoker} from './mod.js';

import type {RepmInvoke, ReadTransaction, WriteTransaction} from './mod.js';
import type {JsonType} from './json.js';
import type {
  InvokeMapNoArgs,
  InvokeMap,
  FullInvoke,
  BeginSyncResponse,
} from './repm-invoker.js';
import type {ScanItem} from './scan-item.js';

let rep: ReplicacheTest | null = null;
let rep2: ReplicacheTest | null = null;

type ReplayResult = JsonType;

type Replay = {
  method: string;
  dbName: string;
  args: JsonType;
  result: ReplayResult;
};

type ReplayInput = Omit<Replay, 'result'>;

function replayMatches(
  r: Replay,
  dbName: string,
  method: string,
  args: JsonType,
): boolean {
  return (
    r.method === method &&
    r.dbName === dbName &&
    JSON.stringify(r.args) === JSON.stringify(args)
  );
}

let fixtureFile: FileHandle | undefined;
let replays: Replay[];

async function useReplay(name: string): Promise<void> {
  function ff() {
    return open(
      `${__dirname}/fixtures/${name}.json`,
      testMode === 'record' ? 'w' : 'r',
    );
  }

  switch (testMode) {
    case 'replay': {
      fixtureFile = await ff();
      const replaysString = await fixtureFile.readFile({encoding: 'utf-8'});
      if (replaysString.length === 0) {
        replays = [];
      } else {
        replays = JSON.parse(replaysString);
      }
      break;
    }
    case 'record':
      fixtureFile = await ff();
      replays = [];
      break;
    case 'live':
      break;
  }
}

const resultReplacements: {
  matcher: (replay: ReplayInput) => boolean;
  result: ReplayResult;
}[] = [];

function addResultReplacement(
  matcher: (replay: ReplayInput) => boolean,
  result: ReplayResult,
) {
  if (testMode !== 'replay') {
    // We already store the replacements in the json.
    resultReplacements.push({matcher, result});
  }
}

function maybeReplaceResult(replay: ReplayInput): ReplayResult | undefined {
  const i = resultReplacements.findIndex(({matcher}) => matcher(replay));
  if (i === -1) {
    return undefined;
  }
  const {result} = resultReplacements[i];
  resultReplacements.splice(i, 1);
  return result;
}

function invokeMock(invoke: FullInvoke): FullInvoke {
  return async (...args: Parameters<FullInvoke>) => {
    const [dbName, method, args2 = {}] = args;
    const mockResult = maybeReplaceResult({dbName, method, args: args2});
    let result: ReplayResult;
    if (mockResult !== undefined) {
      result = mockResult;
    } else {
      result = await invoke(dbName, method, args2);
    }
    return result;
  };
}

const httpInvoker = new RepmHttpInvoker('http://localhost:7002');
const httpInvoke: FullInvoke = invokeMock(httpInvoker.invoke.bind(httpInvoker));

function delay(ms: number): Promise<void> {
  return new Promise(res => {
    setTimeout(res, ms);
  });
}

function recordInvoke<Rpc extends keyof InvokeMapNoArgs>(
  dbName: string,
  rpc: Rpc,
): Promise<InvokeMapNoArgs[Rpc]>;
function recordInvoke<Rpc extends keyof InvokeMap>(
  dbName: string,
  rpc: Rpc,
  args: InvokeMap[Rpc][0],
): Promise<InvokeMap[Rpc][1]>;
async function recordInvoke(
  dbName: string,
  rpc: string,
  args: JsonType = {},
): Promise<JsonType> {
  expect(fixtureFile).toBeTruthy();
  const result = await httpInvoke(dbName, rpc, args);
  replays.push({dbName, method: rpc, args, result});
  return result;
}

async function replayInvoke<Rpc extends keyof InvokeMapNoArgs>(
  dbName: string,
  rpc: Rpc,
): Promise<InvokeMapNoArgs[Rpc]>;
async function replayInvoke<Rpc extends keyof InvokeMap>(
  dbName: string,
  rpc: Rpc,
  args: InvokeMap[Rpc][0],
): Promise<InvokeMap[Rpc][1]>;
async function replayInvoke(
  dbName: string,
  rpc: string,
  args: JsonType = {},
): Promise<JsonType> {
  expect(fixtureFile).toBeTruthy();
  expect(replays).toBeDefined();

  const i = replays.findIndex(r => replayMatches(r, dbName, rpc, args));
  expect(i).not.toBe(-1);

  const replay = replays[i];
  replays.splice(i, 1);
  // A microtask is not sufficient to emulate the RPC. We need to go to the
  // event loop.
  await delay(0);
  return replay.result;
}

let invoke: RepmInvoke = httpInvoke;

type TestMode = 'live' | 'replay' | 'record';

let testMode: TestMode;
const testModeDefault = 'replay';

switch (process.env['TEST_MODE'] ?? testModeDefault) {
  case 'replay':
    testMode = 'replay';
    invoke = replayInvoke;
    break;
  case 'live':
    testMode = 'live';
    invoke = httpInvoke;
    break;
  case 'record':
    testMode = 'record';
    invoke = recordInvoke;
    break;
  default:
    fail('Unexpected TEST_MODE');
}

async function replicacheForTesting(
  name: string,
  {
    diffServerUrl = 'https://serve.replicache.dev/pull',
    dataLayerAuth = '',
    diffServerAuth = '',
    batchUrl = '',
  }: {
    diffServerUrl?: string;
    dataLayerAuth?: string;
    diffServerAuth?: string;
    batchUrl?: string;
  } = {},
): Promise<ReplicacheTest> {
  return await ReplicacheTest.new({
    batchUrl,
    dataLayerAuth,
    diffServerAuth,
    diffServerUrl,
    name,
    repmInvoke: invoke,
  });
}

async function addData(tx: WriteTransaction, data: {[key: string]: JsonType}) {
  for (const [key, value] of Object.entries(data)) {
    await tx.put(key, value);
  }
}

function resolver(): {resolve: () => void; promise: Promise<void>} {
  let res: () => void;
  const promise = new Promise<void>(r => {
    res = r;
  });
  return {
    resolve: () => res(),
    promise,
  };
}

const emptyHash = '00000000000000000000000000000000';

beforeEach(async () => {
  if (testMode !== 'replay') {
    const dbs = await ReplicacheTest.list({repmInvoke: httpInvoke});
    for (const info of dbs) {
      await ReplicacheTest.drop(info.name, {repmInvoke: httpInvoke});
    }
  }
});

afterEach(async () => {
  // _closeTransaction is async but we do not wait for it which can lead to
  // us closing the db before the tx is done. For the tests we do not want
  // these errors.
  await delay(300);

  if (rep !== null && !rep.closed) {
    await rep.close();
    rep = null;
  }
  if (rep2 !== null && !rep2.closed) {
    await rep2.close();
    rep2 = null;
  }

  if (testMode === 'record') {
    if (!fixtureFile) fail();
    await fixtureFile.writeFile(JSON.stringify(replays, null, 2), 'utf-8');
  }

  replays = [];
  if (fixtureFile) {
    await fixtureFile.close();
    fixtureFile = undefined;
  }

  expect(resultReplacements).toHaveLength(0);
});

test('list and drop', async () => {
  await useReplay('list and drop');

  rep = await replicacheForTesting('def');
  rep2 = await replicacheForTesting('abc');

  const dbs = await ReplicacheTest.list({repmInvoke: invoke});
  expect(dbs).toEqual([{name: 'abc'}, {name: 'def'}]);

  {
    await ReplicacheTest.drop('abc', {repmInvoke: invoke});
    const dbs = await ReplicacheTest.list({repmInvoke: invoke});
    expect(dbs).toEqual([{name: 'def'}]);
  }
});

test('get, has, scan on empty db', async () => {
  await useReplay('get, has, scan on empty db');

  rep = await replicacheForTesting('test2');

  async function t(tx: ReadTransaction) {
    expect(await tx.get('key')).toBeUndefined();
    expect(await tx.has('key')).toBe(false);

    const scanItems = await tx.scan();
    expect(scanItems).toHaveLength(0);
  }

  await t(rep);
  await rep.query(t);
});

test('put, get, has, del inside tx', async () => {
  await useReplay('put, get, has, del inside tx');

  rep = await replicacheForTesting('test3');
  const mut = rep.register(
    'mut',
    async (tx: WriteTransaction, args: {key: string; value: JsonType}) => {
      const key = args['key'];
      const value = args['value'];
      await tx.put(key, value);
      expect(await tx.has(key)).toBe(true);
      const v = await tx.get(key);
      expect(v).toEqual(value);

      expect(await tx.del(key)).toBe(true);
      expect(await tx.has(key)).toBe(false);
    },
  );

  for (const [key, value] of Object.entries({
    a: true,
    b: false,
    c: null,
    d: 'string',
    e: 12,
    f: {},
    g: [],
    h: {h1: true},
    i: [0, 1],
  })) {
    await mut({key, value});
  }
});

test('scan', async () => {
  await useReplay('scan');

  rep = await replicacheForTesting('test4');
  const add = rep.register('add-data', addData);
  await add({
    'a/0': 0,
    'a/1': 1,
    'a/2': 2,
    'a/3': 3,
    'a/4': 4,
    'b/0': 5,
    'b/1': 6,
    'b/2': 7,
    'c/0': 8,
  });

  expect(await rep.scan()).toEqual([
    {key: 'a/0', value: 0},
    {key: 'a/1', value: 1},
    {key: 'a/2', value: 2},
    {key: 'a/3', value: 3},
    {key: 'a/4', value: 4},
    {key: 'b/0', value: 5},
    {key: 'b/1', value: 6},
    {key: 'b/2', value: 7},
    {key: 'c/0', value: 8},
  ]);

  expect(await rep?.scan({prefix: 'a'})).toEqual([
    {key: 'a/0', value: 0},
    {key: 'a/1', value: 1},
    {key: 'a/2', value: 2},
    {key: 'a/3', value: 3},
    {key: 'a/4', value: 4},
  ]);

  expect(await rep?.scan({prefix: 'b'})).toEqual([
    {key: 'b/0', value: 5},
    {key: 'b/1', value: 6},
    {key: 'b/2', value: 7},
  ]);

  expect(await rep?.scan({prefix: 'c/'})).toEqual([{key: 'c/0', value: 8}]);

  expect(await rep?.scan({limit: 3})).toEqual([
    {key: 'a/0', value: 0},
    {key: 'a/1', value: 1},
    {key: 'a/2', value: 2},
  ]);

  expect(
    await rep?.scan({
      start: {id: {value: 'a/1', exclusive: false}},
      limit: 2,
    }),
  ).toEqual([
    {key: 'a/1', value: 1},
    {key: 'a/2', value: 2},
  ]);

  expect(
    await rep?.scan({
      start: {id: {value: 'a/1', exclusive: true}},
      limit: 2,
    }),
  ).toEqual([
    {key: 'a/2', value: 2},
    {key: 'a/3', value: 3},
  ]);

  expect(
    await rep?.scan({
      start: {id: {exclusive: false}, index: 1},
      limit: 2,
    }),
  ).toEqual([
    {key: 'a/1', value: 1},
    {key: 'a/2', value: 2},
  ]);
});

function listen<R>(
  s: {getReader: ReadableStream['getReader']},
  callback: (r: R) => void,
) {
  let cancelled = false;
  let paused = false;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  let onDone = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  let onError: (e: unknown) => void = () => {};

  async function inner<R>(
    s: {getReader: ReadableStream['getReader']},
    callback: (r: R) => void,
  ) {
    const reader = s.getReader();
    try {
      for (;;) {
        const res = await reader.read();
        if (cancelled || res.done) {
          return;
        }
        if (!paused) {
          callback(res.value);
        }
      }
    } catch (e) {
      onError(e);
    } finally {
      reader.releaseLock();
      onDone();
    }
  }

  inner(s, callback);

  return {
    cancel() {
      cancelled = true;
    },
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    onDone(f: () => void) {
      onDone = f;
    },
    onError(f: (e: unknown) => void) {
      onError = f;
    },
  };
}

test('subscribe', async () => {
  await useReplay('subscribe');

  rep = await replicacheForTesting('subscribe');
  const repSub = rep.subscribe(
    async (tx: ReadTransaction) => await tx.scan({prefix: 'a/'}),
  );

  const log: ScanItem[] = [];

  const sub = listen(repSub, (values: Iterable<ScanItem>) => {
    for (const scanItem of values) {
      log.push(scanItem);
    }
  });

  expect(log).toHaveLength(0);

  const add = rep.register('add-data', addData);
  await add({'a/0': 0});
  await Promise.resolve();
  expect(log).toEqual([{key: 'a/0', value: 0}]);

  // We might potentially remove this entry if we start checking equality.
  log.length = 0;
  await add({'a/0': 0});
  await Promise.resolve();
  expect(log).toEqual([{key: 'a/0', value: 0}]);

  log.length = 0;
  await add({'a/1': 1});
  await Promise.resolve();
  expect(log).toEqual([
    {key: 'a/0', value: 0},
    {key: 'a/1', value: 1},
  ]);

  log.length = 0;
  sub.pause();
  await add({'a/1': 1});
  await Promise.resolve();
  expect(log).toHaveLength(0);

  log.length = 0;
  sub.resume();
  await add({'a/1': 11});
  await Promise.resolve();
  expect(log).toEqual([
    {key: 'a/0', value: 0},
    {key: 'a/1', value: 11},
  ]);

  log.length = 0;
  sub.cancel();
  await add({'a/1': 11});
  await Promise.resolve();
  expect(log).toHaveLength(0);
});

test('subscribe close', async () => {
  await useReplay('subscribe close');

  rep = await replicacheForTesting('subscribe-close');
  const repSub = rep.subscribe((tx: ReadTransaction) => tx.get('k'));

  const log: (number | undefined)[] = [];
  const sub = listen(repSub, (value: number | undefined) => {
    log.push(value);
  });

  expect(log).toHaveLength(0);

  const add = rep.register('add-data', addData);
  await add({k: 0});
  await Promise.resolve();
  expect(log).toEqual([undefined, 0]);

  let done = false;
  sub.onDone(() => {
    done = true;
  });

  await rep.close();
  expect(done).toBe(true);
  sub.cancel();
});

test('name', async () => {
  await useReplay('name');

  const repA = await replicacheForTesting('a');
  const repB = await replicacheForTesting('b');

  const addA = repA.register('add-data', addData);
  const addB = repB.register('add-data', addData);

  await addA({key: 'A'});
  await addB({key: 'B'});

  expect(await repA.get('key')).toBe('A');
  expect(await repB.get('key')).toBe('B');

  await repA.close();
  await repB.close();
});

test('register with error', async () => {
  await useReplay('register with error');

  rep = await replicacheForTesting('regerr');

  const doErr = rep.register('err', async (_, args) => {
    throw args;
  });

  try {
    await doErr(42);
    fail('Should have thrown');
  } catch (ex) {
    expect(ex).toBe(42);
  }
});

test('subscribe with error', async () => {
  await useReplay('subscribe with error');

  rep = await replicacheForTesting('suberr');

  const add = rep.register('add-data', addData);

  const repSub = rep.subscribe(async tx => {
    const v = await tx.get('k');
    if (v !== undefined && v !== null) {
      throw v;
    }
  });
  await Promise.resolve();

  let gottenValue = 0;
  const sub = listen(repSub, () => {
    gottenValue++;
  });

  let error;
  sub.onError(e => {
    error = e;
  });

  expect(error).toBeUndefined();
  expect(gottenValue).toBe(0);

  await add({k: 'throw'});
  expect(gottenValue).toBe(1);
  await Promise.resolve();
  expect(error).toBe('throw');

  await sub.cancel();
});

test('conflicting commits', async () => {
  await useReplay('conflicting commits');

  // This test does not use pure functions in the mutations. This is of course
  // not a good practice but it makes testing easier.
  const ar = resolver();
  const br = resolver();

  rep = await replicacheForTesting('conflict');
  const mutA = rep.register('mutA', async (tx, v) => {
    await tx.put('k', v);
    await ar.promise;
  });
  const mutB = rep.register('mutB', async (tx, v) => {
    await tx.put('k', v);
    await br.promise;
  });

  // Start A and B at the same commit.
  const resAFuture = mutA('a');
  const resBFuture = mutB('b');

  // Finish A.
  ar.resolve();
  await resAFuture;
  expect(await rep.get('k')).toBe('a');

  // Finish B. B will conflict and retry!
  br.resolve();
  await resBFuture;
  expect(await rep.get('k')).toBe('b');
});

test('sync', async () => {
  await useReplay('sync');

  rep = await replicacheForTesting('sync', {
    batchUrl: 'https://replicache-sample-todo.now.sh/serve/replicache-batch',
    dataLayerAuth: '1',
    diffServerAuth: '1',
  });

  const c = resolver();
  c.resolve();

  let createCount = 0;
  let deleteCount = 0;
  let syncHead: string;
  let beginSyncResult: {
    syncID: string;
    syncHead: string;
  };

  const createTodo = rep.register(
    'createTodo',
    async <A extends {id: number}>(tx: WriteTransaction, args: A) => {
      createCount++;
      await tx.put(`/todo/${args.id}`, args);
    },
  );

  const deleteTodo = rep.register(
    'deleteTodo',
    async <A extends {id: number}>(tx: WriteTransaction, args: A) => {
      deleteCount++;
      await tx.del(`/todo/${args.id}`);
    },
  );

  const id1 = 14323534;
  const id2 = 22354345;

  await deleteTodo({id: id1});
  await deleteTodo({id: id2});

  expect(deleteCount).toBe(2);

  await rep?.sync();
  expect(deleteCount).toBe(2);

  beginSyncResult = await rep?.beginSync();
  syncHead = beginSyncResult.syncHead;
  expect(syncHead).toBe(emptyHash);
  expect(deleteCount).toBe(2);

  await createTodo({
    id: id1,
    listId: 1,
    text: 'Test',
    complete: false,
    order: 10000,
  });
  expect(createCount).toBe(1);
  expect(((await rep?.get(`/todo/${id1}`)) as {text: string}).text).toBe(
    'Test',
  );

  beginSyncResult = await rep?.beginSync();
  syncHead = beginSyncResult.syncHead;
  expect(syncHead).not.toBe(emptyHash);

  await createTodo({
    id: id2,
    listId: 1,
    text: 'Test 2',
    complete: false,
    order: 20000,
  });
  expect(createCount).toBe(2);
  expect(((await rep?.get(`/todo/${id2}`)) as {text: string}).text).toBe(
    'Test 2',
  );

  await rep?.maybeEndSync(beginSyncResult);

  expect(createCount).toBe(3);

  // Clean up
  await deleteTodo({id: id1});
  await deleteTodo({id: id2});

  expect(deleteCount).toBe(4);
  expect(createCount).toBe(3);

  await rep?.sync();

  expect(deleteCount).toBe(4);
  expect(createCount).toBe(3);
});

test('reauth', async () => {
  await useReplay('reauth');

  addResultReplacement(({method}) => method === 'beginSync', {
    syncHead: '62f6ki43l12mujhubcfhjuugiause17b',
    syncInfo: {
      syncID: 'XY6WhbbdeUdytMJNtsBejG-5ed87fed-1',
      clientViewInfo: {
        httpStatusCode: httpStatusUnauthorized,
        errorMessage: 'xxx',
      },
    },
  } as BeginSyncResponse);

  rep = await replicacheForTesting('reauth');

  rep.getDataLayerAuth = jest.fn(() => {
    return null;
  });

  await rep.beginSync();

  expect(rep.getDataLayerAuth).toBeCalledTimes(1);
});
