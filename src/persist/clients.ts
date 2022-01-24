import {assertHash, Hash, hashOf} from '../hash';
import * as btree from '../btree/mod';
import * as dag from '../dag/mod';
import * as db from '../db/mod';
import type {ReadonlyJSONValue} from '../json';
import {assertNotUndefined, assertNumber, assertObject} from '../asserts';
import {hasOwn} from '../has-own';
import type {ClientID} from '../sync/client-id';
import {uuid as makeUuid} from '../sync/uuid';
import {getRefs, newSnapshotCommitData} from '../db/commit';
import type {MaybePromise} from '../mod';

export type ClientMap = ReadonlyMap<ClientID, Client>;

export type Client = {
  /**
   * A UNIX timestamp in milliseconds updated by the client once a minute
   * while it is active and everytime the client persists its state to
   * the perdag.
   * Should only be updated by the client represented by this structure.
   */
  readonly heartbeatTimestampMs: number;
  /**
   * The hash of the commit in the perdag this client last persisted.
   * Should only be updated by the client represented by this structure.
   */
  readonly headHash: Hash;
  /**
   * The mutationID of commit at headHash (mutationID if it is a
   * local commit, lastMutationID if a index change or snapshot commit).
   * Should only be updated by the client represented by this structure.
   * Read by other clients to determine if there are unacknowledged pending
   * mutations for them to push on behalf of the client represented by this
   * structure.
   * This is redundant with information in the commit graph at headHash,
   * but allows other clients to determine if there are unacknowledged pending
   * mutations without having to load the commit graph at headHash.
   */
  readonly mutationID: number;
  /**
   * The highest lastMutationID received from the server for this client.
   *
   * Should be updated by the client represented by this structure whenever
   * it persists its state to the perdag.
   * Read by other clients to determine if there are un-acknowledge pending
   * mutations for them to push on behalf of the client represented by this
   * structure, and *updated* by other client's upon successfully pushing
   * pending mutation to avoid redundant pushes of pending mutations.
   *
   * Note: This will be the same as the lastMutationID of the base snapshot of
   * the commit graph at headHash when written by the client represented by this
   * structure.  However, when written by another client pushing pending
   * mutations on this client's behalf it will be different, because the other
   * client does not update the commit graph (it is unsafe to update another
   * client's commit graph).
   */
  readonly lastServerAckdMutationID: number;
};
const CLIENTS_HEAD = 'clients';

function assertClient(value: unknown): asserts value is Client {
  assertObject(value);
  const {heartbeatTimestampMs, headHash} = value;
  assertNumber(heartbeatTimestampMs);
  assertHash(headHash);
}

function chunkDataToClientMap(chunkData?: ReadonlyJSONValue): ClientMap {
  assertObject(chunkData);
  const clients = new Map();
  for (const key in chunkData) {
    if (hasOwn(chunkData, key)) {
      const value = chunkData[key];
      if (value !== undefined) {
        assertClient(value);
        clients.set(key, value);
      }
    }
  }
  return clients;
}

function clientMapToChunkData(
  clients: ClientMap,
  dagWrite: dag.Write,
): ReadonlyJSONValue {
  clients.forEach(client => {
    dagWrite.assertValidHash(client.headHash);
  });
  return Object.fromEntries(clients);
}

function clientMapToChunkDataNoHashValidation(
  clients: ClientMap,
): ReadonlyJSONValue {
  return Object.fromEntries(clients);
}

export async function getClients(dagRead: dag.Read): Promise<ClientMap> {
  const hash = await dagRead.getHead(CLIENTS_HEAD);
  return getClientsAtHash(hash, dagRead);
}

async function getClientsAtHash(
  hash: Hash | undefined,
  dagRead: dag.Read,
): Promise<ClientMap> {
  if (!hash) {
    return new Map();
  }
  const chunk = await dagRead.getChunk(hash);
  return chunkDataToClientMap(chunk?.data);
}

export async function getClient(
  id: ClientID,
  dagRead: dag.Read,
): Promise<Client | undefined> {
  const clients = await getClients(dagRead);
  return clients.get(id);
}

