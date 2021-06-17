import {httpRequest} from './http-request.js';
import type {JSONValue} from './json.js';
import type {HTTPRequestInfo} from './repm-invoker.js';

export type Puller = (arg: PullerArg) => Promise<PullerResult>;

export type PullerArg = {
  clientID: string;
  cookie: JSONValue;
  lastMutationID: number;
  pullVersion: number;
  schemaVersion: string;
  url: string;
  auth: string;
  requestID: string;
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

export const defaultPuller: Puller = async arg => {
  const body = {
    clientID: arg.clientID,
    cookie: arg.cookie,
    lastMutationID: arg.lastMutationID,
    pullVersion: arg.pullVersion,
    schemaVersion: arg.schemaVersion,
  };
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
