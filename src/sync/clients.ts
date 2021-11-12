import {assertHash, assertNotTempHash, Hash} from './../hash';
import * as dag from '../dag/mod';
import type {ReadonlyJSONValue} from '../json';
import {assertNumber, assertObject} from '../asserts';
import {hasOwn} from '../has-own';

// TODO: Make ClientID an opaque type
type ClientID = string;
type ClientMap = Map<ClientID, Client>;

type Client = {
  // A UNIX timestamp in milliseconds updated by the client once a minute
  // while it is active and everytime the client persists its state to
  // the perdag.
  heartbeatTimestampMs: number;
  // The hash of the commit this session is currently at.
  headHash: Hash;
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

function clientMapToChunkData(clients: ClientMap): ReadonlyJSONValue {
  clients.forEach(client => {
    assertNotTempHash(client.headHash);
  });
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
  const chunkData = clientMapToChunkData(clients);
  const chunk = dag.Chunk.new(
    chunkData,
    Array.from(clients.values()).map(client => client.headHash),
  );
  return Promise.all([
    dagWrite.putChunk(chunk),
    dagWrite.setHead(CLIENTS_HEAD, chunk.hash),
  ]).then(() => undefined);
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
