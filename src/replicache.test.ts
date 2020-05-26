// NodeJS does not have fetch
import fetch from 'node-fetch';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).fetch = fetch;

import {ReplicacheTest} from './replicache.js';
import {FullInvoke as RepmInvoke, RepmHttpInvoker} from './repm-invoker.js';

let rep: ReplicacheTest | null = null;
let rep2: ReplicacheTest | null = null;

const httpInvoker = new RepmHttpInvoker('http://localhost:7002');
const httpInvoke = httpInvoker.invoke.bind(httpInvoker);

const invoke: RepmInvoke = httpInvoke;

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
  //   console.log(name, diffServerUrl, dataLayerAuth, diffServerAuth, batchUrl);
  return await ReplicacheTest.new({diffServerUrl, name, repmInvoke: invoke});
}

beforeEach(async () => {
  //
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
