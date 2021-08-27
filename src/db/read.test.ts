import {expect} from '@esm-bundle/chai';
import * as dag from '../dag/mod.js';
import {MemStore} from '../kv/mod.js';
import {LogContext} from '../logger.js';
import {b} from '../test-util.js';
import {DEFAULT_HEAD_NAME} from './commit.js';
import {fromWhence, whenceHead} from './read.js';
import {initDB, Write} from './write.js';

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
