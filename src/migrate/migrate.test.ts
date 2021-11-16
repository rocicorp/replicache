import {expect} from '@esm-bundle/chai';
import * as dag from '../dag/mod';
import {initHasher} from '../hash';
import {
  chatSampleV0,
  chatSampleV1,
  chatSampleV2,
  testDataV0,
  testDataV1,
  testDataV2,
  testIndexDataV0,
  testIndexDataV1,
  testIndexDataV2,
} from './migrate-sample-data';
import type {Store, Value} from '../kv/store';
import {TestMemStore} from '../kv/test-mem-store';
import {LogContext} from '../logger';
import {migrate} from './migrate';
import {migrate0to1} from './migrate-0-to-1';
import {migrate1to2} from './migrate-1-to-2';

setup(async () => {
  await initHasher();
});

async function testMigrate(
  inputdata: Record<string, Uint8Array>,
  expected: Record<string, Value>,
): Promise<void> {
  const kvStore = new TestMemStore();
  await writeSampleData(kvStore, inputdata);

  await migrate(kvStore, new LogContext());

  const actual = Object.fromEntries(kvStore.entries());
  expect(actual).to.deep.equal(expected);
}

async function testMigrate0to1(
  inputdata: Record<string, Uint8Array>,
  expected: Record<string, Value>,
): Promise<void> {
  const kvStore = new TestMemStore();
  await writeSampleData(kvStore, inputdata);

  await kvStore.withWrite(async kvWrite => {
    await migrate0to1(kvWrite, new LogContext());
    await kvWrite.commit();
  });

  const actual = Object.fromEntries(kvStore.entries());
  expect(actual).to.deep.equal(expected);
}

async function testMigrate1to2(
  inputdata: Record<string, Value>,
  expected: Record<string, Value>,
): Promise<void> {
  const kvStore = new TestMemStore();
  await writeSampleData(kvStore, inputdata);

  const dagStore = new dag.TestStore(kvStore);
  await dagStore.withWrite(async dagWrite => {
    await migrate1to2(dagWrite, new LogContext());
    await dagWrite.commit();
  });

  const actual = Object.fromEntries(kvStore.entries());
  expect(actual).to.deep.equal(expected);
}

test('chat sample (0 to 1)', async () => {
  await testMigrate0to1(chatSampleV0, chatSampleV1);
});

test('test data sample (0 to 1)', async () => {
  await testMigrate0to1(testDataV0, testDataV1);
});

test('test data sample with index (0 to 1)', async () => {
  await testMigrate0to1(testIndexDataV0, testIndexDataV1);
});

test('chat sample (1 to 2)', async () => {
  await testMigrate1to2(chatSampleV1, chatSampleV2);
});

test('test data sample (1 to 2)', async () => {
  await testMigrate1to2(testDataV1, testDataV2);
});

test('test data sample with index (1 to 2)', async () => {
  await testMigrate1to2(testIndexDataV1, testIndexDataV2);
});

test('chat sample (0 to 2)', async () => {
  await testMigrate(chatSampleV0, chatSampleV2);
});

test('test data sample (0 to 2)', async () => {
  await testMigrate(testDataV0, testDataV2);
});

test('test data sample with index (0 to 2)', async () => {
  await testMigrate(testIndexDataV0, testIndexDataV2);
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
