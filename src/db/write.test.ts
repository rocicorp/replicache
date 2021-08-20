import {expect} from '@esm-bundle/chai';
import {assertNotNull, assertNotUndefined} from '../assert-not-null';
import {Store as DagStore} from '../dag/store';
import {MemStore} from '../kv/mem-store';
import {b} from '../kv/store-test-util';
import {DEFAULT_HEAD_NAME} from './commit';
import {readCommit, readIndexes, whenceHead} from './read';
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

test('index commit type constraints', async () => {
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
  const ds = new DagStore(new MemStore());
  await ds.withWrite(dagWrite => initDB(dagWrite, DEFAULT_HEAD_NAME));
  await ds.withWrite(async dagWrite => {
    const w = await Write.newLocal(
      whenceHead(DEFAULT_HEAD_NAME),
      'mutator_name',
      JSON.stringify([]),
      undefined,
      dagWrite,
    );
    await w.put(b`foo`, b`"bar"`);
    await w.commit(DEFAULT_HEAD_NAME);
  });

  await ds.withWrite(async dagWrite => {
    const w = await Write.newIndexChange(
      whenceHead(DEFAULT_HEAD_NAME),
      dagWrite,
    );
    await w.createIndex('idx', b``, '');
    await w.commit(DEFAULT_HEAD_NAME);
  });

  await ds.withWrite(async dagWrite => {
    const w = await Write.newLocal(
      whenceHead(DEFAULT_HEAD_NAME),
      'mutator_name',
      JSON.stringify([]),
      undefined,
      dagWrite,
    );
    await w.put(b`hot`, b`"dog"`);

    expect([...w.map]).to.have.lengthOf(2);
    let index = w.indexes.get('idx');
    assertNotUndefined(index);
    let map = await index.getMap(dagWrite.read());
    expect([...map]).prototype.have.lengthOf(2);

    await w.clear();
    expect([...w.map]).to.have.lengthOf(0);
    index = w.indexes.get('idx');
    assertNotUndefined(index);
    map = await index.getMap(dagWrite.read());
    expect([...map]).prototype.have.lengthOf(0);

    await w.commit(DEFAULT_HEAD_NAME);
  });

  await ds.withRead(async dagRead => {
    const [, c, m] = await readCommit(whenceHead(DEFAULT_HEAD_NAME), dagRead);
    const indexes = readIndexes(c);
    expect([...m]).to.have.lengthOf(0);
    const index = indexes.get('idx');
    assertNotUndefined(index);
    expect([...(await index.getMap(dagRead))]).to.have.lengthOf(0);
  });
});

test('create and drop index', async () => {
  throw new Error('TODO(arv): Implement');
});
