import {expect} from '@esm-bundle/chai';
import {Store as DagStore} from '../dag/store';
import {MemStore} from '../kv/mem-store';
import {b} from '../kv/store-test-util';
import {DEFAULT_HEAD_NAME} from './commit';
import {fromWhence, whenceHead} from './read';
import {initDB, Write} from './write';

test('basics', async () => {
  const ds = new DagStore(new MemStore());
  await initDB(await ds.write(), DEFAULT_HEAD_NAME);
  const w = await Write.newLocal(
    whenceHead(DEFAULT_HEAD_NAME),
    'mutator_name',
    JSON.stringify([]),
    undefined,
    await ds.write(),
  );
  await w.put(b`foo`, b`bar`);
  await w.commit(DEFAULT_HEAD_NAME);

  const dr = await ds.read();
  const r = await fromWhence(whenceHead(DEFAULT_HEAD_NAME), dr);
  const val = r.get(b`foo`);
  expect(val).to.deep.equal(b`bar`);
});
