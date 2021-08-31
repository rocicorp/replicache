import {httpRequest} from './http-request';
import type {HTTPRequestInfo} from './repm-invoker';

/**
 * Pusher is the function type used to do the fetch part of a push.
 */
export type Pusher = (request: Request) => Promise<HTTPRequestInfo>;

export const defaultPusher: Pusher = async request => {
  return (await httpRequest(request)).httpRequestInfo;
};

/**
 * This error is thrown when the pusher fails for any reason.
 */
export class PushError extends Error {
  name = 'PushError';
  cause?: Error;
  constructor(cause?: Error) {
    super('Failed to push');
    this.cause = cause;
  }
}
