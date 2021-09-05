import type * as dag from '../dag/mod';
import * as db from '../db/mod';
import {deepThaw, ReadonlyJSONValue} from '../json';
import {assertPullResponse, Puller, PullError, PullResponse} from '../puller';
import {
  assertHTTPRequestInfo,
  BeginTryPullRequest,
  BeginTryPullResponse,
  ChangedKeysMap,
  HTTPRequestInfo,
  MaybeEndTryPullRequest,
  MaybeEndTryPullResponse,
  ReplayMutation,
} from '../repm-invoker';
import {callJSRequest} from './js-request';
import {SYNC_HEAD_NAME} from './sync-head-name';
import * as patch from './patch';
import * as prolly from '../prolly/mod';
import type {LogContext} from '../logger';

export const PULL_VERSION = 0;

export type PullRequest = {
  clientID: string;
  cookie: ReadonlyJSONValue;
  lastMutationID: number;
  pullVersion: number;
  // schema_version can optionally be used by the customer's app
  // to indicate to the data layer what format of Client View the
  // app understands.
  schemaVersion: string;
};

export interface InternalPuller {
  pull(
    pullReq: PullRequest,
    url: string,
    auth: string,
    requestID: string,
  ): Promise<[PullResponse | undefined, HTTPRequestInfo]>;
}

export async function beginPull(
  clientID: string,
  beginPullReq: BeginTryPullRequest,
  puller: InternalPuller,
  requestID: string,
  store: dag.Store,
  lc: LogContext,
): Promise<BeginTryPullResponse> {
  const {pullURL, pullAuth, schemaVersion} = beginPullReq;

  const baseSnapshot = await store.withRead(async dagRead => {
    const mainHeadHash = await dagRead.getHead(db.DEFAULT_HEAD_NAME);
    if (!mainHeadHash) {
      throw new Error('Internal no main head found');
    }
    return await db.Commit.baseSnapshot(mainHeadHash, dagRead);
  });

  const [baseLastMutationID, baseCookie] =
    db.Commit.snapshotMetaParts(baseSnapshot);

  const pullReq = {
    clientID,
    cookie: baseCookie,
    lastMutationID: baseSnapshot.mutationID(),
    pullVersion: PULL_VERSION,
    schemaVersion,
  };
  lc.debug?.('Starting pull...');
  const pullStart = Date.now();
  const [pullResp, httpRequestInfo] = await puller.pull(
    pullReq,
    pullURL,
    pullAuth,
    requestID,
  );

  lc.debug?.(
    `...Pull ${pullResp ? 'complete' : 'failed'} in `,
    Date.now() - pullStart,
    'ms',
  );

  // If Puller did not get a pull response we still want to return the HTTP
  // request info to the JS SDK.
  if (!pullResp) {
    return {
      httpRequestInfo,
      syncHead: '',
      requestID,
    };
  }

  // It is possible that another sync completed while we were pulling. Ensure
  // that is not the case by re-checking the base snapshot.
  return await store.withWrite(async dagWrite => {
    const dagRead = dagWrite.read();
    const mainHeadPostPull = await dagRead.getHead(db.DEFAULT_HEAD_NAME);

    if (mainHeadPostPull === undefined) {
      throw new Error('Main head disappeared');
    }
    const baseSnapshotPostPull = await db.Commit.baseSnapshot(
      mainHeadPostPull,
      dagRead,
    );
    if (baseSnapshot.chunk.hash !== baseSnapshotPostPull.chunk.hash) {
      throw new Error('Overlapping syncs JSLogInfo');
    }

    // If other entities (eg, other clients) are modifying the client view
    // the client view can change but the lastMutationID stays the same.
    // So be careful here to reject only a lesser lastMutationID.
    if (pullResp.lastMutationID < baseLastMutationID) {
      throw new Error(
        `base lastMutationID ${baseLastMutationID} is > than client view lastMutationID ${pullResp.lastMutationID}; ignoring client view`,
      );
    }

    // If there is no patch and the lmid and cookie don't change, it's a nop.
    // Otherwise, we will write a new commit, including for the case of just
    // a cookie change.
    if (
      pullResp.patch.length === 0 &&
      pullResp.lastMutationID === baseLastMutationID &&
      (pullResp.cookie ?? null) === baseCookie
    ) {
      const syncHead = '';
      return {
        httpRequestInfo,
        syncHead,
        requestID,
      };
    }

    // We are going to need to rebuild the indexes. We want to take the definitions from
    // the last commit on the chain that will not be rebased. We do this here before creating
    // the new snapshot while we still have the dagRead borrowed.
    const chain = await db.Commit.chain(mainHeadPostPull, dagRead);
    const indexRecords = chain
      .find(c => c.mutationID() <= pullResp.lastMutationID)
      ?.indexes();
    if (!indexRecords) {
      throw new Error('Internal invalid chain');
    }
    // drop(dagRead);

    const dbWrite = await db.Write.newSnapshot(
      db.whenceHash(baseSnapshot.chunk.hash),
      pullResp.lastMutationID,
      pullResp.cookie ?? null,
      dagWrite,
      new Map(), // Note: created with no indexes
    );

    // Rebuild the indexes
    // TODO would be so nice to have a way to re-use old indexes, which are likely
    //      only a small diff from what we want.
    for (const m of indexRecords) {
      const def = m.definition;
      await dbWrite.createIndex(lc, def.name, def.keyPrefix, def.jsonPointer);
    }

    await patch.apply(lc, dbWrite, pullResp.patch);

    const commitHash = await dbWrite.commit(SYNC_HEAD_NAME);

    return {
      httpRequestInfo: {
        httpStatusCode: 200,
        errorMessage: '',
      },
      syncHead: commitHash,
      requestID,
    };
  });
}

