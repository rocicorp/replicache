import {Client, ClientMap, updateClients} from './clients';
import type * as dag from '../dag/mod';
import type {Hash} from '../mod';

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
