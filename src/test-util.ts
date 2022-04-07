import {expect} from '@esm-bundle/chai';
import {MutatorDefs, Replicache, BeginPullResult} from './replicache';
import type {
  ReplicacheOptions,
  ReplicacheInternalOptions,
} from './replicache-options';
import * as kv from './kv/mod';
import * as persist from './persist/mod';
import {SinonFakeTimers, useFakeTimers} from 'sinon';
import * as sinon from 'sinon';
import type {JSONValue, ReadonlyJSONValue} from './json';
import {Hash, makeNewTempHashFunction} from './hash';

// fetch-mock has invalid d.ts file so we removed that on npm install.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import fetchMock from 'fetch-mock/esm/client';
import {uuid} from './uuid';
import type {WriteTransaction} from './transactions.js';
import {TEST_LICENSE_KEY} from '@rocicorp/licensing/src/client';

export class ReplicacheTest<
  // eslint-disable-next-line @typescript-eslint/ban-types
  MD extends MutatorDefs = {},
> extends Replicache<MD> {
  beginPull(): Promise<BeginPullResult> {
    return super._beginPull();
  }

  maybeEndPull(beginPullResult: BeginPullResult): Promise<void> {
    return super._maybeEndPull(beginPullResult);
  }

  invokePush(): Promise<boolean> {
    return super._invokePush();
  }

  protected override _memdagHashFunction(): <V extends ReadonlyJSONValue>(
    data: V,
  ) => Hash {
    return makeNewTempHashFunction();
  }

  protected override _invokePush(): Promise<boolean> {
    // indirection to allow test to spy on it.
    return this.invokePush();
  }

  protected override _beginPull(): Promise<BeginPullResult> {
    return this.beginPull();
  }

  persist() {
    return super._persist();
  }

  recoverMutationsSpy = sinon.spy(this, 'recoverMutations');

  recoverMutations(): Promise<boolean> {
    return super._recoverMutations();
  }

  protected override _recoverMutations(): Promise<boolean> {
    // indirection to allow test to spy on it.
    return this.recoverMutations();
  }

  licenseActive(): Promise<boolean> {
    return this._licenseActivePromise;
  }

  licenseValid(): Promise<boolean> {
    return this._licenseCheckPromise;
  }

  get perdag() {
    // @ts-expect-error Property '_perdag' is private
    return this._perdag;
  }
}

export const reps: Set<ReplicacheTest> = new Set();

export async function closeAllReps(): Promise<void> {
  for (const rep of reps) {
    if (!rep.closed) {
      await rep.close();
    }
    reps.delete(rep);
  }
}

export const dbsToDrop: Set<string> = new Set();

export async function deleteAllDatabases(): Promise<void> {
  for (const name of dbsToDrop) {
    await kv.dropIDBStore(name);
  }
  dbsToDrop.clear();
}

const partialNamesToReplicacheNames: Map<string, string> = new Map();
/** Namespace replicache names to isolate tests' IndexedDB state. */
export function createReplicacheNameForTest(partialName: string): string {
  let replicacheName = partialNamesToReplicacheNames.get(partialName);
  if (!replicacheName) {
    const namespaceForTest = uuid();
    replicacheName = `${namespaceForTest}:${partialName}`;
    partialNamesToReplicacheNames.set(partialName, replicacheName);
  }
  return replicacheName;
}

type ReplicacheTestOptions<MD extends MutatorDefs> = Omit<
  ReplicacheOptions<MD>,
  'name' | 'licenseKey'
> & {
  onClientStateNotFound?: (() => void) | null;
  licenseKey?: string;
} & ReplicacheInternalOptions;

export async function replicacheForTesting<MD extends MutatorDefs = {}>(
  partialName: string,
  options: ReplicacheTestOptions<MD> = {},
): Promise<ReplicacheTest<MD>> {
  const pullURL = 'https://pull.com/?name=' + partialName;
  const pushURL = 'https://push.com/?name=' + partialName;
  return replicacheForTestingNoDefaultURLs(
    createReplicacheNameForTest(partialName),
    {
      pullURL,
      pushURL,
      licenseKey: options.licenseKey ?? TEST_LICENSE_KEY,
      ...options,
    },
  );
}

export async function replicacheForTestingNoDefaultURLs<
  // eslint-disable-next-line @typescript-eslint/ban-types
  MD extends MutatorDefs = {},
>(
  name: string,
  {
    pullURL,
    pushDelay = 60_000, // Large to prevent interfering
    pushURL,
    onClientStateNotFound = () => {
      throw new Error(
        'Unexpected call to onClientStateNotFound. Did you forget to pass it as an option?',
      );
    },
    ...rest
  }: ReplicacheTestOptions<MD> = {},
): Promise<ReplicacheTest<MD>> {
  const rep = new ReplicacheTest<MD>({
    pullURL,
    pushDelay,
    pushURL,
    name,
    licenseKey: TEST_LICENSE_KEY,
    ...rest,
  });
  dbsToDrop.add(rep.idbName);
  reps.add(rep);

  rep.onClientStateNotFound = onClientStateNotFound;

  // Wait for open to be done.
  await rep.clientID;
  fetchMock.post(pullURL, {lastMutationID: 0, patch: []});
  fetchMock.post(pushURL, 'ok');
  await tickAFewTimes();
  return rep;
}

export let clock: SinonFakeTimers;

export function initReplicacheTesting(): void {
  fetchMock.config.overwriteRoutes = true;

  setup(() => {
    clock = useFakeTimers(0);
    persist.setupIDBDatabasesStoreForTest();
  });

  teardown(async () => {
    clock.restore();
    fetchMock.restore();
    sinon.restore();
    partialNamesToReplicacheNames.clear();
    await closeAllReps();
    await deleteAllDatabases();
    await persist.teardownIDBDatabasesStoreForTest();
  });
}

export async function tickAFewTimes(n = 10, time = 10) {
  for (let i = 0; i < n; i++) {
    await clock.tickAsync(time);
  }
}

export async function tickUntil(f: () => boolean, msPerTest = 10) {
  while (!f()) {
    await clock.tickAsync(msPerTest);
  }
}

export class MemStoreWithCounters implements kv.Store {
  readonly store = new kv.MemStore();
  readCount = 0;
  writeCount = 0;
  closeCount = 0;

  resetCounters() {
    this.readCount = 0;
    this.writeCount = 0;
    this.closeCount = 0;
  }

  read() {
    this.readCount++;
    return this.store.read();
  }

  withRead<R>(fn: (read: kv.Read) => R | Promise<R>): Promise<R> {
    this.readCount++;
    return this.store.withRead(fn);
  }

  write() {
    this.writeCount++;
    return this.store.write();
  }

  withWrite<R>(fn: (write: kv.Write) => R | Promise<R>): Promise<R> {
    this.writeCount++;
    return this.store.withWrite(fn);
  }

  async close() {
    this.closeCount++;
    await this.store.close();
  }

  get closed(): boolean {
    return this.store.closed;
  }
}

export async function addData(
  tx: WriteTransaction,
  data: {[key: string]: JSONValue},
) {
  for (const [key, value] of Object.entries(data)) {
    await tx.put(key, value);
  }
}

export function expectLogContext(
  consoleLogStub: sinon.SinonStub,
  index: number,
  rep: Replicache,
  expectedContext: string,
) {
  expect(consoleLogStub.callCount).to.greaterThan(index);
  const {args} = consoleLogStub.getCall(index);
  expect(args).to.have.length(2);
  expect(args[0]).to.equal(`name=${rep.name}`);
  expect(args[1]).to.equal(expectedContext);
}
