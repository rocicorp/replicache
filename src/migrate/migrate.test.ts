import {expect} from '@esm-bundle/chai';
import {MemStore} from '../kv/mod';
import {initHasher} from '../hash';
import {
  chatSampleV0,
  chatSampleV1,
  testDataV0,
  testDataV1,
  testIndexDataV0,
  testIndexDataV1,
} from './migrate-sample-data';
import {migrate} from './migrate';
import type {Value} from '../kv/store';

setup(async () => {
  await initHasher();
});

async function testMigrate(
  inputdata: Record<string, Value>,
  expected: Record<string, Value>,
): Promise<void> {
  const kv = new MemStore();
  await writeSampleData(kv, inputdata);

  await migrate(kv);

  // @ts-expect-error Using private property.
  const actual = Object.fromEntries(kv._map.entries());
  expect(actual).to.deep.equal(expected);
}

test('chat sample', async () => {
  await testMigrate(chatSampleV0, chatSampleV1);
});

test('test data sample', async () => {
  await testMigrate(testDataV0, testDataV1);
});

test.only('test data sample with index', async () => {
  await testMigrate(testIndexDataV0, testIndexDataV1);
});

async function writeSampleData(
  kv: MemStore,
  data: Record<string, Value>,
): Promise<void> {
  return kv.withWrite(async w => {
    for (const [key, value] of Object.entries(data)) {
      await w.put(key, value);
    }
    await w.commit();
  });
}
