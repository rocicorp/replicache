import type {ClientID} from '../sync/client-id';
import type * as dag from '../dag/mod';
import {noUpdates, updateClients} from './clients';

const CLIENT_MAX_INACTIVE_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const GC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function initClientGC(
  clientID: ClientID,
  dagStore: dag.Store,
): () => void {
  const intervalID = window.setInterval(async () => {
    await updateClients(clients => {
      const now = Date.now();
      const clientsAfterGC = Array.from(clients).filter(
        ([id, client]) =>
          id === clientID /* never collect ourself */ ||
          now - client.heartbeatTimestampMs <= CLIENT_MAX_INACTIVE_IN_MS,
      );
      if (clientsAfterGC.length === clients.size) {
        return noUpdates;
      }
      return {
        clients: new Map(clientsAfterGC),
      };
    }, dagStore);
  }, GC_INTERVAL_MS);

  return () => {
    window.clearInterval(intervalID);
  };
}
