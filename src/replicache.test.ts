import {ReplicacheTest, httpStatusUnauthorized} from './replicache.js';
import Replicache, {TransactionClosedError} from './mod.js';

import type {ReadTransaction, WriteTransaction} from './mod.js';
import {deepEqual, JSONValue} from './json.js';

import {assert, expect} from '@esm-bundle/chai';
import * as sinon from 'sinon';
import type {SinonSpy} from 'sinon';

// fetch-mock has invalid d.ts file so we removed that on npm install.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import fetchMock from 'fetch-mock/esm/client.js';
import type {Invoke} from './repm-invoker.js';
import type {ScanOptions} from './scan-options.js';

const {fail} = assert;

let rep: ReplicacheTest | null = null;
let rep2: ReplicacheTest | null = null;

// Silence console. Too much noise!
const {warn} = console;
console.warn = (...args: Parameters<Console['warn']>) => {
  if (args[0] !== 'Connection loop recv failed: The channel is empty.') {
    warn.apply(console, args);
  }
};
console.log = console.info = console.group = console.groupEnd = () => void 0;

async function replicacheForTesting(
  name: string,
  {
    diffServerURL = '',
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
  dbsToDrop.add(name);
  return await ReplicacheTest.new({
    batchURL,
    dataLayerAuth,
    diffServerAuth,
    diffServerURL,
    name,
  });
}

const dbsToDrop = new Set<string>();

async function addData(tx: WriteTransaction, data: {[key: string]: JSONValue}) {
  for (const [key, value] of Object.entries(data)) {
    await tx.put(key, value);
  }
}

async function delData(tx: WriteTransaction, data: string | string[]) {
  if (Array.isArray(data)) {
    data = [data];
  }
  for (const key of data) {
    await tx.del(key);
  }
}

const emptyHash = '';

async function asyncIterableToArray<T>(it: AsyncIterable<T>) {
  const arr: T[] = [];
  for await (const v of it) {
    arr.push(v);
  }
  return arr;
}

function spyInvoke(
  rep: Replicache,
): SinonSpy<Parameters<Invoke>, ReturnType<Invoke>> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return sinon.spy(rep, '_invoke');
}

teardown(async () => {
  fetchMock.restore();
  sinon.restore();

  if (rep !== null && !rep.closed) {
    await rep.close();
    rep = null;
  }
  if (rep2 !== null && !rep2.closed) {
    await rep2.close();
    rep2 = null;
  }

  for (const name of dbsToDrop) {
    indexedDB.deleteDatabase(name);
  }
  dbsToDrop.clear();
});

async function expectPromiseToReject(p: unknown): Promise<Chai.Assertion> {
  let e;
  try {
    await p;
  } catch (ex) {
    e = ex;
  }
  return expect(e);
}

async function expectAsyncFuncToThrow(f: () => unknown, c: unknown) {
  (await expectPromiseToReject(f())).to.be.instanceof(c);
}

test('get, has, scan on empty db', async () => {
  rep = await replicacheForTesting('test2');
  async function t(tx: ReadTransaction) {
    expect(await tx.get('key')).to.equal(undefined);
    expect(await tx.has('key')).to.be.false;

    const scanItems = await asyncIterableToArray(tx.scan());
    expect(scanItems).to.have.length(0);
  }

  await t(rep);
});

