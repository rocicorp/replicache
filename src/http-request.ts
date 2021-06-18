import type {JSONValue} from './json.js';
import type {HTTPRequestInfo} from './repm-invoker.js';

export type FetchArgs = {
  /** The URL of the server to POST the pull/push request to. */
  url: string;

  /**
   * This is the authentication that is sent to the server. Normally as
   * `Authorization` HTTP header.
   */
  auth: string;

  /**
   * The requestID is sent to the server to make things easier to debug.
   */
  requestID: string;
};

/**
 * This is used be the defaultPuller and defaultPusher to reduce code
 * duplication.
 */
export async function httpRequest(
  arg: FetchArgs,
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
