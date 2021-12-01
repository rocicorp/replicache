import {assert} from '../asserts';
import type * as dag from '../dag/mod';
import * as db from '../db/mod';
import * as sync from '../sync/mod';
import {Hash, nativeHashOf} from '../hash';
import type {ClientID} from '../sync/client-id';
import {getClients, updateClients} from './clients';
import {ComputeHashTransformer, FixedChunks} from './compute-hash-transformer';
import {GatherVisitor} from './gather-visitor';
import {FixupTransformer} from './fixup-transformer';
import type {ReadonlyJSONValue} from '../json';

export async function persist(
  clientID: ClientID,
  memdag: dag.Store,
  perdag: dag.Store,
): Promise<void> {
  // 1. Gather all temp chunks from main head on the memdag
  const [gatheredChunks, mainHeadTempHash] = await gatherTempChunks(memdag);

  // 2. Compute the hashes for these gathered chunks.\
  const [fixedChunks, mappings, mainHeadHash] = await computeHashes(
    gatheredChunks,
    mainHeadTempHash,
  );

  // 3. write and fixup temp chunks to perdag
  await writeFixedChunks(perdag, fixedChunks, mainHeadHash, clientID);

  // 4. fixup the memdag with the new hashes
  await fixupMemdagWithNewHashes(memdag, mappings);
}

async function gatherTempChunks(
  memdag: dag.Store,
): Promise<[ReadonlyMap<Hash, dag.Chunk>, Hash]> {
  return await memdag.withRead(async dagRead => {
    const mainHeadHash = await dagRead.getHead(db.DEFAULT_HEAD_NAME);
    assert(mainHeadHash);
    const visitor = new GatherVisitor(dagRead);
    await visitor.visitCommit(mainHeadHash);
    return [visitor.gatheredChunks, mainHeadHash];
  });
}

async function computeHashes(
  gatheredChunks: ReadonlyMap<Hash, dag.Chunk<ReadonlyJSONValue>>,
  mainHeadTempHash: Hash,
): Promise<[FixedChunks, ReadonlyMap<Hash, Hash>, Hash]> {
  const transformer = new ComputeHashTransformer(gatheredChunks, nativeHashOf);
  const mainHeadHash = await transformer.transformCommit(mainHeadTempHash);
  const {fixedChunks, mappings} = transformer;
  return [fixedChunks, mappings, mainHeadHash];
}

async function fixupMemdagWithNewHashes(
  memdag: dag.Store,
  mappings: ReadonlyMap<Hash, Hash>,
) {
  await memdag.withWrite(async dagWrite => {
    for (const headName of [db.DEFAULT_HEAD_NAME, sync.SYNC_HEAD_NAME]) {
      const headHash = await dagWrite.getHead(headName);
      if (!headHash) {
        if (headName === sync.SYNC_HEAD_NAME) {
          // It is OK to not have a sync head.
          break;
        }
        throw new Error(`No head found for ${headName}`);
      }
      const transformer = new FixupTransformer(dagWrite, mappings);
      const newHeadHash = await transformer.transformCommit(headHash);
      await dagWrite.setHead(headName, newHeadHash);
    }
    await dagWrite.commit();
  });
}

async function writeFixedChunks(
  perdag: dag.Store,
  fixedChunks: FixedChunks,
  mainHeadHash: Hash,
  clientID: string,
) {
  const tempHeadName = `${clientID}-fixed-chunks`;

  const clients = await perdag.withWrite(async dagWrite => {
    const ps: Promise<void>[] = [];
    for (const chunk of fixedChunks.values()) {
      ps.push(dagWrite.putChunk(chunk));
    }

    // We set a head here to make sure the chunks are not garbage collected.
    // This head will be removed when the clients head is updated.
    ps.push(dagWrite.setHead(tempHeadName, mainHeadHash));

    const clients = await getClients(dagWrite);

    await Promise.all(ps);
    await dagWrite.commit();
    return clients;
  });

  return updateClients(perdag, clientID, mainHeadHash, tempHeadName, clients);
}