test('put, get, has, del inside tx', async () => {
  rep = await replicacheForTesting('test3');
  const mut = rep.register(
    'mut',
    async (tx: WriteTransaction, args: {key: string; value: JSONValue}) => {
      const key = args['key'];
      const value = args['value'];
      await tx.put(key, value);
      expect(await tx.has(key)).to.equal(true);
      const v = await tx.get(key);
      expect(v).to.eql(value);

      expect(await tx.del(key)).to.equal(true);
      expect(await tx.has(key)).to.be.false;
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
    await mut({key, value: value as JSONValue});
  }
});

async function testScanResult<K, V>(
  options: ScanOptions | undefined,
  entries: [K, V][],
) {
  if (!rep) {
    fail();
    return;
  }

  await rep.query(async tx => {
    expect(await asyncIterableToArray(tx.scan(options).entries())).to.eql(
      entries,
    );
  });

  await rep.query(async tx => {
    expect(await asyncIterableToArray(tx.scan(options))).to.eql(
      entries.map(([, v]) => v),
    );
  });

  await rep.query(async tx => {
    expect(await asyncIterableToArray(tx.scan(options).values())).to.eql(
      entries.map(([, v]) => v),
    );
  });

  await rep.query(async tx => {
    expect(await asyncIterableToArray(tx.scan(options).keys())).to.eql(
      entries.map(([k]) => k),
    );
  });
}

test('scan', async () => {
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
      start: {key: 'b/1', exclusive: false},
    },
    [
      ['b/1', 6],
      ['b/2', 7],
      ['c/0', 8],
    ],
  );

  await testScanResult(
    {
      start: {key: 'b/1'},
    },
    [
      ['b/1', 6],
      ['b/2', 7],
      ['c/0', 8],
    ],
  );

  await testScanResult(
    {
      start: {key: 'b/1', exclusive: true},
    },
    [
      ['b/2', 7],
      ['c/0', 8],
    ],
  );

  await testScanResult(
    {
      limit: 3,
    },
    [
      ['a/0', 0],
      ['a/1', 1],
      ['a/2', 2],
    ],
  );

  await testScanResult(
    {
      limit: 10,
      prefix: 'a/',
    },
    [
      ['a/0', 0],
      ['a/1', 1],
      ['a/2', 2],
      ['a/3', 3],
      ['a/4', 4],
    ],
  );

  await testScanResult(
    {
      limit: 1,
      prefix: 'b/',
    },
    [['b/0', 5]],
  );
});

