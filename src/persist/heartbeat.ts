import type {ClientID} from '../sync/client-id';
import type * as dag from '../dag/mod';
import {noUpdates, updateClients} from './clients';

const HEARTBEAT_INTERVAL_MS = 60 * 1000;

export function startHeartbeats(
  clientID: ClientID,
  dagStore: dag.Store,
): () => void {
  const intervalID = window.setInterval(async () => {
    await writeHeartbeat(clientID, dagStore);
  }, HEARTBEAT_INTERVAL_MS);
  return () => {
    window.clearInterval(intervalID);
  };
}

export async function writeHeartbeat(
  clientID: ClientID,
  dagStore: dag.Store,
): Promise<void> {
  const updatedClients = await updateClients(clients => {
    const client = clients.get(clientID);
    if (!client) {
      return Promise.resolve(noUpdates);
    }
    return Promise.resolve({
      clients: new Map(clients).set(clientID, {
        heartbeatTimestampMs: Date.now(),
        headHash: client.headHash,
      }),
    });
  }, dagStore);
  if (updatedClients.get(clientID) === undefined) {
    // Should this be a more specific error so caller can detect and handle?
    throw new Error('Cannot write heartbeat. Client with clientID not found');
  }
}