export async function initClient(
  dagStore: dag.Store,
): Promise<[ClientID, Client]> {
  const newClientID = makeUuid();
  const updatedClients = await updateClients(async clients => {
    let bootstrapClient: Client | undefined;
    for (const client of clients.values()) {
      if (
        !bootstrapClient ||
        bootstrapClient.heartbeatTimestampMs < client.heartbeatTimestampMs
      ) {
        bootstrapClient = client;
      }
    }

    let newClientCommitData;
    const chunksToPut = [];
    if (bootstrapClient) {
      const constBootstrapClient = bootstrapClient;
      newClientCommitData = await dagStore.withRead(async dagRead => {
        const bootstrapCommit = await db.baseSnapshot(
          constBootstrapClient.headHash,
          dagRead,
        );
        // Copy the snapshot with one change: set last mutation id to 0.  Replicache
        // server implementations expect new client ids to start with last mutation id 0.
        // If a server sees a new client id with a non-0 last mutation id, it may conclude
        // this is a very old client whose state has been garbage collected on the server.
        return newSnapshotCommitData(
          bootstrapCommit.meta.basisHash,
          0 /* lastMutationID */,
          bootstrapCommit.meta.cookieJSON,
          bootstrapCommit.valueHash,
          bootstrapCommit.indexes,
        );
      });
    } else {
      // No existing snapshot to bootstrap from. Create empty snapshot.
      const emptyBTreeChunk = await dag.createChunkWithNativeHash(
        btree.emptyDataNode,
        [],
      );
      chunksToPut.push(emptyBTreeChunk);
      newClientCommitData = newSnapshotCommitData(
        null /* basisHash */,
        0 /* lastMutationID */,
        null /* cookie */,
        emptyBTreeChunk.hash,
        [] /* indexes */,
      );
    }

    const newClientCommitChunk = await dag.createChunkWithNativeHash(
      newClientCommitData,
      getRefs(newClientCommitData),
    );
    chunksToPut.push(newClientCommitChunk);

    return {
      clients: new Map(clients).set(newClientID, {
        heartbeatTimestampMs: Date.now(),
        headHash: newClientCommitChunk.hash,
        mutationID: 0,
        lastServerAckdMutationID: 0,
      }),
      chunksToPut,
    };
  }, dagStore);
  const newClient = updatedClients.get(newClientID);
  assertNotUndefined(newClient);
  return [newClientID, newClient];
}

function hashOfClients(clients: ClientMap): Promise<Hash> {
  const data = clientMapToChunkDataNoHashValidation(clients);
  return hashOf(data);
}

export const noUpdates = Symbol();
export type NoUpdates = typeof noUpdates;

export type ClientsUpdate = (
  clients: ClientMap,
) => MaybePromise<
  {clients: ClientMap; chunksToPut?: Iterable<dag.Chunk>} | NoUpdates
>;

export async function updateClients(
  update: ClientsUpdate,
  dagStore: dag.Store,
): Promise<ClientMap> {
  const [clients, clientsHash] = await dagStore.withRead(async dagRead => {
    const clientsHash = await dagRead.getHead(CLIENTS_HEAD);
    const clients = await getClientsAtHash(clientsHash, dagRead);
    return [clients, clientsHash];
  });
  return updateClientsInternal(update, clients, clientsHash, dagStore);
}

async function updateClientsInternal(
  update: ClientsUpdate,
  clients: ClientMap,
  clientsHash: Hash | undefined,
  dagStore: dag.Store,
): Promise<ClientMap> {
  const updateResults = await update(clients);
  if (updateResults === noUpdates) {
    return clients;
  }
  const {clients: updatedClients, chunksToPut} = updateResults;
  const updatedClientsHash = await hashOfClients(updatedClients);
  const result = await dagStore.withWrite(async dagWrite => {
    const currClientsHash = await dagWrite.getHead(CLIENTS_HEAD);
    if (currClientsHash !== clientsHash) {
      // Conflict!  Someone else updated the ClientsMap.  Retry update.
      return {
        updateApplied: false,
        clients: await getClientsAtHash(currClientsHash, dagWrite),
        clientsHash: currClientsHash,
      };
    }
    const updatedClientsChunkData = clientMapToChunkData(
      updatedClients,
      dagWrite,
    );
    const updateClientsRefs = Array.from(
      updatedClients.values(),
      client => client.headHash,
    );
    const updateClientsChunk = dag.createChunkWithHash(
      updatedClientsHash,
      updatedClientsChunkData,
      updateClientsRefs,
    );
    const chunksToPutPromises: Promise<void>[] = [];
    if (chunksToPut) {
      for (const chunk of chunksToPut) {
        chunksToPutPromises.push(dagWrite.putChunk(chunk));
      }
    }
    await Promise.all([
      ...chunksToPutPromises,
      dagWrite.putChunk(updateClientsChunk),
      dagWrite.setHead(CLIENTS_HEAD, updateClientsChunk.hash),
    ]);
    await dagWrite.commit();
    return {
      updateApplied: true,
      clients: updatedClients,
      clientsHash: updatedClientsHash,
    };
  });
  if (result.updateApplied) {
    return result.clients;
  } else {
    return updateClientsInternal(
      update,
      result.clients,
      result.clientsHash,
      dagStore,
    );
  }
}
