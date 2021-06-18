import {httpRequest} from './http-request.js';
import type {HTTPRequestInfo, Mutation} from './repm-invoker.js';
import type {FetchArgs} from './http-request.js';

export type Pusher = (
  arg: FetchArgs,
  body: PusherBody,
) => Promise<HTTPRequestInfo>;

export type PusherBody = {
  clientID: string;
  mutations: Mutation[];
  pushVersion: number;
  schemaVersion: string;
};

export const defaultPusher: Pusher = async (args, body) => {
  return (await httpRequest(args, body)).httpRequestInfo;
};
