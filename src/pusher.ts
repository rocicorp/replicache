import type {HTTPRequestInfo, Mutation} from './repm-invoker.js';
import {getHeaders} from './get-headers.js';

export type Pusher = (arg: PusherArg) => Promise<HTTPRequestInfo>;

export type PusherArg = {
  clientID: string;
  mutations: Mutation[];
  pushVersion: number;
  schemaVersion: string;
  url: string;
  auth: string;
  requestID: string;
};

export const defaultPusher: Pusher = async arg => {
  const {url} = arg;
  const headers = getHeaders(arg);

  const body = {
    clientID: arg.clientID,
    mutations: arg.mutations,
    pushVersion: arg.pushVersion,
    schemaVersion: arg.schemaVersion,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const httpStatusCode = res.status;
  if (httpStatusCode !== 200) {
    const errorMessage = await res.text();
    return {
      httpStatusCode,
      errorMessage,
    };
  }

  return {
    httpStatusCode,
    errorMessage: '',
  };
};
