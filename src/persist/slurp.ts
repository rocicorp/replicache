import type {Node} from '../btree/node';
import type * as dag from '../dag/mod';
import * as db from '../db/mod';
import type {Hash} from '../hash';
import type {Value} from '../kv/store';

class SlurpVisitor extends db.Visitor {
  private readonly _onChunk: (chunk: dag.Chunk<Value>) => void;

  constructor(dagRead: dag.Read, onChunk: (chunk: dag.Chunk<Value>) => void) {
    super(dagRead);
    this._onChunk = onChunk;
  }

  override visitCommitChunk(
    chunk: dag.Chunk<db.CommitData<db.Meta>>,
  ): Promise<void> {
    this._onChunk(chunk);
    return super.visitCommitChunk(chunk);
  }

  override visitBTreeNodeChunk(chunk: dag.Chunk<Node>): Promise<void> {
    this._onChunk(chunk);
    return super.visitBTreeNodeChunk(chunk);
  }
}

async function slurpInner(
  hash: Hash,
  dst: dag.Write,
  src: dag.Read,
): Promise<void> {
  const ps: Promise<void>[] = [];
  const slurpVisitor = new SlurpVisitor(src, chunk => {
    ps.push(dst.putChunk(chunk));
  });
  await slurpVisitor.visitCommit(hash);
  await Promise.all(ps);
}

/**
 * Copies all the chunks reachable from `hash` from `src` to `dst`.
 */
export function slurp(hash: Hash, dstStore: dag.Store, srcStore: dag.Store) {
  // dst is generally the memdag and we do not want to hold that open for longer
  // than necessary so we open the src/perdag first.
  return srcStore.withRead(async srcRead => {
    await dstStore.withWrite(async dstWrite => {
      await Promise.all([
        slurpInner(hash, dstWrite, srcRead),
        dstWrite.setHead(db.DEFAULT_HEAD_NAME, hash),
      ]);
      await dstWrite.commit();
    });
  });
}
