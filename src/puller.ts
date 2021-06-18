import {httpRequest} from './http-request.js';
import type {FetchArgs} from './http-request.js';
import type {JSONValue} from './json.js';
import type {HTTPRequestInfo} from './repm-invoker.js';

/**
 * Puller is the function type used to do the fetch part of a pull.
 * @param args
 * @param body This is the JSON body that is normally posted to the server.
 */
export type Puller = (
  arg: FetchArgs,
  body: PullerBody,
) => Promise<PullerResult>;

/**
 * This is the JSON body that is normally posted to the server.
 */
export type PullerBody = {
  clientID: string;
  cookie: JSONValue;
  lastMutationID: number;
  pullVersion: number;
  schemaVersion: string;
};

export type PullerResult = {
  response?: PullResponse;
  httpRequestInfo: HTTPRequestInfo;
};

export type PullResponse = {
  cookie: JSONValue;
  lastMutationID: number;
  patch: PatchOperation[];
};

export type PatchOperation =
  | {
      op: 'put';
      key: string;
      value: JSONValue;
    }
  | {op: 'del'; key: string}
  | {op: 'clear'};

export const defaultPuller: Puller = async (arg, body) => {
  const {httpRequestInfo, response} = await httpRequest(arg, body);
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
