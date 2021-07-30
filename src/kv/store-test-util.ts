import {assert, expect} from '@esm-bundle/chai';
import {Read, Store, ReleasableStore, Write} from './store';

const {fail} = assert;

/**
 * Creates a new store that wraps read and write in an RWLock.
 */
class TestReleasableStore extends ReleasableStore {
  async withRead<T>(fn: (read: Read) => Promise<T> | T): Promise<T> {
    let read;
    try {
      read = await this.read();
      return await fn(read);
    } finally {
      read?.release();
    }
  }

  async withWrite<T>(fn: (write: Write) => Promise<T> | T): Promise<T> {
    let write;
    try {
      write = await this.write();
      return await fn(write);
    } finally {
      write?.release();
    }
  }

  async put(key: string, value: Uint8Array): Promise<void> {
    await this.withWrite(async write => {
      await write.put(key, value);
      await write.commit();
    });
  }

  async del(key: string): Promise<void> {
    await this.withWrite(async write => {
      await write.del(key);
      await write.commit();
    });
  }

  has(key: string): Promise<boolean> {
    return this.withRead(read => read.has(key));
  }

  get(key: string): Promise<Uint8Array | undefined> {
    return this.withRead(read => read.get(key));
  }
}

export async function runAll(
  newStore: () => Promise<Store> | Store,
): Promise<void> {
  let s = new TestReleasableStore(await newStore());
  await store(s);
  s = new TestReleasableStore(await newStore());
  await readTransaction(s);
  s = new TestReleasableStore(await newStore());
  await writeTransaction(s);
  s = new TestReleasableStore(await newStore());
  await isolation(s);
}

function b(x: TemplateStringsArray): Uint8Array {
  return new TextEncoder().encode(x[0]);
}

async function store(store: TestReleasableStore): Promise<void> {
  // Test put/has/get, which use read() and write() for one-shot txs.
  expect(await store.has('foo')).to.be.false;
  expect(await store.get('foo')).to.be.undefined;

  await store.put('foo', b`bar`);
  expect(await store.has('foo')).to.be.true;
  expect(await store.get('foo')).to.deep.equal(b`bar`);

  await store.put('foo', b`baz`);
  expect(await store.has('foo')).to.be.true;
  expect(await store.get('foo')).to.deep.equal(b`baz`);

  expect(!(await store.has('baz'))).to.be.true;
  expect(await store.get('baz')).to.be.undefined;
  await store.put('baz', b`bat`);
  expect(await store.has('baz')).to.be.true;
  expect(await store.get('baz')).to.deep.equal(b`bat`);
}

async function readTransaction(store: TestReleasableStore): Promise<void> {
  await store.put('k1', b`v1`);

  await store.withRead(async rt => {
    expect(await rt.has('k1')).to.be.true;
    expect(b`v1`).to.deep.equal(await rt.get('k1'));
  });
}

async function writeTransaction(store: TestReleasableStore): Promise<void> {
  await store.put('k1', b`v1`);
  await store.put('k2', b`v2`);

  // Test put then commit.
  await store.withWrite(async wt => {
    expect(await wt.has('k1')).to.be.true;
    expect(await wt.has('k2')).to.be.true;
    await wt.put('k1', b`overwrite`);
    await wt.commit();
  });
  expect(await store.get('k1')).to.deep.equal(b`overwrite`);
  expect(await store.get('k2')).to.deep.equal(b`v2`);

  // Test put then rollback.
  await store.withWrite(async wt => {
    await wt.put('k1', b`should be rolled back`);
    await wt.rollback();
  });
  expect(await store.get('k1')).to.deep.equal(b`overwrite`);

  // Test del then commit.
  await store.withWrite(async wt => {
    await wt.del('k1');
    expect(await wt.has('k1')).to.be.false;
    await wt.commit();
  });
  expect(await store.has('k1')).to.be.false;

  // Test del then rollback.
  expect(await store.has('k2')).to.be.true;
  await store.withWrite(async wt => {
    await wt.del('k2');
    expect(await wt.has('k2')).to.be.false;
    await wt.rollback();
  });
  expect(await store.has('k2')).to.be.true;

  // Test overwrite multiple times then commit.
  await store.withWrite(async wt => {
    await wt.put('k2', b`overwrite`);
    await wt.del('k2');
    await wt.put('k2', b`final`);
    await wt.commit();
  });
  expect(await store.get('k2')).to.deep.equal(b`final`);

  // Test Read interface on Write.
  await store.withWrite(async wt => {
    await wt.put('k2', b`new value`);
    expect(await wt.has('k2')).to.be.true;
    expect(await wt.get('k2')).to.deep.equal(b`new value`);
  });
}

async function isolation(store: ReleasableStore): Promise<void> {
  // Assert there can be multiple concurrent read txs...
  const r1 = await store.read();
  const r2 = await store.read();

  // and that while outstanding they prevent write txs...
  const dur = 200;
  const w = store.write();
  w.then(w => w.release());

  if (await timeout(dur, w)) {
    console.error('2 open read tx should have prevented new write');
    fail();
  }
  // until both the reads are done...
  r1.release();

  {
    const w = store.write();
    w.then(w => w.release());
    if (await timeout(dur, w)) {
      console.error('1 open read tx should have prevented new write');
      fail();
    }
    r2.release();

    {
      const w = await store.write();

      // At this point we have a write tx outstanding. Assert that
      // we cannot open another write transaction.
      {
        const w2 = store.write();
        w2.then(w2 => w2.release());
        if (await timeout(dur, w2)) {
          console.error('1 open write tx should have prevented new write');
          fail();
        }

        // The write tx is still outstanding, ensure we cannot open
        // a read tx until it is finished.
        const r = store.read();
        r.then(r => r.release());
        if (await timeout(dur, r)) {
          console.error('1 open write tx should have prevented new read');
          fail();
        }
        await w.rollback();
        w.release();

        {
          const r = await store.read();
          expect(await r.has('foo')).to.be.false;
        }
      }
    }
  }
}

async function timeout(dur: number, w: Promise<unknown>): Promise<boolean> {
  const sentinel = {};
  const result = await Promise.race([sleep(dur, sentinel), w]);
  if (result === sentinel) {
    return false;
  }
  return true;
}

function sleep<T>(ms: number, v: T): Promise<T> {
  return new Promise(resolve =>
    setTimeout(() => {
      resolve(v);
    }, ms),
  );
}
