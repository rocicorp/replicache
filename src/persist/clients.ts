import {assertHash, assertNotTempHash, Hash, nativeHashOf} from '../hash';
import * as dag from '../dag/mod';
import {deepEqual, ReadonlyJSONValue} from '../json';
import {assertNumber, assertObject} from '../asserts';
import {hasOwn} from '../has-own';
import type {ClientID} from '../sync/client-id';
import {uuid as makeUuid} from '../sync/uuid';
import {Commit, newSnapshot} from '../db/commit';
import {BTreeWrite} from '../btree/write';

type ClientMap = Map<ClientID, Client>;

export type Client = {
  /**
   * A UNIX timestamp in milliseconds updated by the client once a minute
   * while it is active and everytime the client persists its state to
   * the perdag.
   */
  readonly heartbeatTimestampMs: number;
  /** The hash of the commit this session is currently at. */
  readonly headHash: Hash;
};
export const CLIENTS_HEAD = 'clients';

function assertClient(value: unknown): asserts value is Client {
  assertObject(value);
  const {heartbeatTimestampMs, headHash} = value;
  assertNumber(heartbeatTimestampMs);
  assertHash(headHash);
}

function chunkDataToClientMap(chunkData?: ReadonlyJSONValue): ClientMap {
  assertObject(chunkData);
  const clients: ClientMap = new Map();
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
  return clientMapToChunkDataNoHashValidation(clients);
}

function clientMapToChunkDataNoHashValidation(
  clients: ClientMap,
): ReadonlyJSONValue {
  return Object.fromEntries(clients);
}

export async function getClients(dagRead: dag.Read): Promise<ClientMap> {
  const hash = await dagRead.getHead(CLIENTS_HEAD);
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

export function setClients(
  clients: ClientMap,
  dagWrite: dag.Write,
): Promise<void> {
  return setClientsWithMakeChunk(clients, dagWrite, (chunkData, refs) =>
    dagWrite.createChunk(chunkData, refs),
  );
}

export function setClientsWithHash(
  clients: ClientMap,
  hash: Hash,
  dagWrite: dag.Write,
): Promise<void> {
  return setClientsWithMakeChunk(clients, dagWrite, (chunkData, refs) =>
    dag.createChunkWithHash(hash, chunkData, refs),
  );
}

export async function setClientsWithMakeChunk(
  clients: ClientMap,
  dagWrite: dag.Write,
  makeChunk: (chunkData: ReadonlyJSONValue, refs: readonly Hash[]) => dag.Chunk,
): Promise<void> {
  const chunkData = clientMapToChunkData(clients, dagWrite);
  const refs = Array.from(clients.values(), client => client.headHash);
  const chunk = makeChunk(chunkData, refs);
  await Promise.all([
    dagWrite.putChunk(chunk),
    dagWrite.setHead(CLIENTS_HEAD, chunk.hash),
  ]);
}

export async function setClient(
  id: ClientID,
  client: Client,
  dagWrite: dag.Write,
): Promise<void> {
  const clients = await getClients(dagWrite);
  clients.set(id, client);
  return setClients(clients, dagWrite);
}

export async function initClient(
  dagWrite: dag.Write,
): Promise<[ClientID, Client]> {
  const clients = await getClients(dagWrite);
  const newClientID = makeUuid();
  let bootstrapClient;
  for (const client of clients.values()) {
    if (
      !bootstrapClient ||
      bootstrapClient.heartbeatTimestampMs < client.heartbeatTimestampMs
    ) {
      bootstrapClient = client;
    }
  }

  let newClientCommit;
  if (bootstrapClient) {
    const bootstrapCommit = await Commit.baseSnapshot(
      bootstrapClient.headHash,
      dagWrite,
    );
    // Copy the snapshot with one change: set last mutation id to 0.  Replicache
    // server implementations expect new client ids to start with last mutation id 0.
    // If a server sees a new client id with a non-0 last mutation id, it may conclude
    // this is a very old client whose state has been garbage collected on the server.
    newClientCommit = newSnapshot(
      dagWrite.createChunk,
      bootstrapCommit.meta.basisHash,
      0 /* lastMutationID */,
      bootstrapCommit.meta.cookieJSON,
      bootstrapCommit.valueHash,
      bootstrapCommit.indexes,
    );
  } else {
    // No existing snapshot to bootstrap from. Create empty snapshot.
    const emptyBTreeHash = await new BTreeWrite(dagWrite).flush();
    newClientCommit = newSnapshot(
      dagWrite.createChunk,
      null /* basisHash */,
      0 /* lastMutationID */,
      null /* cookie */,
      emptyBTreeHash,
      [] /* indexes */,
    );
  }

  await dagWrite.putChunk(newClientCommit.chunk);
  const newClient = {
    heartbeatTimestampMs: Date.now(),
    headHash: newClientCommit.chunk.hash,
  };
  await setClient(newClientID, newClient, dagWrite);

  return [newClientID, newClient];
}

function nativeHashOfClients(clients: ClientMap): Promise<Hash> {
  const data = clientMapToChunkDataNoHashValidation(clients);
  return nativeHashOf(data);
}

/**
 * Updates the clients head with a new client. This is function retries a DAG
 * write transaction until the update succeeds without clobbering potential
 * other updates.
 *
 * @param perdag
 * @param clientID The ID of the client we are updating.
 * @param headHash The new head hash for the client.
 * @param tempHeadName The temporary head name used to ensure the chunks in the
 * DAG are not GC'ed until the DAG is fully updated.
 * @param clients The last `ClientMap` that we got. This is used for comparison
 * to ensure we are not updating a stale client map.
 */
export async function updateClients(
  perdag: dag.Store,
  clientID: ClientID,
  headHash: Hash,
  tempHeadName: string,
  clients: ClientMap,
): Promise<void> {
  assertNotTempHash(headHash);
  const updatedClient: Client = {
    heartbeatTimestampMs: Date.now(),
    headHash,
  };
  const updatedClients = new Map(clients);
  updatedClients.set(clientID, updatedClient);
  const hash = await nativeHashOfClients(updatedClients);

  const changedClients = await perdag.withWrite(async dagWrite => {
    const currentClients = await getClients(dagWrite);
    // We could compare the hashes instead but the code to pipe through the
    // hashes makes more things complicated.
    if (
      !deepEqual(
        // Our deepEqual is only defined on JSONValue so we cannot compare the two maps directly.
        Object.fromEntries(clients),
        Object.fromEntries(currentClients),
      )
    ) {
      // Not equal, return new clients and try again
      return currentClients;
    }

    currentClients.set(clientID, updatedClient);
    await Promise.all([
      setClientsWithHash(updatedClients, hash, dagWrite),
      // No need to keep this temp head any more.
      dagWrite.removeHead(tempHeadName),
    ]);
    return dagWrite.commit();
  });

  if (changedClients) {
    // Clients was not what was expected in the transaction. Try again.
    return updateClients(
      perdag,
      clientID,
      headHash,
      tempHeadName,
      changedClients,
    );
  }
}
