import type * as db from '../db/mod';
import type {PatchOperation} from '../puller';
import type {LogContext} from '../logger';

export async function apply(
  lc: LogContext,
  dbWrite: db.Write,
  patch: PatchOperation[],
): Promise<void> {
  for (const p of patch) {
    switch (p.op) {
      case 'put': {
        await dbWrite.put(lc, p.key, p.value);
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
