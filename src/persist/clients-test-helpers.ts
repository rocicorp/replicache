import {Client, ClientMap, updateClients} from './clients';
import type * as dag from '../dag/mod';
import type * as sync from '../sync/mod';
import type {Hash} from '../hash';

export function setClients(
  clients: ClientMap,
  dagStore: dag.Store,
): Promise<ClientMap> {
  return updateClients(_ => {
    return Promise.resolve({
      clients,
    });
  }, dagStore);
}

export function makeClient(partialClient: {
  heartbeatTimestampMs: number;
  headHash: Hash;
  mutationID?: number;
  lastServerAckdMutationID?: number;
}): Client {
  return {
    mutationID: 0,
    lastServerAckdMutationID: 0,
    ...partialClient,
  };
}

export async function deleteClientForTesting(
  clientID: sync.ClientID,
  dagStore: dag.Store,
): Promise<void> {
  await updateClients(clients => {
    const clientsAfterGC = new Map(clients);
    clientsAfterGC.delete(clientID);
    return {
      clients: new Map(clientsAfterGC),
    };
  }, dagStore);
}
