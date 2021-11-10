import {ChunkType} from './chunk-type';
import {getRefs as getRefsFromCommit} from '../db/get-refs';
import {getRefs as getRefsFromBTreeNode} from '../btree/get-refs';
import type {Hash} from '../hash';
import type {Value} from '../kv/store';
import type {CommitData} from '../db/commit';
import type {DataNode, InternalNode} from '../btree/node-types';
import type {Refs} from './chunk';

export function getRefs<V extends Value = Value>(
  type: ChunkType,
  data: V,
): Refs {
  switch (type) {
    case ChunkType.Commit:
      return getRefsFromCommit(data as CommitData);
    case ChunkType.BTreeNode:
      return getRefsFromBTreeNode(data as DataNode | InternalNode);
    case ChunkType.ProllyMap:
    case ChunkType.NoRefs:
      return [];
    case ChunkType.Test:
      return (data as [unknown, readonly Hash[]])[1];
  }
  throw new Error('unreachable');
}
