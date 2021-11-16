import type {ClientID} from './client-id';
import type * as dag from '../dag/mod';
import {getClient, setClient} from './clients';

const HEARTBEAT_INTERVAL_MS = 60 * 1000;

export function startHeartbeats(
  clientID: ClientID,
  dagStore: dag.Store,
): () => void {
  const intervalID = window.setInterval(async () => {
    await dagStore.withWrite(async (write: dag.Write) => {
      await writeHeartbeat(clientID, write);
      await write.commit();
    });
  }, HEARTBEAT_INTERVAL_MS);
  return () => {
    window.clearInterval(intervalID);
  };
}

export async function writeHeartbeat(
  clientID: ClientID,
  write: dag.Write,
): Promise<void> {
  const client = await getClient(clientID, write);
  if (!client) {
    // Should this be a more specific error so caller can detect and handle?
    throw new Error('Cannot write heartbeat. Client with clientID not found');
  }

  await setClient(
    clientID,
    {
      heartbeatTimestampMs: Date.now(),
      headHash: client.headHash,
    },
    write,
  );
}
