import type {JSONValue} from './json.js';
import type {HTTPRequestInfo} from './repm-invoker.js';

function getHeaders(arg: {auth: string; requestID: string}): {
  [key: string]: string;
} {
  /* eslint-disable @typescript-eslint/naming-convention */
  return {
    'Content-type': 'application/json',
    Authorization: arg.auth,
    'X-Replicache-RequestID': arg.requestID,
  };
  /* eslint-disable @typescript-eslint/naming-convention */
}

export async function httpRequest(
  arg: {url: string; auth: string; requestID: string},
  body: JSONValue,
): Promise<{httpRequestInfo: HTTPRequestInfo; response: Response}> {
  const headers = getHeaders(arg);
  const response = await fetch(arg.url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const httpStatusCode = response.status;
  const errorMessage = httpStatusCode === 200 ? '' : await response.text();
  return {
    response,
    httpRequestInfo: {
      httpStatusCode,
      errorMessage,
    },
  };
}
