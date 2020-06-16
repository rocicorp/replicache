// NodeJS does not have fetch
import fetch from 'node-fetch';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).fetch = fetch;

import {open} from 'fs/promises';
import type {FileHandle} from 'fs/promises';

import {ReplicacheTest, httpStatusUnauthorized} from './replicache.js';
import {REPMHTTPInvoker, ScanBound} from './mod.js';
import {
  restoreScanPageSizeForTesting,
  setScanPageSizeForTesting,
} from './transactions.js';

import type {REPMInvoke, ReadTransaction, WriteTransaction} from './mod.js';
import type {JSONValue, ToJSON} from './json.js';
import type {
  InvokeMapNoArgs,
  InvokeMap,
  BeginSyncResponse,
} from './repm-invoker.js';

let rep: ReplicacheTest | null = null;
let rep2: ReplicacheTest | null = null;

type ReplayResult = JSONValue;

type Replay = {
  method: string;
  dbName: string;
  args: JSONValue | ToJSON;
  result: ReplayResult;
};

type ReplayInput = Omit<Replay, 'result'>;

function replayMatches(
  r: Replay,
  dbName: string,
  method: string,
  args: JSONValue,
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

function invokeMock(invoke: REPMInvoke): REPMInvoke {
  return async (...args: Parameters<REPMInvoke>) => {
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

const httpInvoker = new REPMHTTPInvoker('http://localhost:7002');
const httpInvoke: REPMInvoke = invokeMock(httpInvoker.invoke);

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
  args: JSONValue = {},
): Promise<JSONValue> {
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
  args: JSONValue = {},
): Promise<JSONValue> {
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

let invoke: REPMInvoke = httpInvoke;

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
    diffServerURL = 'https://serve.replicache.dev/pull',
    dataLayerAuth = '',
    diffServerAuth = '',
    batchURL = '',
  }: {
    diffServerURL?: string;
    dataLayerAuth?: string;
    diffServerAuth?: string;
    batchURL?: string;
  } = {},
): Promise<ReplicacheTest> {
  return await ReplicacheTest.new({
    batchURL,
    dataLayerAuth,
    diffServerAuth,
    diffServerURL,
    name,
    repmInvoke: invoke,
  });
}

async function addData(tx: WriteTransaction, data: {[key: string]: JSONValue}) {
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

async function asyncIterableToArray<T>(it: AsyncIterable<T>) {
  const arr: T[] = [];
  for await (const v of it) {
    arr.push(v);
  }
  return arr;
}

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

beforeAll(() => {
  setScanPageSizeForTesting(4);
});

afterAll(() => {
  restoreScanPageSizeForTesting();
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

    const scanItems = await asyncIterableToArray(tx.scan());
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
    async (tx: WriteTransaction, args: {key: string; value: JSONValue}) => {
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

  async function testScanResult<K, V>(
    options: {prefix?: string; start?: ScanBound} | undefined,
    entries: [K, V][],
  ) {
    if (!rep) {
      fail();
    }

    await rep.query(async tx => {
      expect(await asyncIterableToArray(tx.scan(options).entries())).toEqual(
        entries,
      );
    });

    await rep.query(async tx => {
      expect(await asyncIterableToArray(tx.scan(options))).toEqual(
        entries.map(([, v]) => v),
      );
    });

    await rep.query(async tx => {
      expect(await asyncIterableToArray(tx.scan(options).values())).toEqual(
        entries.map(([, v]) => v),
      );
    });

    await rep.query(async tx => {
      expect(await asyncIterableToArray(tx.scan(options).keys())).toEqual(
        entries.map(([k]) => k),
      );
    });
  }

  await testScanResult(undefined, [
    ['a/0', 0],
    ['a/1', 1],
    ['a/2', 2],
    ['a/3', 3],
    ['a/4', 4],
    ['b/0', 5],
    ['b/1', 6],
    ['b/2', 7],
    ['c/0', 8],
  ]);

  await testScanResult({prefix: 'a'}, [
    ['a/0', 0],
    ['a/1', 1],
    ['a/2', 2],
    ['a/3', 3],
    ['a/4', 4],
  ]);

  await testScanResult({prefix: 'b'}, [
    ['b/0', 5],
    ['b/1', 6],
    ['b/2', 7],
  ]);

  await testScanResult({prefix: 'c/'}, [['c/0', 8]]);

  await testScanResult(
    {
      start: {id: {value: 'b/1', exclusive: false}},
    },
    [
      ['b/1', 6],
      ['b/2', 7],
      ['c/0', 8],
    ],
  );

  await testScanResult(
    {
      start: {id: {value: 'b/1', exclusive: true}},
    },
    [
      ['b/2', 7],
      ['c/0', 8],
    ],
  );

  await testScanResult(
    {
      start: {index: 6},
    },
    [
      ['b/1', 6],
      ['b/2', 7],
      ['c/0', 8],
    ],
  );
});

test('subscribe', async () => {
  await useReplay('subscribe');

  const log: [string, JSONValue][] = [];

  rep = await replicacheForTesting('subscribe');
  const cancel = rep.subscribe(
    async (tx: ReadTransaction) => {
      const rv = [];
      for await (const entry of tx.scan({prefix: 'a/'}).entries()) {
        rv.push(entry);
      }
      return rv;
    },
    {
      onData: (values: Iterable<[string, JSONValue]>) => {
        for (const entry of values) {
          log.push(entry);
        }
      },
    },
  );

  expect(log).toHaveLength(0);

  const add = rep.register('add-data', addData);
  await add({'a/0': 0});
  await delay(0);
  expect(log).toEqual([['a/0', 0]]);

  // We might potentially remove this entry if we start checking equality.
  log.length = 0;
  await add({'a/0': 0});
  await delay(0);
  expect(log).toEqual([['a/0', 0]]);

  log.length = 0;
  await add({'a/1': 1});
  await delay(0);
  expect(log).toEqual([
    ['a/0', 0],
    ['a/1', 1],
  ]);

  log.length = 0;
  log.length = 0;
  await add({'a/1': 11});
  await delay(0);
  expect(log).toEqual([
    ['a/0', 0],
    ['a/1', 11],
  ]);

  log.length = 0;
  cancel();
  await add({'a/1': 11});
  await Promise.resolve();
  expect(log).toHaveLength(0);
});

test('subscribe close', async () => {
  await useReplay('subscribe close');

  rep = await replicacheForTesting('subscribe-close');

  const log: (JSONValue | undefined)[] = [];

  const cancel = rep.subscribe((tx: ReadTransaction) => tx.get('k'), {
    onData: value => log.push(value),
    onDone: () => (done = true),
  });

  expect(log).toHaveLength(0);

  const add = rep.register('add-data', addData);
  await add({k: 0});
  await Promise.resolve();
  expect(log).toEqual([undefined, 0]);

  let done = false;

  await rep.close();
  expect(done).toBe(true);
  cancel();
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

  let gottenValue = 0;
  let error;

  const cancel = rep.subscribe(
    async tx => {
      const v = await tx.get('k');
      if (v !== undefined && v !== null) {
        throw v;
      }
    },
    {
      onData: () => {
        gottenValue++;
      },
      onError: e => {
        error = e;
      },
    },
  );
  await Promise.resolve();

  expect(error).toBeUndefined();
  expect(gottenValue).toBe(0);

  await add({k: 'throw'});
  expect(gottenValue).toBe(1);
  await Promise.resolve();
  expect(error).toBe('throw');

  cancel();
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
    batchURL: 'https://replicache-sample-todo.now.sh/serve/replicache-batch',
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
