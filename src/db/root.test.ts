import {expect} from '@esm-bundle/chai';
import * as dag from '../dag/mod';
import {MemStore} from '../kv/mod';
import {DEFAULT_HEAD_NAME} from './commit';
import {getRoot} from './root';

test('getRoot', async () => {
  const t = async (headVal: string | undefined, expected: string | Error) => {
    const kvs = new MemStore();
    const ds = new dag.Store(kvs);
    if (headVal !== undefined) {
      await ds.withWrite(async dw => {
        await dw.setHead(DEFAULT_HEAD_NAME, headVal);
        await dw.commit();
      });
    }
    if (expected instanceof Error) {
      let err;
      try {
        await getRoot(ds, DEFAULT_HEAD_NAME);
      } catch (e) {
        err = e;
      }
      expect(err).to.be.an.instanceof(expected.constructor);
      expect(err.message).to.equal(expected.message);
    } else {
      const actual = await getRoot(ds, DEFAULT_HEAD_NAME);
      expect(actual).to.equal(expected);
    }
  };

  await t(undefined, new Error('No head found for main'));
  await t('foo', 'foo');
});
