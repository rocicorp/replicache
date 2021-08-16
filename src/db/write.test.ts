import {expect} from '@esm-bundle/chai';
import {Store as DagStore, Store} from '../dag/store';
import {MemStore} from '../kv/mem-store';
import {b} from '../kv/store-test-util';
import {DEFAULT_HEAD_NAME} from './commit';
import {whenceHead} from './read';
import {initDB, Write} from './write';

test('basics', async () => {
  const ds = new DagStore(new MemStore());
  await initDB(await ds.write(), DEFAULT_HEAD_NAME);

  // Put.
  await ds.withWrite(async dagWrite => {
    const w = await Write.newLocal(
      whenceHead(DEFAULT_HEAD_NAME),
      'mutator_name',
      JSON.stringify([]),
      undefined,
      dagWrite,
    );
    await w.put(b`foo`, b`bar`);
    // Assert we can read the same value from within this transaction.
    const r = w.asRead();
    const val = r.get(b`foo`);
    expect(val).to.deep.equal(b`bar`);
    await w.commit(DEFAULT_HEAD_NAME);
  });

  // As well as after it has committed.
  await ds.withWrite(async dagWrite => {
    const w = await Write.newLocal(
      whenceHead(DEFAULT_HEAD_NAME),
      'mutator_name',
      JSON.stringify(null),
      undefined,
      dagWrite,
    );
    const r = w.asRead();
    const val = r.get(b`foo`);
    expect(val).to.deep.equal(b`bar`);
  });

  // Del.
  await ds.withWrite(async dagWrite => {
    const w = await Write.newLocal(
      whenceHead(DEFAULT_HEAD_NAME),
      'mutator_name',
      JSON.stringify([]),
      undefined,
      dagWrite,
    );
    await w.del(b`foo`);
    // Assert it is gone while still within this transaction.
    const r = w.asRead();
    const val = r.get(b`foo`);
    expect(val).to.be.undefined;
    await w.commit(DEFAULT_HEAD_NAME);
  });

  // As well as after it has committed.
  await ds.withWrite(async dagWrite => {
    const w = await Write.newLocal(
      whenceHead(DEFAULT_HEAD_NAME),
      'mutator_name',
      JSON.stringify(null),
      undefined,
      dagWrite,
    );
    const r = w.asRead();
    const val = r.get(b`foo`);
    expect(val).to.be.undefined;
  });
});

test('index commit type', async () => {
  const ds = new DagStore(new MemStore());
  await initDB(await ds.write(), DEFAULT_HEAD_NAME);

  // Test that local changes cannot create or drop an index.
  const w = await Write.newLocal(
    whenceHead(DEFAULT_HEAD_NAME),
    'mutator_name',
    JSON.stringify([]),
    undefined,
    await ds.write(),
  );

  let err;
  try {
    await w.createIndex('foo', b``, '');
  } catch (e) {
    err = e;
  }
  expect(err).to.be.an.instanceof(Error);
  expect(err).to.have.property('message', 'Not allowed');

  err = undefined;
  try {
    await w.dropIndex('foo');
  } catch (e) {
    err = e;
  }
  expect(err).to.be.an.instanceof(Error);
  expect(err).to.have.property('message', 'Not allowed');
  // TODO(arv): Release?
  // w.release()
});

test('clear', async () => {
  // throw new Error('TODO(arv): Implement');
});

test('create and drop index', async () => {
  // throw new Error('TODO(arv): Implement');
});