test('subscribe', async () => {
  const log: [string, JSONValue][] = [];

  rep = await replicacheForTesting('subscribe');
  let queryCallCount = 0;
  const cancel = rep.subscribe(
    async (tx: ReadTransaction) => {
      queryCallCount++;
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

  expect(log).to.have.length(0);
  expect(queryCallCount).to.equal(0);

  const add = rep.register('add-data', addData);
  await add({'a/0': 0});
  expect(log).to.eql([['a/0', 0]]);
  expect(queryCallCount).to.equal(2); // One for initial subscribe and one for the add.

  // The body returns the same JSON value in the following case.
  log.length = 0;
  await add({'a/0': 0});
  expect(log).to.eql([]);
  expect(queryCallCount).to.equal(3);

  log.length = 0;
  await add({'a/1': 1});
  expect(log).to.eql([
    ['a/0', 0],
    ['a/1', 1],
  ]);
  expect(queryCallCount).to.equal(4);

  log.length = 0;
  log.length = 0;
  await add({'a/1': 11});
  expect(log).to.eql([
    ['a/0', 0],
    ['a/1', 11],
  ]);
  expect(queryCallCount).to.equal(5);

  log.length = 0;
  cancel();
  await add({'a/1': 11});
  await Promise.resolve();
  expect(log).to.have.length(0);
  expect(queryCallCount).to.equal(5);
});

test('subscribe close', async () => {
  rep = await replicacheForTesting('subscribe-close');

  const log: (JSONValue | undefined)[] = [];

  const cancel = rep.subscribe((tx: ReadTransaction) => tx.get('k'), {
    onData: value => log.push(value),
    onDone: () => (done = true),
  });

  expect(log).to.have.length(0);

  const add = rep.register('add-data', addData);
  await add({k: 0});
  await Promise.resolve();
  expect(log).to.eql([undefined, 0]);

  let done = false;

  await rep.close();
  expect(done).to.equal(true);
  cancel();
});

test('name', async () => {
  const repA = await replicacheForTesting('a');
  const repB = await replicacheForTesting('b');

  const addA = repA.register('add-data', addData);
  const addB = repB.register('add-data', addData);

  await addA({key: 'A'});
  await addB({key: 'B'});

  expect(await repA.get('key')).to.equal('A');
  expect(await repB.get('key')).to.equal('B');

  await repA.close();
  await repB.close();

  indexedDB.deleteDatabase('a');
  indexedDB.deleteDatabase('b');
});

test('register with error', async () => {
  rep = await replicacheForTesting('regerr');

  const doErr = rep.register(
    'err',
    async (_: WriteTransaction, args: number) => {
      throw args;
    },
  );

  try {
    await doErr(42);
    fail('Should have thrown');
  } catch (ex) {
    expect(ex).to.equal(42);
  }
});

test('subscribe with error', async () => {
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
      return null;
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

  expect(error).to.equal(undefined);
  expect(gottenValue).to.equal(0);

  await add({k: 'throw'});
  expect(gottenValue).to.equal(1);
  await Promise.resolve();
  expect(error).to.equal('throw');

  cancel();
});

test('overlapping writes', async () => {
  async function dbWait(tx: ReadTransaction, dur: number) {
    // Try to take setTimeout away from me???
    const t0 = Date.now();
    while (Date.now() - t0 > dur) {
      await tx.get('foo');
    }
  }

  function timerWait(dur: number) {
    return new Promise(res => setTimeout(res, dur));
  }

  // writes wait on writes
  rep = await replicacheForTesting('conflict');
  const mut = rep.register(
    'wait-then-return',
    async <T extends JSONValue>(
      tx: ReadTransaction,
      {duration, ret}: {duration: number; ret: T},
    ) => {
      await dbWait(tx, duration);
      return ret;
    },
  );

  let resA = mut({duration: 250, ret: 'a'});
  // create a gap to make sure resA starts first (our rwlock isn't fair).
  await timerWait(100);
  let resB = mut({duration: 0, ret: 'b'});
  // race them, a should complete first, indicating that b waited
  expect(await Promise.race([resA, resB])).to.equal('a');
  // wait for the other to finish so that we're starting from null state for next one.
  await Promise.all([resA, resB]);

  // reads wait on writes
  resA = mut({duration: 250, ret: 'a'});
  await timerWait(100);
  resB = rep.query(() => 'b');
  expect(await Promise.race([resA, resB])).to.equal('a');
});

test('sync', async () => {
  const diffServerURL = 'https://diff.com/pull';
  const batchURL = 'https://batch.com';

  rep = await replicacheForTesting('sync', {
    batchURL,
    dataLayerAuth: '1',
    diffServerAuth: '1',
    diffServerURL,
  });

  let pullCounter = 0;
  fetchMock.post(
    diffServerURL,
    () =>
      [
        {
          stateID: '97dd36bqlpojn302g24hemq2o34v66qm',
          lastMutationID: 2,
          patch: [
            {op: 'remove', path: '/'},
            {
              op: 'add',
              path: '/~1list~11',
              valueString: '{"id":1,"ownerUserID":1}',
            },
          ],
          checksum: 'e45e820e',
          clientViewInfo: {httpStatusCode: 200, errorMessage: ''},
        },
        {
          stateID: '97dd36bqlpojn302g24hemq2o34v66qm',
          lastMutationID: 2,
          patch: [],
          checksum: 'e45e820e',
          clientViewInfo: {httpStatusCode: 200, errorMessage: ''},
        },
        {
          stateID: 'g42viqe19kjv8iaahbj8ccs2aiub0po8',
          lastMutationID: 3,
          patch: [
            {
              op: 'add',
              path: '/~1todo~114323534',
              valueString:
                '{"complete":false,"id":14323534,"listId":1,"order":10000,"text":"Test"}',
            },
          ],
          checksum: 'bb35ac40',
          clientViewInfo: {httpStatusCode: 200, errorMessage: ''},
        },
        {
          stateID: '97dd36bqlpojn302g24hemq2o34v66qm',
          lastMutationID: 2,
          patch: [],
          checksum: 'e45e820e',
          clientViewInfo: {httpStatusCode: 200, errorMessage: ''},
        },
        {
          stateID: '4aqjcn91pronkc3s1uhpg8gichc1m6hv',
          lastMutationID: 6,
          patch: [{op: 'remove', path: '/~1todo~114323534'}],
          checksum: 'e45e820e',
          clientViewInfo: {httpStatusCode: 200, errorMessage: ''},
        },
      ][pullCounter++],
  );

  let batchCounter = 0;
  fetchMock.post(
    batchURL,
    () =>
      [
        {
          mutationInfos: [
            {id: 1, error: 'deleteTodo: todo not found'},
            {id: 2, error: 'deleteTodo: todo not found'},
          ],
        },
        {mutationInfos: []},
        {
          mutationInfos: [
            {id: 3, error: 'mutation has already been processed'},
          ],
        },
        {mutationInfos: []},
      ][batchCounter++],
  );

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

  expect(deleteCount).to.equal(2);

  await rep?.sync();
  expect(deleteCount).to.equal(2);

  beginSyncResult = await rep?.beginSync();
  syncHead = beginSyncResult.syncHead;
  expect(syncHead).to.equal(emptyHash);
  expect(deleteCount).to.equal(2);

  await createTodo({
    id: id1,
    listId: 1,
    text: 'Test',
    complete: false,
    order: 10000,
  });
  expect(createCount).to.equal(1);
  expect(((await rep?.get(`/todo/${id1}`)) as {text: string}).text).to.equal(
    'Test',
  );

  beginSyncResult = await rep?.beginSync();
  syncHead = beginSyncResult.syncHead;
  expect(syncHead).not.to.equal(emptyHash);

  await createTodo({
    id: id2,
    listId: 1,
    text: 'Test 2',
    complete: false,
    order: 20000,
  });
  expect(createCount).to.equal(2);
  expect(((await rep?.get(`/todo/${id2}`)) as {text: string}).text).to.equal(
    'Test 2',
  );

  await rep?.maybeEndSync(beginSyncResult);

  expect(createCount).to.equal(3);

  // Clean up
  await deleteTodo({id: id1});
  await deleteTodo({id: id2});

  expect(deleteCount).to.equal(4);
  expect(createCount).to.equal(3);

  await rep?.sync();

  expect(deleteCount).to.equal(4);
  expect(createCount).to.equal(3);
});

test('sync2', async () => {
  rep = await replicacheForTesting('sync2');

  const spy = spyInvoke(rep);

  const s1 = rep.sync();
  const s2 = rep.sync();
  await s1;
  await s2;

  const calls = spy.args;
  const syncCalls = calls.filter(([rpc]) => rpc === 'beginSync').length;
  expect(syncCalls).to.equal(2);
});

test('reauth', async () => {
  const diffServerURL = 'https://diff.com/pull';

  rep = await replicacheForTesting('reauth', {
    diffServerURL,
    diffServerAuth: '1',
    dataLayerAuth: 'wrong',
  });

  fetchMock.post(diffServerURL, () => ({
    stateID: 'fq40kklle30lr20vpjiv0ios8hgipnut',
    lastMutationID: 0,
    patch: [{op: 'remove', path: '/'}],
    checksum: '00000000',
    clientViewInfo: {
      httpStatusCode: httpStatusUnauthorized,
      errorMessage: 'xxx',
    },
  }));

  const consoleErrorStub = sinon.stub(console, 'error');

  const getDataLayerAuthFake = sinon.fake.returns(null);
  rep.getDataLayerAuth = getDataLayerAuthFake;

  await rep.beginSync();

  expect(getDataLayerAuthFake.callCount).to.equal(1);
  expect(consoleErrorStub.firstCall.args[0]).to.equal(
    'Got error response from client view server (https://diff.com/pull): 401: xxx',
  );

  {
    const consoleInfoStub = sinon.stub(console, 'info');
    const getDataLayerAuthFake = sinon.fake(() => 'boo');
    rep.getDataLayerAuth = getDataLayerAuthFake;

    expect((await rep.beginSync()).syncHead).to.equal('');

    expect(getDataLayerAuthFake.callCount).to.equal(8);
    expect(consoleInfoStub.firstCall.args[0]).to.equal(
      'Tried to reauthenticate too many times',
    );
  }
});

test('closed tx', async () => {
  rep = await replicacheForTesting('reauth');

  let rtx: ReadTransaction;
  await rep.query(tx => (rtx = tx));

  await expectAsyncFuncToThrow(() => rtx.get('x'), TransactionClosedError);
  await expectAsyncFuncToThrow(() => rtx.has('y'), TransactionClosedError);
  await expectAsyncFuncToThrow(
    () => rtx.scan().values().next(),
    TransactionClosedError,
  );

  let wtx: WriteTransaction | undefined;
  const mut = rep.register('mut', async tx => {
    wtx = tx;
  });

  await mut();
  expect(wtx).to.not.be.undefined;
  await expectAsyncFuncToThrow(() => wtx?.put('z', 1), TransactionClosedError);
  await expectAsyncFuncToThrow(() => wtx?.del('w'), TransactionClosedError);
});

test('syncInterval in constructor', async () => {
  const rep = new Replicache({
    clientViewURL: 'clientViewURL',
    diffServerURL: 'diffServerURL',
    syncInterval: 12.34,
  });
  expect(rep.syncInterval).to.equal(12.34);
  await rep.close();
});

test('closeTransaction after rep.scan', async () => {
  rep = await replicacheForTesting('test5');
  const add = rep.register('add-data', addData);
  await add({
    'a/0': 0,
    'a/1': 1,
  });

  const spy = spyInvoke(rep);
  spy.resetHistory();

  function expectCalls(log: JSONValue[]) {
    expect(log).to.eql(log);
    const rpcs = spy.args.map(([rpc]) => rpc);
    expect(rpcs).to.eql(['openTransaction', 'scan', 'closeTransaction']);
  }

  const it = rep.scan();
  const log: JSONValue[] = [];
  for await (const v of it) {
    log.push(v);
  }
  expectCalls([0, 1]);

  // One more time with return in loop...
  log.length = 0;
  spy.resetHistory();
  await (async () => {
    if (!rep) {
      fail();
    }
    const it = rep.scan();
    for await (const v of it) {
      log.push(v);
      return;
    }
  })();
  expectCalls([0]);

  // ... and with a break.
  log.length = 0;
  spy.resetHistory();
  {
    const it = rep.scan();
    for await (const v of it) {
      log.push(v);
      break;
    }
  }
  expectCalls([0]);

  // ... and with a throw.
  log.length = 0;
  spy.resetHistory();
  (
    await expectPromiseToReject(
      (async () => {
        if (!rep) {
          fail();
        }
        const it = rep.scan();
        for await (const v of it) {
          log.push(v);
          throw 'hi!';
        }
      })(),
    )
  ).to.equal('hi!');

  expectCalls([0]);

  // ... and with a throw.
  log.length = 0;
  spy.resetHistory();
  (
    await expectPromiseToReject(
      (async () => {
        if (!rep) {
          fail();
        }
        const it = rep.scan();
        for await (const v of it) {
          log.push(v);
          throw 'hi!';
        }
      })(),
    )
  ).to.equal('hi!');
  expectCalls([0]);
});

test('index', async () => {
  rep = await replicacheForTesting('test-index');

  const add = rep.register('add-data', addData);
  await add({
    'a/0': {a: '0'},
    'a/1': {a: '1'},
    'a/2': {a: '2'},
    'a/3': {a: '3'},
    'a/4': {a: '4'},
    'b/0': {bc: '5'},
    'b/1': {bc: '6'},
    'b/2': {bc: '7'},
    'c/0': {bc: '8'},
    'd/0': {d: {e: {f: '9'}}},
  });
  await rep.createIndex({name: 'aIndex', jsonPointer: '/a'});

  await testScanResult({indexName: 'aIndex'}, [
    [['0', 'a/0'], {a: '0'}],
    [['1', 'a/1'], {a: '1'}],
    [['2', 'a/2'], {a: '2'}],
    [['3', 'a/3'], {a: '3'}],
    [['4', 'a/4'], {a: '4'}],
  ]);
  await rep.dropIndex('aIndex');
  await expectPromiseToReject(rep.scanAll({indexName: 'aIndex'}));

  await rep.createIndex({name: 'aIndex', jsonPointer: '/a'});
  await testScanResult({indexName: 'aIndex'}, [
    [['0', 'a/0'], {a: '0'}],
    [['1', 'a/1'], {a: '1'}],
    [['2', 'a/2'], {a: '2'}],
    [['3', 'a/3'], {a: '3'}],
    [['4', 'a/4'], {a: '4'}],
  ]);
  await rep.dropIndex('aIndex');
  await expectPromiseToReject(rep.scanAll({indexName: 'aIndex'}));

  await rep.createIndex({name: 'bc', keyPrefix: 'c/', jsonPointer: '/bc'});
  await testScanResult({indexName: 'bc'}, [[['8', 'c/0'], {bc: '8'}]]);
  await add({
    'c/1': {bc: '88'},
  });
  await testScanResult({indexName: 'bc'}, [
    [['8', 'c/0'], {bc: '8'}],
    [['88', 'c/1'], {bc: '88'}],
  ]);
  await rep.dropIndex('bc');

  await rep.createIndex({name: 'dIndex', jsonPointer: '/d/e/f'});
  await testScanResult({indexName: 'dIndex'}, [
    [['9', 'd/0'], {d: {e: {f: '9'}}}],
  ]);
  await rep.dropIndex('dIndex');

  await add({
    'e/0': {'': ''},
  });
  await rep.createIndex({name: 'emptyKeyIndex', jsonPointer: '/'});
  await testScanResult({indexName: 'emptyKeyIndex'}, [[['', 'e/0'], {'': ''}]]);
  await rep.dropIndex('emptyKeyIndex');
});

test('index array', async () => {
  rep = await replicacheForTesting('test-index');

  const add = rep.register('add-data', addData);
  await add({
    'a/0': {a: []},
    'a/1': {a: ['0']},
    'a/2': {a: ['1', '2']},
    'a/3': {a: '3'},
    'a/4': {a: ['4']},
    'b/0': {bc: '5'},
    'b/1': {bc: '6'},
    'b/2': {bc: '7'},
    'c/0': {bc: '8'},
  });

  await rep.createIndex({name: 'aIndex', jsonPointer: '/a'});
  await testScanResult({indexName: 'aIndex'}, [
    [['0', 'a/1'], {a: ['0']}],
    [['1', 'a/2'], {a: ['1', '2']}],
    [['2', 'a/2'], {a: ['1', '2']}],
    [['3', 'a/3'], {a: '3'}],
    [['4', 'a/4'], {a: ['4']}],
  ]);
  await rep.dropIndex('aIndex');
});

test('index scan start', async () => {
  rep = await replicacheForTesting('test-index-scan');

  const add = rep.register('add-data', addData);
  await add({
    'a/1': {a: '0'},
    'b/0': {b: 'a5'},
    'b/1': {b: 'a6'},
    'b/2': {b: 'b7'},
    'b/3': {b: 'b8'},
  });

  await rep.createIndex({
    name: 'bIndex',
    jsonPointer: '/b',
  });

  for (const key of ['a6', ['a6'], ['a6', undefined], ['a6', '']] as (
    | string
    | [string, string?]
  )[]) {
    await testScanResult({indexName: 'bIndex', start: {key}}, [
      [['a6', 'b/1'], {b: 'a6'}],
      [['b7', 'b/2'], {b: 'b7'}],
      [['b8', 'b/3'], {b: 'b8'}],
    ]);
    await testScanResult(
      {indexName: 'bIndex', start: {key, exclusive: false}},
      [
        [['a6', 'b/1'], {b: 'a6'}],
        [['b7', 'b/2'], {b: 'b7'}],
        [['b8', 'b/3'], {b: 'b8'}],
      ],
    );
  }

  for (const key of ['a6', ['a6'], ['a6', undefined]] as (
    | string
    | [string, string?]
  )[]) {
    await testScanResult(
      {indexName: 'bIndex', start: {key, exclusive: false}},
      [
        [['a6', 'b/1'], {b: 'a6'}],
        [['b7', 'b/2'], {b: 'b7'}],
        [['b8', 'b/3'], {b: 'b8'}],
      ],
    );
    await testScanResult(
      {indexName: 'bIndex', start: {key: ['a6', ''], exclusive: true}},
      [
        [['a6', 'b/1'], {b: 'a6'}],
        [['b7', 'b/2'], {b: 'b7'}],
        [['b8', 'b/3'], {b: 'b8'}],
      ],
    );
  }

  for (const key of ['a6', ['a6'], ['a6', undefined]] as (
    | string
    | [string, string?]
  )[]) {
    await testScanResult({indexName: 'bIndex', start: {key, exclusive: true}}, [
      [['b7', 'b/2'], {b: 'b7'}],
      [['b8', 'b/3'], {b: 'b8'}],
    ]);
  }

  await testScanResult({indexName: 'bIndex', start: {key: ['b7', 'b/2']}}, [
    [['b7', 'b/2'], {b: 'b7'}],
    [['b8', 'b/3'], {b: 'b8'}],
  ]);
  await testScanResult(
    {indexName: 'bIndex', start: {key: ['b7', 'b/2'], exclusive: false}},
    [
      [['b7', 'b/2'], {b: 'b7'}],
      [['b8', 'b/3'], {b: 'b8'}],
    ],
  );
  await testScanResult(
    {indexName: 'bIndex', start: {key: ['b7', 'b/2'], exclusive: true}},
    [[['b8', 'b/3'], {b: 'b8'}]],
  );

  await testScanResult({indexName: 'bIndex', start: {key: ['a6', 'b/2']}}, [
    [['b7', 'b/2'], {b: 'b7'}],
    [['b8', 'b/3'], {b: 'b8'}],
  ]);
  await testScanResult(
    {indexName: 'bIndex', start: {key: ['a6', 'b/2'], exclusive: false}},
    [
      [['b7', 'b/2'], {b: 'b7'}],
      [['b8', 'b/3'], {b: 'b8'}],
    ],
  );
  await testScanResult(
    {indexName: 'bIndex', start: {key: ['a6', 'b/2'], exclusive: true}},
    [
      [['b7', 'b/2'], {b: 'b7'}],
      [['b8', 'b/3'], {b: 'b8'}],
    ],
  );

  await rep.dropIndex('bIndex');
});

// Only used for type checking
test.skip('mutator optional args [type checking only]', async () => {
  rep = await replicacheForTesting('test-types');

  const mut = rep.register('mut', async (tx: WriteTransaction, x: number) => {
    console.log(tx);
    return x;
  });
  const res: number = await mut(42);
  console.log(res);

  const mut2 = rep.register('mut', (tx: WriteTransaction, x: string) => {
    console.log(tx);
    return x;
  });
  const res2: string = await mut2('s');
  console.log(res2);

  const mut3 = rep.register('mut2', tx => {
    console.log(tx);
  });
  await mut3();
  //  @ts-expect-error: Expected 0 arguments, but got 1.ts(2554)
  await mut3(42);
  //  @ts-expect-error: Type 'void' is not assignable to type 'number'.ts(2322)
  const res3: number = await mut3();
  console.log(res3);

  const mut4 = rep.register('mut2', async tx => {
    console.log(tx);
  });
  await mut4();
  //  @ts-expect-error: Expected 0 arguments, but got 1.ts(2554)
  await mut4(42);
  //  @ts-expect-error: Type 'void' is not assignable to type 'number'.ts(2322)
  const res4: number = await mut4();
  console.log(res4);

  // @ts-expect-error: Types of parameters 'x' and 'args' are incompatible.
  //   Type 'JSONValue' is not assignable to type 'Date'.
  //     Type 'null' is not assignable to type 'Date'.ts(2769)
  const mut5 = rep.register('mut3', (tx: WriteTransaction, x: Date) => {
    console.log(tx);
    return x;
  });
  console.log(mut5);
});

test('setLogLevel', async () => {
  // Just testing that no errors are thrown
  rep = await replicacheForTesting('set-log-level');
  await rep.setVerboseWasmLogging(true);
  await rep.setVerboseWasmLogging(false);
});

test('JSON deep equal', () => {
  const t = (
    a: JSONValue | undefined,
    b: JSONValue | undefined,
    expected = true,
  ) => {
    const res = deepEqual(a, b);
    if (res !== expected) {
      fail(
        JSON.stringify(a) + (expected ? ' === ' : ' !== ') + JSON.stringify(b),
      );
    }
  };

  const oneLevelOfData = [
    0,
    1,
    2,
    3,
    456789,
    true,
    false,
    null,
    '',
    'a',
    'b',
    'cdefefsfsafasdadsaas',
    [],
    {},
    {x: 4, y: 5, z: 6},
    [7, 8, 9],
  ] as const;

  const testData = [
    ...oneLevelOfData,
    [...oneLevelOfData],
    Object.fromEntries(oneLevelOfData.map(v => [JSON.stringify(v), v])),
  ];

  for (let i = 0; i < testData.length; i++) {
    for (let j = 0; j < testData.length; j++) {
      const a = testData[i];
      // "clone" to ensure we do not end up with a and b being the same object.
      const b = JSON.parse(JSON.stringify(testData[j]));
      t(a, b, i === j);
    }
  }

  t({a: 1, b: 2}, {b: 2, a: 1});
});

// Only used for type checking
test.skip('Test partial JSONObject [type checking only]', async () => {
  rep = await replicacheForTesting('test-types');

  type Todo = {id: number; text: string};

  const mut = rep.register(
    'mut',
    async (tx: WriteTransaction, todo: Partial<Todo>) => {
      console.log(tx);
      return todo;
    },
  );
  await mut({});
  await mut({id: 42});
  await mut({text: 'abc'});

  // @ts-expect-error Type '42' has no properties in common with type 'Partial<Todo>'.ts(2559)
  await mut(42);
  // @ts-expect-error Type 'string' is not assignable to type 'number | undefined'.ts(2322)
  await mut({id: 'abc'});
});

// Only used for type checking
test.skip('Test register param [type checking only]', async () => {
  rep = await replicacheForTesting('test-types');

  const mut: () => Promise<void> = rep.register(
    'mut',
    async (tx: WriteTransaction) => {
      console.log(tx);
    },
  );
  console.log(mut);

  // @ts-expect-error Type 'number' is not assignable to type 'string'.ts(2322)
  const mut2: (x: number) => Promise<void> = rep.register(
    'mut2',
    async (tx: WriteTransaction, x: string) => {
      console.log(tx, x);
    },
  );
  console.log(mut2);

  // @ts-expect-error Type '(args: string) => Promise<void>' is not assignable to type '() => Promise<void>'.ts(2322)
  const mut3: () => Promise<void> = rep.register(
    'mut3',
    async (tx: WriteTransaction, x: string) => {
      console.log(tx, x);
    },
  );
  console.log(mut3);

  // This is fine according to the rules of JS/TS
  const mut4: (x: number) => Promise<void> = rep.register(
    'mut4',
    async (tx: WriteTransaction) => {
      console.log(tx);
    },
  );
  console.log(mut4);

  rep.register(
    'mut5',
    // @ts-expect-error ts(2345)
    async (tx: WriteTransaction, a: string, b: number) => {
      console.log(tx, a, b);
    },
  );
});

// Only used for type checking
test.skip('Key type for scans', async () => {
  rep = await replicacheForTesting('test-types');

  for await (const k of rep.scan({indexName: 'n'}).keys()) {
    // @ts-expect-error Type '[secondary: string, primary?: string | undefined]' is not assignable to type 'string'.ts(2322)
    const k2: string = k;
    console.log(k2);
  }

  for await (const k of rep.scan({indexName: 'n', start: {key: 's'}}).keys()) {
    // @ts-expect-error Type '[secondary: string, primary?: string | undefined]' is not assignable to type 'string'.ts(2322)
    const k2: string = k;
    console.log(k2);
  }

  for await (const k of rep
    .scan({indexName: 'n', start: {key: ['s']}})
    .keys()) {
    // @ts-expect-error Type '[secondary: string, primary?: string | undefined]' is not assignable to type 'string'.ts(2322)
    const k2: string = k;
    console.log(k2);
  }

  for await (const k of rep.scan({start: {key: 'p'}}).keys()) {
    // @ts-expect-error Type 'string' is not assignable to type '[string]'.ts(2322)
    const k2: [string] = k;
    console.log(k2);
  }

  // @ts-expect-error Type 'number' is not assignable to type 'string | undefined'.ts(2322)
  rep.scan({indexName: 'n', start: {key: ['s', 42]}});

  // @ts-expect-error Type 'number' is not assignable to type 'string | undefined'.ts(2322)
  rep.scanAll({indexName: 'n', start: {key: ['s', 42]}});

  // @ts-expect-error Type '[string]' is not assignable to type 'string'.ts(2322)
  rep.scan({start: {key: ['s']}});

  // @ts-expect-error Type '[string]' is not assignable to type 'string'.ts(2322)
  rep.scanAll({start: {key: ['s']}});
});

test('size and isEmpty', async () => {
  rep = await replicacheForTesting('test-size');
  const add = rep.register('add-data', addData);
  const del = rep.register('del-data', delData);

  async function t(expectedSize: number) {
    expect(await rep?.query(tx => tx.size())).to.eq(expectedSize);
    expect(await rep?.size()).to.eq(expectedSize);

    expect(await rep?.query(tx => tx.isEmpty())).to.eq(expectedSize === 0);
    expect(await rep?.isEmpty()).to.eq(expectedSize === 0);
  }

  await t(0);

  await add({a: 1});
  await t(1);

  await add({b: 2, c: 3});
  await t(3);

  await del('b');
  await t(2);

  await del('a');
  await t(1);
});
