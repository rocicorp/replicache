import type {HTTPRequestInfo, Mutation} from './repm-invoker.js';
import {httpRequest} from './http-request.js';

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
  const body = {
    clientID: arg.clientID,
    mutations: arg.mutations,
    pushVersion: arg.pushVersion,
    schemaVersion: arg.schemaVersion,
  };
  return (await httpRequest(arg, body)).httpRequestInfo;
};
