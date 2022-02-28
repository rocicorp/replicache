import type {FetchResponse} from '@rocicorp/licensing/src/client';

// This wrapper around fetch adapts it to the narrow fetch interface
// that the licensing client expects. That type enables the licensing
// client to work with both the browser and node-fetch implementations.
export async function browserSimpleFetch(
  method: string,
  url: string,
  body: string | null,
  headers: string[][],
): Promise<FetchResponse> {
  const requestInit = {
    method,
    body,
    headers,
  };
  return fetch(url, requestInit);
}
