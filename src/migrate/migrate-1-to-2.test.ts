import {expect} from '@esm-bundle/chai';
import {migrateProllyMap} from './migrate-1-to-2';
import * as dag from '../dag/mod';
import * as kv from '../kv/mod';
import * as prolly from '../prolly/mod';
import {emptyHash, initHasher} from '../hash';

setup(async () => {
  await initHasher();
});

test('migrateProllyMap', async () => {
  const t = async (entries: prolly.Entry[]) => {
    const kvStore = new kv.TestMemStore();
    const dagStore = new dag.Store(kvStore);

    const oldHash = await dagStore.withWrite(async dagWrite => {
      const map = new prolly.Map(entries);
      const h = await map.flush(dagWrite);
      await dagWrite.setHead('testOld', h);
      await dagWrite.commit();
      return h;
    });

    const newHash = await dagStore.withWrite(async dagWrite => {
      const newHash = await migrateProllyMap(oldHash, dagWrite, new Map());
      await dagWrite.setHead('testNew', newHash);
      await dagWrite.commit();
      return newHash;
    });

    if (entries.length === 0) {
      expect(newHash).to.equal(emptyHash);
    } else {
      const chunkData = kvStore.map().get(dag.chunkDataKey(newHash));
      expect(chunkData).to.deep.equal([0, entries]);
    }
  };

  await t([]);
  await t([['foo', 42]]);
  await t([['foo', false]]);
  await t([['foo', 0]]);
  await t([
    ['bar', []],
    ['foo', true],
  ]);
  await t([
    ['x', {}],
    ['y', {z: null}],
  ]);
});
