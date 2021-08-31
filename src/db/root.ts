import type * as dag from '../dag/mod';

export function getRoot(store: dag.Store, headName: string): Promise<string> {
  return store.withRead(async read => {
    const head = await read.getHead(headName);
    if (head === undefined) {
      throw new Error(`No head found for ${headName}`);
    }
    return head;
  });
}
