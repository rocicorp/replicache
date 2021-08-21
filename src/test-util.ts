// Test utils
import type {ReplicacheTest} from './replicache.js';

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

const textEncoder = new TextEncoder();

export function stringToUint8Array(str: string): Uint8Array {
  return textEncoder.encode(str);
}

export function b(x: TemplateStringsArray): Uint8Array {
  return textEncoder.encode(x[0]);
}
