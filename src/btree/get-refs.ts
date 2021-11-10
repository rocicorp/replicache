import type {Hash} from '../hash';
import {
  DataNode,
  InternalNode,
  isInternalNode,
  NODE_ENTRIES,
} from './node-types';

export function getRefs(node: DataNode | InternalNode): Hash[] {
  if (isInternalNode(node)) {
    return node[NODE_ENTRIES].map(e => e[1]);
  }
  return [];
}
