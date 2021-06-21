import {httpRequest} from './http-request.js';
import type {HTTPRequestInfo} from './repm-invoker.js';

/**
 * Pusher is the function type used to do the fetch part of a push.
 */
export type Pusher = (request: Request) => Promise<HTTPRequestInfo>;

export const defaultPusher: Pusher = async request => {
  return (await httpRequest(request)).httpRequestInfo;
};
