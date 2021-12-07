import {
  MutatorDefs,
  Replicache,
  BeginPullResult,
  MAX_REAUTH_TRIES,
} from './replicache';

export class ReplicacheTest<
  // eslint-disable-next-line @typescript-eslint/ban-types
  MD extends MutatorDefs = {},
> extends Replicache<MD> {
  beginPull(maxAuthTries = MAX_REAUTH_TRIES): Promise<BeginPullResult> {
    return super._beginPull(maxAuthTries);
  }

  maybeEndPull(beginPullResult: BeginPullResult): Promise<void> {
    return super._maybeEndPull(beginPullResult);
  }

  invokePush(maxAuthTries: number): Promise<boolean> {
    // indirection to allow test to spy on it.
    return super._invokePush(maxAuthTries);
  }

  protected override _invokePush(maxAuthTries: number): Promise<boolean> {
    return this.invokePush(maxAuthTries);
  }

  protected override _beginPull(
    maxAuthTries: number,
  ): Promise<BeginPullResult> {
    return this.beginPull(maxAuthTries);
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

export function deletaAllDatabases(): void {
  for (const name of dbsToDrop) {
    indexedDB.deleteDatabase(name);
  }
  dbsToDrop.clear();
}
