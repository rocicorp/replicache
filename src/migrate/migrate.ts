import type * as kv from '../kv/mod';
import {currentVersion, migrate0to1} from './migrate-0-to-1';

export async function migrate(store: kv.Store): Promise<void> {
  const v = await store.withRead(currentVersion);
  if (v === 0) {
    await store.withWrite(async w => {
      await migrate0to1(w);
      await w.commit();
    });
  }
}
