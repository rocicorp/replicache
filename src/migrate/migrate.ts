import type * as kv from '../kv/mod';
import type {LogContext} from '../logger';
import {currentVersion, migrate0to1} from './migrate-0-to-1';

export async function migrate(store: kv.Store, lc: LogContext): Promise<void> {
  const v = await store.withRead(currentVersion);
  lc.debug?.('migrate, current version:', v);
  if (v === 0) {
    await store.withWrite(async w => {
      await migrate0to1(w, lc);
      await w.commit();
    });
  }
}
