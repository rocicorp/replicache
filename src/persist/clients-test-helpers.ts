import {ClientMap, updateClients} from './clients';
import type * as dag from '../dag/mod';

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
