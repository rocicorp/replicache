import {expect} from '@esm-bundle/chai';
import * as dag from '../dag/mod';
import {initHasher} from '../hash';
import {MemStore} from '../kv/mod';
import {LogContext} from '../logger';
import {b} from '../test-util';
import {DEFAULT_HEAD_NAME} from './commit';
import {fromWhence, whenceHead} from './read';
import {initDB, Write} from './write';

setup(async () => {
  await initHasher();
});

test('basics', async () => {
  const ds = new dag.Store(new MemStore());
  const lc = new LogContext();
  await initDB(await ds.write(), DEFAULT_HEAD_NAME);
  const w = await Write.newLocal(
    whenceHead(DEFAULT_HEAD_NAME),
    'mutator_name',
    JSON.stringify([]),
    undefined,
    await ds.write(),
  );
  await w.put(lc, b`foo`, b`bar`);
  await w.commit(DEFAULT_HEAD_NAME);

  const dr = await ds.read();
  const r = await fromWhence(whenceHead(DEFAULT_HEAD_NAME), dr);
  const val = r.get(b`foo`);
  expect(val).to.deep.equal(b`bar`);
});
