import type {FetchFunc, FetchResponse} from '@rocicorp/licensing/src/client';

export const fetchWrapper: FetchFunc = nodeFetchWrapper;

export async function nodeFetchWrapper(
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
