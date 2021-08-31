import type * as db from '../db/mod';
import type {PatchOperation} from '../puller';
import type {LogContext} from '../logger';
import * as utf8 from '../utf8';

export async function apply(
  lc: LogContext,
  dbWrite: db.Write,
  patch: PatchOperation[],
): Promise<void> {
  for (const p of patch) {
    switch (p.op) {
      case 'put': {
        const value = utf8.encode(JSON.stringify(p.value));
        await dbWrite.put(lc, p.key, value);
        break;
      }
      case 'del':
        await dbWrite.del(lc, p.key);
        break;

      case 'clear':
        await dbWrite.clear();
        break;
    }
  }
}
