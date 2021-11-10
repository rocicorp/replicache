import {MetaTyped} from './meta-typed';
import type {Hash} from '../hash';
import type {CommitData} from './commit';

export function getRefs(data: CommitData): Hash[] {
  const refs: Hash[] = [data.valueHash];
  const {meta} = data;
  switch (meta.type) {
    case MetaTyped.IndexChange:
      meta.basisHash && refs.push(meta.basisHash);
      break;
    case MetaTyped.Local:
      meta.basisHash && refs.push(meta.basisHash);
      // Local has weak originalHash
      break;
    case MetaTyped.Snapshot:
      // Snapshot has weak basisHash
      break;
  }

  for (const index of data.indexes) {
    refs.push(index.valueHash);
  }

  return refs;
}
