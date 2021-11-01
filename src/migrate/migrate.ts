import * as dag from '../dag/mod';
import {currentVersion, migrate0to1} from './migrate-0-to-1';
import {migrate1to2} from './migrate-1-to-2';
import type * as kv from '../kv/mod';
import type {LogContext} from '../logger';

export async function migrate(
  kvStore: kv.Store,
  lc: LogContext,
): Promise<void> {
  let v = await kvStore.withRead(currentVersion);
  lc.debug?.('migrate, current version:', v);
  if (v === 0) {
    await kvStore.withWrite(async kvWrite => {
      await migrate0to1(kvWrite, lc);
      await kvWrite.commit();
      v = 1;
    });
  }

  if (v === 1) {
    const dagStore = new dag.Store(kvStore);
    await dagStore.withWrite(async dagWrite => {
      await migrate1to2(dagWrite, lc);
      await dagWrite.commit();
    });
  }
}