export async function maybeEndTryPull(
  store: dag.Store,
  lc: LogContext,
  maybeEndPullReq: MaybeEndTryPullRequest,
): Promise<MaybeEndTryPullResponse> {
  // Ensure sync head is what the caller thinks it is.
  return await store.withWrite(async dagWrite => {
    const dagRead = dagWrite.read();
    const syncHeadHash = await dagRead.getHead(SYNC_HEAD_NAME);
    if (syncHeadHash === undefined) {
      throw new Error('Missing sync head');
    }
    if (syncHeadHash !== maybeEndPullReq.syncHead) {
      throw new Error('Wrong sync head JSLogInfo');
    }

    // Ensure another sync has not landed a new snapshot on the main chain.
    const syncSnapshot = await db.Commit.baseSnapshot(syncHeadHash, dagRead);
    const mainHeadHash = await dagRead.getHead(db.DEFAULT_HEAD_NAME);
    if (mainHeadHash === undefined) {
      throw new Error('Missing main head');
    }
    const mainSnapshot = await db.Commit.baseSnapshot(mainHeadHash, dagRead);

    const meta = syncSnapshot.meta();
    const syncSnapshotBasis = meta.basisHash();
    if (syncSnapshot === null) {
      throw new Error('Sync snapshot with no basis');
    }
    if (syncSnapshotBasis !== mainSnapshot.chunk.hash) {
      throw new Error('Overlapping syncs JSLogInfo');
    }

    // Collect pending commits from the main chain and determine which
    // of them if any need to be replayed.
    let pending = await db.Commit.localMutations(mainHeadHash, dagRead);
    const syncHead = await db.Commit.fromHash(syncHeadHash, dagRead);
    pending = pending.filter(c => c.mutationID() > syncHead.mutationID());
    // pending() gave us the pending mutations in sync-head-first order whereas
    // caller wants them in the order to replay (lower mutation ids first).
    pending.reverse();

    // We return the keys that changed due to this pull. This is used by
    // subscriptions in the JS API when there are no more pending mutations.
    const changedKeys: ChangedKeysMap = new Map();

    // Return replay commits if any.
    if (pending.length > 0) {
      const replayMutations: ReplayMutation[] = [];
      for (const c of pending) {
        let name: string;
        let args: ReadonlyJSONValue;
        if (c.meta().isLocal()) {
          const lm = c.meta().typed() as db.LocalMeta;
          name = lm.mutatorName();
          args = lm.mutatorArgsJSON();
        } else {
          throw new Error('pending mutation is not local');
        }
        replayMutations.push({
          id: c.mutationID(),
          name,
          args: deepThaw(args),
          original: c.chunk.hash,
        });
      }
      return {
        syncHead: syncHeadHash,
        replayMutations,
        // The changed keys are not reported when further replays are
        // needed. The changedKeys will be reported at the end when there
        // are no more mutations to be replay and then it will be reported
        // relative to DEFAULT_HEAD_NAME.
        changedKeys,
      };
    }

    // TODO check invariants

    // Compute diffs (changed keys) for value map and index maps.
    const mainHead = await db.Commit.fromHash(mainHeadHash, dagRead);
    const [mainHeadMap, syncHeadMap] = await Promise.all([
      prolly.Map.load(mainHead.valueHash(), dagRead),
      prolly.Map.load(syncHead.valueHash(), dagRead),
    ]);
    const valueChangedKeys = prolly.Map.changedKeys(mainHeadMap, syncHeadMap);
    if (valueChangedKeys.length > 0) {
      changedKeys.set('', valueChangedKeys);
    }
    await addChangedKeysForIndexes(mainHead, syncHead, dagRead, changedKeys);

    // No mutations to replay so set the main head to the sync head and sync complete!
    await Promise.all([
      dagWrite.setHead(db.DEFAULT_HEAD_NAME, syncHeadHash),
      dagWrite.setHead(SYNC_HEAD_NAME, undefined),
    ]);
    await dagWrite.commit();

    if (lc.debug) {
      const [oldLastMutationID, oldCookie] =
        db.Commit.snapshotMetaParts(mainSnapshot);
      const [newLastMutationID, newCookie] =
        db.Commit.snapshotMetaParts(syncSnapshot);
      lc.debug(
        'Successfully pulled new snapshot w/last_mutation_id={} (prev. {}), cookie={} (prev. {}), and value_hash={} (prev. {}).',
        newLastMutationID,
        oldLastMutationID,
        newCookie,
        oldCookie,
        syncHead.valueHash(),
        mainSnapshot.valueHash(),
      );
    }

    return {
      syncHead: syncHeadHash,
      replayMutations: [],
      changedKeys,
    };
  });
}

