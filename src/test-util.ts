import {MutatorDefs, Replicache, BeginPullResult} from './replicache';
import type {ReplicacheOptions} from './replicache-options';
import * as kv from './kv/mod';
import {SinonFakeTimers, useFakeTimers} from 'sinon';
import * as sinon from 'sinon';
import type {ReadonlyJSONValue} from './json';
import {Hash, makeNewTempHashFunction} from './hash';

// fetch-mock has invalid d.ts file so we removed that on npm install.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import fetchMock from 'fetch-mock/esm/client';

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
    // indirection to allow test to spy on it.
    return super._invokePush();
  }

  protected override _memdagHashFunction(): <V extends ReadonlyJSONValue>(
    data: V,
  ) => Hash {
    return makeNewTempHashFunction();
  }

  protected override _invokePush(): Promise<boolean> {
    return this.invokePush();
  }

  protected override _beginPull(): Promise<BeginPullResult> {
    return this.beginPull();
  }

  persist() {
    return super._persist();
  }

  recoverMutations(): Promise<boolean> {
    return super._recoverMutations();
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

export function deleteAllDatabases(): void {
  for (const name of dbsToDrop) {
    indexedDB.deleteDatabase(name);
  }
  dbsToDrop.clear();
}

// eslint-disable-next-line @typescript-eslint/ban-types
export async function replicacheForTesting<MD extends MutatorDefs = {}>(
  name: string,
  options: Omit<ReplicacheOptions<MD>, 'name'> = {},
): Promise<ReplicacheTest<MD>> {
  const pullURL = 'https://pull.com/?name=' + name;
  const pushURL = 'https://push.com/?name=' + name;
  return replicacheForTestingNoDefaultURLs(name, {
    pullURL,
    pushURL,
    ...options,
  });
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
    ...rest
  }: Omit<ReplicacheOptions<MD>, 'name'> = {},
): Promise<ReplicacheTest<MD>> {
  const rep = new ReplicacheTest<MD>({
    pullURL,
    pushDelay,
    pushURL,
    name,
    ...rest,
  });
  dbsToDrop.add(rep.idbName);
  reps.add(rep);
  // Wait for open to be done.
  await rep.clientID;
  fetchMock.post(pullURL, {lastMutationID: 0, patch: []});
  fetchMock.post(pushURL, 'ok');
  await tickAFewTimes();
  return rep;
}

export let clock: SinonFakeTimers;

export function initReplicacheTesting() {
  fetchMock.config.overwriteRoutes = true;

  setup(() => {
    clock = useFakeTimers(0);
  });

  teardown(async () => {
    clock.restore();
    fetchMock.restore();
    sinon.restore();

    await closeAllReps();
    deleteAllDatabases();
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
