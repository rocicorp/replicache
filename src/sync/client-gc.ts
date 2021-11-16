import type {ClientID} from './client-id';
import type * as dag from '../dag/mod';
import {getClients, setClients} from './clients';

const CLIENT_MAX_INACTIVE_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const GC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function initClientGC(
  clientID: ClientID,
  dagStore: dag.Store,
): () => void {
  const intervalID = window.setInterval(async () => {
    await dagStore.withWrite(async (write: dag.Write) => {
      const clients = await getClients(write);
      const now = Date.now();
      const clientsAfterGC = Array.from(clients).filter(
        ([id, client]) =>
          id === clientID /* never collect ourself */ ||
          now - client.heartbeatTimestampMs <= CLIENT_MAX_INACTIVE_IN_MS,
      );
      if (clientsAfterGC.length !== clients.size) {
        await setClients(new Map(clientsAfterGC), write);
        await write.commit();
      }
    });
  }, GC_INTERVAL_MS);

  return () => {
    window.clearInterval(intervalID);
  };
}
