import {expect} from '@esm-bundle/chai';
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
import type {Store, Value} from '../kv/store';
import {TestMemStore} from '../kv/test-mem-store';
import {LogContext} from '../logger';

setup(async () => {
  await initHasher();
});

async function testMigrate(
  inputdata: Record<string, Uint8Array>,
  expected: Record<string, Value>,
): Promise<void> {
  const kv = new TestMemStore();
  await writeSampleData(kv, inputdata);

  await migrate(kv, new LogContext());

  const actual = Object.fromEntries(kv.entries());
  expect(actual).to.deep.equal(expected);
}

test('chat sample', async () => {
  await testMigrate(chatSampleV0, chatSampleV1);
});

test('test data sample', async () => {
  await testMigrate(testDataV0, testDataV1);
});

test('test data sample with index', async () => {
  await testMigrate(testIndexDataV0, testIndexDataV1);
});

async function writeSampleData(
  kv: Store,
  data: Record<string, Value | Uint8Array>,
): Promise<void> {
  return kv.withWrite(async w => {
    for (const [key, value] of Object.entries(data)) {
      // @ts-expect-error Allow writing Uint8Array
      await w.put(key, value);
    }
    await w.commit();
  });
}
