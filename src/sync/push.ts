import type {JSONValue} from '../json';
import * as db from '../db/mod';
import type * as dag from '../dag/mod';
import {
  assertHTTPRequestInfo,
  HTTPRequestInfo,
  TryPushRequest,
} from '../repm-invoker';
import {Pusher, PushError} from '../pusher';
import {callJSRequest} from './js-request';
import type {LogContext} from '../logger';

export const PUSH_VERSION = 0;

export type PushRequest = {
  clientID: string;
  mutations: Mutation[];
  pushVersion: number;
  // schema_version can optionally be used to specify to the push endpoint
  // version information about the mutators the app is using (e.g., format
  // of mutator args).
  schemaVersion: string;
};
export type Mutation = {
  id: number;
  name: string;
  args: JSONValue;
};

export interface InternalPusher {
  push(
    pushReq: PushRequest,
    pushUrl: string,
    pushAuth: string,
    requestID: string,
  ): Promise<HTTPRequestInfo>;
}

export function convert(lm: db.LocalMeta): Mutation {
  const args = lm.mutatorArgsJSON();
  return {
    id: lm.mutationID(),
    name: lm.mutatorName(),
    args,
  };
}

export async function push(
  requestID: string,
  store: dag.Store,
  lc: LogContext,
  clientID: string,
  pusher: InternalPusher,
  req: TryPushRequest,
): Promise<HTTPRequestInfo | undefined> {
  // Find pending commits between the base snapshot and the main head and push
  // them to the data layer.
  const pending = await store.withRead(async dagRead => {
    const mainHeadHash = await dagRead.getHead(db.DEFAULT_HEAD_NAME);
    if (!mainHeadHash) {
      throw new Error('Internal no main head');
    }
    return await db.Commit.localMutations(mainHeadHash, dagRead);
    // Important! Don't hold the lock through an HTTP request!
  });
  // Commit.pending gave us commits in head-first order; the bindings
  // want tail first (in mutation id order).
  pending.reverse();

  let httpRequestInfo: HTTPRequestInfo | undefined = undefined;
  if (pending.length > 0) {
    const pushMutations: Mutation[] = [];
    for (const commit of pending) {
      if (commit.meta().isLocal()) {
        pushMutations.push(convert(commit.meta().typed() as db.LocalMeta));
      } else {
        throw new Error('Internal non local pending commit');
      }
    }
    const pushReq = {
      clientID,
      mutations: pushMutations,
      pushVersion: PUSH_VERSION,
      schemaVersion: req.schemaVersion,
    };
    lc.debug?.('Starting push...');
    const pushStart = Date.now();
    const reqInfo = await pusher.push(
      pushReq,
      req.pushURL,
      req.pushAuth,
      requestID,
    );

    httpRequestInfo = reqInfo;

    lc.debug?.('...Push complete in ', Date.now() - pushStart, 'ms');
  }

  return httpRequestInfo;
}

// TODO(arv): This abstraction can be removed.
export class JSPusher implements InternalPusher {
  private readonly _pusher: Pusher;

  constructor(pusher: Pusher) {
    this._pusher = pusher;
  }
  async push(
    pushReq: PushRequest,
    url: string,
    auth: string,
    requestID: string,
  ): Promise<HTTPRequestInfo> {
    const {clientID, mutations, pushVersion, schemaVersion} = pushReq;

    const body = {clientID, mutations, pushVersion, schemaVersion};

    try {
      const res = await callJSRequest(this._pusher, url, body, auth, requestID);
      assertHTTPRequestInfo(res);
      return res;
    } catch (e) {
      throw new PushError(e);
    }
  }
}
