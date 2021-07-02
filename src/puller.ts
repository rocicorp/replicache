import {httpRequest} from './http-request.js';
import type {JSONValue} from './json.js';
import type {HTTPRequestInfo} from './repm-invoker.js';

export type PullerResult = {
  response?: PullResponse;
  httpRequestInfo: HTTPRequestInfo;
};

/**
 * Puller is the function type used to do the fetch part of a pull.
 */
export type Puller = (request: Request) => Promise<PullerResult>;

/**
 * PullResponse defines the shape and type of the response of a pull. This is
 * the JSON you should return from your pull server endpoint.
 */
export type PullResponse = {
  cookie: JSONValue;
  lastMutationID: number;
  patch: PatchOperation[];
};

/**
 * This type describes the patch field in a [[PullResponse]] and it is used
 * to describe how to update the Replicache key-value store.
 */
export type PatchOperation =
  | {
      op: 'put';
      key: string;
      value: JSONValue;
    }
  | {op: 'del'; key: string}
  | {op: 'clear'};

export const defaultPuller: Puller = async request => {
  const {httpRequestInfo, response} = await httpRequest(request);
  if (httpRequestInfo.httpStatusCode !== 200) {
    return {
      httpRequestInfo,
    };
  }
  return {
    response: await response.json(),
    httpRequestInfo,
  };
};
