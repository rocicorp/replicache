import {expect} from '@esm-bundle/chai';
import {assertNotUndefined} from '../assert-not-null';
import * as dag from '../dag/mod';
import {MemStore} from '../kv/mod';
import {DEFAULT_HEAD_NAME} from './commit';
import {readCommit, readIndexes, whenceHead} from './read';
import {b, stringToUint8Array} from '../test-util';
import {initDB, Write} from './write';
import * as prolly from '../prolly/mod.js';
import {encodeIndexKey} from './index';

test('basics', async () => {
  const ds = new dag.Store(new MemStore());
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
  const ds = new dag.Store(new MemStore());
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
  const ds = new dag.Store(new MemStore());
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
    await index.withMap(dagWrite.read(), map => {
      expect([...map]).to.have.lengthOf(2);
    });

    await w.clear();
    expect([...w.map]).to.have.lengthOf(0);
    index = w.indexes.get('idx');
    assertNotUndefined(index);
    await index.withMap(dagWrite.read(), map => {
      expect([...map]).to.have.lengthOf(0);
    });

    await w.commit(DEFAULT_HEAD_NAME);
  });

  await ds.withRead(async dagRead => {
    const [, c, m] = await readCommit(whenceHead(DEFAULT_HEAD_NAME), dagRead);
    const indexes = readIndexes(c);
    expect([...m]).to.have.lengthOf(0);
    const index = indexes.get('idx');
    assertNotUndefined(index);
    await index.withMap(dagRead, map => {
      expect([...map]).to.have.lengthOf(0);
    });
  });
});

test('create and drop index', async () => {
  const t = async (writeBeforeIndexing: boolean) => {
    const ds = new dag.Store(new MemStore());
    await ds.withWrite(dagWrite => initDB(dagWrite, DEFAULT_HEAD_NAME));

    if (writeBeforeIndexing) {
      await ds.withWrite(async dagWrite => {
        const w = await Write.newLocal(
          whenceHead(DEFAULT_HEAD_NAME),
          'mutator_name',
          JSON.stringify([]),
          undefined,
          dagWrite,
        );
        for (let i = 0; i < 3; i++) {
          await w.put(
            stringToUint8Array(`k${i}`),
            stringToUint8Array(JSON.stringify({s: `s${i}`})),
          );
        }
        await w.commit(DEFAULT_HEAD_NAME);
      });
    }

    const indexName = 'i1';
    await ds.withWrite(async dagWrite => {
      const w = await Write.newIndexChange(
        whenceHead(DEFAULT_HEAD_NAME),
        dagWrite,
      );
      await w.createIndex(indexName, b``, '/s');
      await w.commit(DEFAULT_HEAD_NAME);
    });

    if (!writeBeforeIndexing) {
      await ds.withWrite(async dagWrite => {
        const w = await Write.newLocal(
          whenceHead(DEFAULT_HEAD_NAME),
          'mutator_name',
          JSON.stringify([]),
          undefined,
          dagWrite,
        );
        for (let i = 0; i < 3; i++) {
          await w.put(
            stringToUint8Array(`k${i}`),
            stringToUint8Array(JSON.stringify({s: `s${i}`})),
          );
        }
        await w.commit(DEFAULT_HEAD_NAME);
      });
    }

    await ds.withRead(async dagRead => {
      const [, c] = await readCommit(whenceHead(DEFAULT_HEAD_NAME), dagRead);
      const indexes = c.indexes();
      expect(indexes).to.have.lengthOf(1);
      const idx = indexes[0];
      expect(idx.definition.name).to.equal(indexName);
      expect(idx.definition.keyPrefix).to.be.empty;
      expect(idx.definition.jsonPointer).to.equal('/s');
      const indexMap = await prolly.Map.load(idx.valueHash, dagRead);

      const entries = [...indexMap];
      expect(entries).to.have.lengthOf(3);
      for (let i = 0; i < 3; i++) {
        expect(entries[i].key).to.deep.equal(
          encodeIndexKey({
            secondary: stringToUint8Array(`s${i}`),
            primary: stringToUint8Array(`k${i}`),
          }),
        );
      }
    });

    // Ensure drop works.
    await ds.withWrite(async dagWrite => {
      const w = await Write.newIndexChange(
        whenceHead(DEFAULT_HEAD_NAME),
        dagWrite,
      );
      await w.dropIndex(indexName);
      await w.commit(DEFAULT_HEAD_NAME);
      const [, c] = await readCommit(
        whenceHead(DEFAULT_HEAD_NAME),
        dagWrite.read(),
      );
      const indexes = c.indexes();
      expect(indexes).to.be.empty;
    });
  };

  await t(true);
  await t(false);
});
