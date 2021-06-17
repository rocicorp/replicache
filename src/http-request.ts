import type {JSONValue} from './json.js';
import type {HTTPRequestInfo} from './repm-invoker.js';

/**
 * This is used be the defaultPuller and defaultPusher to reduce code
 * duplication.
 */
export async function httpRequest(
  arg: {url: string; auth: string; requestID: string},
  body: JSONValue,
): Promise<{httpRequestInfo: HTTPRequestInfo; response: Response}> {
  /* eslint-disable @typescript-eslint/naming-convention */
  const headers = {
    'Content-type': 'application/json',
    Authorization: arg.auth,
    'X-Replicache-RequestID': arg.requestID,
  };
  /* eslint-disable @typescript-eslint/naming-convention */

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
