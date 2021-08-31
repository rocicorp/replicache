// Test utils
import type {ReplicacheTest} from './replicache';
import * as utf8 from './utf8';

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

export function b(
  templatePart: TemplateStringsArray,
  ...placeholderValues: unknown[]
): Uint8Array {
  let s = templatePart[0];
  for (let i = 1; i < templatePart.length; i++) {
    s += String(placeholderValues[i - 1]) + templatePart[i];
  }
  return utf8.encode(s);
}
