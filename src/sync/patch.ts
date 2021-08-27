import type * as db from '../db/mod';
import type {PatchOperation} from '../puller';
import type {LogContext} from '../rlog/logger';
import * as utf8 from '../utf8';

export async function apply(
  lc: LogContext,
  dbWrite: db.Write,
  patch: PatchOperation[],
): Promise<void> {
  for (const p of patch) {
    switch (p.op) {
      case 'put': {
        const key = utf8.encode(p.key);
        const value = utf8.encode(JSON.stringify(p.value));
        await dbWrite.put(lc, key, value);
        break;
      }
      case 'del': {
        const key = utf8.encode(p.key);
        await dbWrite.del(lc, key);
        break;
      }
      case 'clear':
        await dbWrite.clear();
        break;
    }
  }
}

// export function isPatchOperations(p: unknown): p is PatchOperation[] {
//   if (!Array.isArray(p)) {
//     return false;
//   }
//   return p.every(isPatchOperation);
// }

// function isPatchOperation(p: unknown): p is PatchOperation {
//   if (typeof p !== 'object' || p === null) {
//     return false;
//   }
//   const p2 = p as {op?: string; key?: string; value?: unknown};
//   switch (p2.op) {
//     case 'put':
//       return typeof p2.key === 'string' && typeof p2.value !== 'undefined';
//     case 'del':
//       return typeof p2.key === 'string';
//     case 'clear':
//       return true;
//   }
//   return false;
// }
