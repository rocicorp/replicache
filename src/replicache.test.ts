// NodeJS does not have fetch
import fetch from 'node-fetch';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).fetch = fetch;

import {promises} from 'fs';
type FileHandle = promises.FileHandle;
const {open} = promises;

import {ReplicacheTest} from './replicache.js';
import {RepmInvoke, RepmHttpInvoker} from './mod.js';
import type {ReadTransaction} from './mod.js';
import type {JsonType} from './json.js';
import type {InvokeMapNoArgs, InvokeMap, FullInvoke} from './repm-invoker.js';

let rep: ReplicacheTest | null = null;
let rep2: ReplicacheTest | null = null;

type Replay = {
  method: string;
  dbName: string;
  args: JsonType;
  result: JsonType;
};

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

const httpInvoker = new RepmHttpInvoker('http://localhost:7002');
const httpInvoke: FullInvoke = httpInvoker.invoke.bind(httpInvoker);

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
  }: // dataLayerAuth = '',
  // diffServerAuth = '',
  // batchUrl = '',
  {
    diffServerUrl?: string;
    dataLayerAuth?: string;
    diffServerAuth?: string;
    batchUrl?: string;
  } = {},
): Promise<ReplicacheTest> {
  return await ReplicacheTest.new({diffServerUrl, name, repmInvoke: invoke});
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
    expect(await tx.get('key')).toBeNull();
    expect(await tx.has('key')).toBe(false);

    const scanItems = await tx.scan();
    expect(scanItems).toHaveLength(0);
  }

  await t(rep);
  await rep.query(t);
});
