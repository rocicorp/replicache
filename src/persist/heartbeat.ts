import type {ClientID} from '../sync/client-id';
import type * as dag from '../dag/mod';
import {
  ClientMap,
  ClientStateNotFoundError,
  noUpdates,
  updateClients,
} from './clients';
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
  onClientStateNotFound: () => void,
  lc: LogContext,
): () => void {
  return initBgIntervalProcess(
    'Heartbeat',
    async () => {
      latestHeartbeatUpdate = writeHeartbeat(clientID, dagStore);
      try {
        return await latestHeartbeatUpdate;
      } catch (e) {
        if (e instanceof ClientStateNotFoundError) {
          onClientStateNotFound();
          return;
        }
        throw e;
      }
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
    throw new ClientStateNotFoundError(clientID);
  }
  return updatedClients;
}
