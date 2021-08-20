import type {Store} from '../dag/store';

export function getRoot(store: Store, headName: string): Promise<string> {
  return store.withRead(async read => {
    const head = await read.getHead(headName);
    if (head === undefined) {
      throw new Error(`No head found for ${headName}`);
    }
    return head;
  });
}
