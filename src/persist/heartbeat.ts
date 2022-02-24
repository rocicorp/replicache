import type {ClientID} from '../sync/client-id';
import type * as dag from '../dag/mod';
import {ClientMap, noUpdates, updateClients} from './clients';
import type {LogContext} from '../logger';
import {initBgIntervalProcess} from './bg-interval';

const HEARTBEAT_INTERVAL_MS = 60 * 1000;

let latestHeartbeatUpdate: Promise<ClientMap> | undefined;
export function getLatestHeartbeatUpdate(): Promise<ClientMap> | undefined {
  return latestHeartbeatUpdate;
}
export function startHeartbeats(
  clientID: ClientID,
  dagStore: dag.Store,
  lc: LogContext,
): () => void {
  return initBgIntervalProcess(
    'Heartbeat',
    () => {
      latestHeartbeatUpdate = writeHeartbeat(clientID, dagStore);
      return latestHeartbeatUpdate;
    },
    HEARTBEAT_INTERVAL_MS,
    lc,
  );
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