export class JSPuller implements InternalPuller {
  private readonly _puller: Puller;

  constructor(puller: Puller) {
    this._puller = puller;
  }

  async pull(
    pullReq: PullRequest,
    url: string,
    auth: string,
    requestID: string,
  ): Promise<[PullResponse | undefined, HTTPRequestInfo]> {
    const {clientID, cookie, lastMutationID, pullVersion, schemaVersion} =
      pullReq;

    const body = {clientID, cookie, lastMutationID, pullVersion, schemaVersion};
    try {
      const res = await callJSRequest(this._puller, url, body, auth, requestID);
      assertResult(res);
      return [res.response, res.httpRequestInfo];
    } catch (e) {
      throw new PullError(e);
    }
  }
}

type Result = {
  response?: PullResponse;
  httpRequestInfo: HTTPRequestInfo;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assertResult(v: any): asserts v is Result {
  if (typeof v !== 'object' || v === null) {
    throw new Error('Expected result to be an object');
  }

  if (v.response !== undefined) {
    assertPullResponse(v.response);
  }

  assertHTTPRequestInfo(v.httpRequestInfo);
}
async function addChangedKeysForIndexes(
  mainCommit: db.Commit,
  syncCommit: db.Commit,
  read: dag.Read,
  changedKeysMap: ChangedKeysMap,
) {
  function allKeys(oldMap: prolly.Map): string[] {
    return Array.from(oldMap.entries(), entry => entry[0]);
  }

  const oldIndexes = db.readIndexes(mainCommit);
  const newIndexes = db.readIndexes(syncCommit);

  for (const [oldIndexName, oldIndex] of oldIndexes) {
    await oldIndex.withMap(read, async oldMap => {
      const newIndex = newIndexes.get(oldIndexName);
      if (newIndex !== undefined) {
        const changedKeys = await newIndex.withMap(read, async newMap => {
          return prolly.Map.changedKeys(oldMap, newMap);
        });

        newIndexes.delete(oldIndexName);
        if (changedKeys.length > 0) {
          changedKeysMap.set(oldIndexName, changedKeys);
        }
      } else {
        // old index name is not in the new indexes. All keys changed!
        const changedKeys = allKeys(oldMap);
        if (changedKeys.length > 0) {
          changedKeysMap.set(oldIndexName, changedKeys);
        }
      }
    });
  }

  for (const [newIndexName, newIndex] of newIndexes) {
    // new index name is not in the old indexes. All keys changed!
    await newIndex.withMap(read, async newMap => {
      const changedKeys = allKeys(newMap);
      if (changedKeys.length > 0) {
        changedKeysMap.set(newIndexName, allKeys(newMap));
      }
    });
  }
}
