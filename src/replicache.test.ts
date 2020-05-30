// NodeJS does not have fetch
import fetch from 'node-fetch';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).fetch = fetch;

import {ReplicacheTest} from './replicache.js';
import {RepmInvoke, RepmHttpInvoker} from './mod.js';
import type {ReadTransaction} from './mod.js';

let rep: ReplicacheTest | null = null;
let rep2: ReplicacheTest | null = null;

const httpInvoker = new RepmHttpInvoker('http://localhost:7002');
const httpInvoke = httpInvoker.invoke.bind(httpInvoker);

const invoke: RepmInvoke = httpInvoke;

type TestMode = 'live' | 'replay' | 'record';

// eslint-disable-next-line prefer-const
let testMode: TestMode = 'live';

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
  if (rep !== null && !rep.closed) {
    await rep.close();
    rep = null;
  }
  if (rep2 !== null && !rep2.closed) {
    await rep2.close();
    rep2 = null;
  }
});

test('list and drop', async () => {
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
