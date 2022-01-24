import type {ClientID} from '../sync/client-id';
import type * as dag from '../dag/mod';
import {ClientMap, noUpdates, updateClients} from './clients';

const HEARTBEAT_INTERVAL_MS = 60 * 1000;

let latestHeartbeatUpdate: Promise<ClientMap> | undefined;
export function getLatestHeartbeatUpdate(): Promise<ClientMap> | undefined {
  return latestHeartbeatUpdate;
}

export function startHeartbeats(
  clientID: ClientID,
  dagStore: dag.Store,
): () => void {
  const intervalID = window.setInterval(() => {
    latestHeartbeatUpdate = writeHeartbeat(clientID, dagStore);
  }, HEARTBEAT_INTERVAL_MS);
  return () => {
    window.clearInterval(intervalID);
  };
}

export async function writeHeartbeat(
  clientID: ClientID,
  dagStore: dag.Store,
): Promise<ClientMap> {
  const updatedClients = await updateClients(clients => {
    const client = clients.get(clientID);
    if (!client) {
      return noUpdates;
    }
    return {
      clients: new Map(clients).set(clientID, {
        heartbeatTimestampMs: Date.now(),
        headHash: client.headHash,
        mutationID: client.mutationID,
        lastServerAckdMutationID: client.lastServerAckdMutationID,
      }),
    };
  }, dagStore);
  if (updatedClients.get(clientID) === undefined) {
    // Should this be a more specific error so caller can detect and handle?
    throw new Error('Cannot write heartbeat. Client with clientID not found');
  }
  return updatedClients;
}
