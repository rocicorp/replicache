import type {ReadonlyJSONValue} from '../json';
import type {Hash} from '../hash';
import type {Entry} from './entry-type';

export const NODE_LEVEL = 0;
export const NODE_ENTRIES = 1;

/**
 * The type of B+Tree node chunk data
 */
type BaseNode<V> = readonly [level: number, entries: ReadonlyArray<Entry<V>>];

export type InternalNode = BaseNode<Hash>;

export type DataNode = BaseNode<ReadonlyJSONValue>;

export function isInternalNode(
  node: DataNode | InternalNode,
): node is InternalNode {
  return node[NODE_LEVEL] > 0;
}
