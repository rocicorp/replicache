import {expect} from '@esm-bundle/chai';
import {assertNotUndefined} from '../asserts';
import {assertObject, assertString} from '../asserts';
import * as dag from '../dag/mod';
import * as db from '../db/mod';
import type * as sync from '../sync/mod';
import {Commit, DEFAULT_HEAD_NAME} from '../db/mod';
import {
  addGenesis,
  addIndexChange,
  addLocal,
  addSnapshot,
  Chain,
  createIndex,
} from '../db/test-helpers';
import type {ReadonlyJSONValue} from '../json';
import type {
  PatchOperation,
  Puller,
  PullerResult,
  PullResponse,
} from '../puller';
import type {HTTPRequestInfo} from '../http-request-info';
import {SYNC_HEAD_NAME} from './sync-head-name';
import {
  beginPull,
  BeginPullRequest,
  BeginPullResponse,
  maybeEndPull,
  MaybeEndPullResult,
  PullRequest,
  PULL_VERSION,
} from './pull';
import {LogContext} from '../logger';
import {emptyHash} from '../hash';
import {stringCompare} from '../string-compare';
import {asyncIterableToArray} from '../async-iterable-to-array';
import type {SnapshotMeta} from '../db/commit';

test('begin try pull', async () => {
  const store = new dag.TestStore();
  const chain: Chain = [];
  await addGenesis(chain, store);
  await addSnapshot(chain, store, [['foo', '"bar"']]);
  // chain[2] is an index change
  await addIndexChange(chain, store);
  const startingNumCommits = chain.length;
  const baseSnapshot = chain[1];
  const [baseLastMutationID, baseCookie] = db.snapshotMetaParts(
    baseSnapshot as Commit<SnapshotMeta>,
  );
  const baseValueMap = new Map([['foo', '"bar"']]);

  const requestID = 'requestID';
  const clientID = 'test_client_id';
  const pullAuth = 'pull_auth';
  const pullURL = 'pull_url';
  const schemaVersion = 'schema_version';

  const goodHttpRequestInfo = {
    httpStatusCode: 200,
    errorMessage: '',
  };
  // The goodPullResp has a patch, a new cookie, and a new
  // lastMutationID. Tests can clone it and override those
  // fields they wish to change. This minimizes test changes required
  // when PullResponse changes.
  const newCookie = 'newCookie';
  const goodPullResp: PullResponse = {
    cookie: newCookie,
    lastMutationID: 10,
    patch: [
      {op: 'clear'},
      {
        op: 'put',
        key: 'new',
        value: 'value',
      },
    ],
  };
  const goodPullRespValueMap = new Map([['/new', 'value']]);

  type ExpCommit = {
    cookie: ReadonlyJSONValue;
    lastMutationID: number;
    valueMap: ReadonlyMap<string, ReadonlyJSONValue>;
    indexes: string[];
  };

  type Case = {
    name: string;
    numPendingMutations: number;
    pullResult: PullResponse | string;
    // BeginPull expectations.
    expNewSyncHead: ExpCommit | undefined;
    expBeginPullResult: BeginPullResponse | string;
  };

  const expPullReq: PullRequest = {
    clientID,
    cookie: baseCookie,
    lastMutationID: baseLastMutationID,
    pullVersion: PULL_VERSION,
    schemaVersion,
  };

  const cases: Case[] = [
    {
      name: '0 pending, pulls new state -> beginpull succeeds w/synchead set',
      numPendingMutations: 0,
      pullResult: goodPullResp,
      expNewSyncHead: {
        cookie: newCookie,
        lastMutationID: goodPullResp.lastMutationID,
        valueMap: goodPullRespValueMap,
        indexes: ['2'],
      },
      expBeginPullResult: {
        httpRequestInfo: goodHttpRequestInfo,
        syncHead: emptyHash,
      },
    },
    {
      name: '1 pending, 0 mutations to replay, pulls new state -> beginpull succeeds w/synchead set',
      numPendingMutations: 1,
      pullResult: {
        ...goodPullResp,
        lastMutationID: 2,
      },
      expNewSyncHead: {
        cookie: newCookie,
        lastMutationID: 2,
        valueMap: goodPullRespValueMap,
        indexes: ['2', '4'],
      },
      expBeginPullResult: {
        httpRequestInfo: goodHttpRequestInfo,
        syncHead: emptyHash,
      },
    },
    {
      name: '1 pending, 1 mutations to replay, pulls new state -> beginpull succeeds w/synchead set',
      numPendingMutations: 1,
      pullResult: {
        ...goodPullResp,
        lastMutationID: 1,
      },
      expNewSyncHead: {
        cookie: newCookie,
        lastMutationID: 1,
        valueMap: goodPullRespValueMap,
        indexes: ['2'],
      },
      expBeginPullResult: {
        httpRequestInfo: goodHttpRequestInfo,
        syncHead: emptyHash,
      },
    },
    {
      name: '2 pending, 0 to replay, pulls new state -> beginpull succeeds w/synchead set',
      numPendingMutations: 2,
      pullResult: goodPullResp,
      expNewSyncHead: {
        cookie: newCookie,
        lastMutationID: goodPullResp.lastMutationID,
        valueMap: goodPullRespValueMap,
        indexes: ['2', '4', '6'],
      },
      expBeginPullResult: {
        httpRequestInfo: goodHttpRequestInfo,
        syncHead: emptyHash,
      },
    },
    {
      name: '2 pending, 1 to replay, pulls new state -> beginpull succeeds w/synchead set',
      numPendingMutations: 2,
      pullResult: {
        ...goodPullResp,
        lastMutationID: 2,
      },
      expNewSyncHead: {
        cookie: newCookie,
        lastMutationID: 2,
        valueMap: goodPullRespValueMap,
        indexes: ['2', '4'],
      },
      expBeginPullResult: {
        httpRequestInfo: goodHttpRequestInfo,
        syncHead: emptyHash,
      },
    },
    // The patch, lastMutationID, and cookie determine whether we write a new
    // Commit. Here we run through the different combinations.
    {
      name: 'no patch, same lmid, same cookie -> beginpull succeeds w/no synchead',
      numPendingMutations: 0,
      pullResult: {
        ...goodPullResp,
        lastMutationID: baseLastMutationID,
        cookie: baseCookie,
        patch: [],
      },
      expNewSyncHead: undefined,
      expBeginPullResult: {
        httpRequestInfo: goodHttpRequestInfo,
        syncHead: emptyHash,
      },
    },
    {
      name: 'new patch, same lmid, same cookie -> beginpull succeeds w/synchead set',
      numPendingMutations: 0,
      pullResult: {
        ...goodPullResp,
        lastMutationID: baseLastMutationID,
        cookie: baseCookie,
      },
      expNewSyncHead: {
        cookie: baseCookie,
        lastMutationID: baseLastMutationID,
        valueMap: goodPullRespValueMap,
        indexes: ['2'],
      },
      expBeginPullResult: {
        httpRequestInfo: goodHttpRequestInfo,
        syncHead: emptyHash,
      },
    },
    {
      name: 'no patch, new lmid, same cookie -> beginpull succeeds w/synchead set',
      numPendingMutations: 0,
      pullResult: {
        ...goodPullResp,
        lastMutationID: baseLastMutationID + 1,
        cookie: baseCookie,
        patch: [],
      },
      expNewSyncHead: {
        cookie: baseCookie,
        lastMutationID: baseLastMutationID + 1,
        valueMap: baseValueMap,
        indexes: ['2'],
      },
      expBeginPullResult: {
        httpRequestInfo: goodHttpRequestInfo,
        syncHead: emptyHash,
      },
    },
    {
      name: 'no patch, same lmid, new cookie -> beginpull succeeds w/synchead set',
      numPendingMutations: 0,
      pullResult: {
        ...goodPullResp,
        lastMutationID: baseLastMutationID,
        cookie: 'newCookie',
        patch: [],
      },
      expNewSyncHead: {
        cookie: 'newCookie',
        lastMutationID: baseLastMutationID,
        valueMap: baseValueMap,
        indexes: ['2'],
      },
      expBeginPullResult: {
        httpRequestInfo: goodHttpRequestInfo,
        syncHead: emptyHash,
      },
    },
    {
      name: 'new patch, new lmid, same cookie -> beginpull succeeds w/synchead set',
      numPendingMutations: 0,
      pullResult: {
        ...goodPullResp,
        cookie: baseCookie,
      },
      expNewSyncHead: {
        cookie: baseCookie,
        lastMutationID: goodPullResp.lastMutationID,
        valueMap: goodPullRespValueMap,
        indexes: ['2'],
      },
      expBeginPullResult: {
        httpRequestInfo: goodHttpRequestInfo,
        syncHead: emptyHash,
      },
    },

    {
      name: 'new patch, same lmid, new cookie -> beginpull succeeds w/synchead set',
      numPendingMutations: 0,
      pullResult: {
        ...goodPullResp,
        lastMutationID: baseLastMutationID,
      },
      expNewSyncHead: {
        cookie: goodPullResp.cookie ?? null,
        lastMutationID: baseLastMutationID,
        valueMap: goodPullRespValueMap,
        indexes: ['2'],
      },
      expBeginPullResult: {
        httpRequestInfo: goodHttpRequestInfo,
        syncHead: emptyHash,
      },
    },
    {
      name: 'no patch, new lmid, new cookie -> beginpull succeeds w/synchead set',
      numPendingMutations: 0,
      pullResult: {
        ...goodPullResp,
        patch: [],
      },
      expNewSyncHead: {
        cookie: goodPullResp.cookie ?? null,
        lastMutationID: goodPullResp.lastMutationID,
        valueMap: baseValueMap,
        indexes: ['2'],
      },
      expBeginPullResult: {
        httpRequestInfo: goodHttpRequestInfo,
        syncHead: emptyHash,
      },
    },
    {
      name: 'new patch, new lmid, new cookie -> beginpull succeeds w/synchead set',
      numPendingMutations: 0,
      pullResult: {
        ...goodPullResp,
      },
      expNewSyncHead: {
        cookie: goodPullResp.cookie ?? null,
        lastMutationID: goodPullResp.lastMutationID,
        valueMap: goodPullRespValueMap,
        indexes: ['2'],
      },
      expBeginPullResult: {
        httpRequestInfo: goodHttpRequestInfo,
        syncHead: emptyHash,
      },
    },
    {
      name: 'pulls new state w/lesser mutation id -> beginpull errors',
      numPendingMutations: 0,
      pullResult: {
        ...goodPullResp,
        lastMutationID: 0,
      },
      expNewSyncHead: undefined,
      expBeginPullResult:
        'Received lastMutationID 0 is < than last snapshot lastMutationID 1; ignoring client view',
    },
    {
      name: 'pull 500s -> beginpull errors',
      numPendingMutations: 0,
      pullResult: 'FetchNotOk(500)',
      expNewSyncHead: undefined,
      expBeginPullResult: {
        httpRequestInfo: {
          errorMessage: 'Fetch not OK',
          httpStatusCode: 500,
        },
        syncHead: emptyHash,
      },
    },
  ];

  for (const c of cases) {
    // Reset state of the store.
    chain.length = startingNumCommits;
    await store.withWrite(async w => {
      await w.setHead(DEFAULT_HEAD_NAME, chain[chain.length - 1].chunk.hash);
      await w.removeHead(SYNC_HEAD_NAME);
      await w.commit();
    });
    for (let i = 0; i < c.numPendingMutations; i++) {
      await addLocal(chain, store);
      await addIndexChange(chain, store);
    }

    // There was an index added after the snapshot, and one for each local commit.
    // Here we scan to ensure that we get values when scanning using one of the
    // indexes created. We do this because after calling beginPull we check that
    // the index no longer returns values, demonstrating that it was rebuilt.
    if (c.numPendingMutations > 0) {
      await store.withRead(async dagRead => {
        const read = await db.fromWhence(
          db.whenceHead(DEFAULT_HEAD_NAME),
          dagRead,
        );
        let got = false;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const _ of read.scan(
          {
            prefix: '',
            indexName: '2',
          },
          e => e,
        )) {
          got = true;
          break;
        }

        expect(got, c.name).to.be.true;
      });
    }

    // See explanation in FakePuller for why we do this dance with the pull_result.
    let pullResp;
    let pullErr;
    if (typeof c.pullResult === 'string') {
      pullResp = undefined;
      pullErr = c.pullResult;
    } else {
      pullResp = c.pullResult;
      pullErr = undefined;
    }
    const fakePuller = makeFakePuller({
      expPullReq,
      expPullURL: pullURL,
      expPullAuth: pullAuth,
      expRequestID: requestID,
      resp: pullResp,
      err: pullErr,
    });

    const beginPullReq: BeginPullRequest = {
      pullURL,
      pullAuth,
      schemaVersion,
      puller: () => {
        // not used with fake puller
        throw new Error('unreachable');
      },
    };

    let result: BeginPullResponse | string;
    try {
      result = await beginPull(
        clientID,
        beginPullReq,
        fakePuller,
        requestID,
        store,
        new LogContext(),
      );
    } catch (e) {
      result = (e as Error).message;
      assertString(result);
    }

    await store.withRead(async read => {
      if (c.expNewSyncHead !== undefined) {
        const expSyncHead = c.expNewSyncHead;
        const syncHeadHash = await read.getHead(SYNC_HEAD_NAME);
        assertString(syncHeadHash);
        const chunk = await read.getChunk(syncHeadHash);
        assertNotUndefined(chunk);
        const syncHead = db.fromChunk(chunk);
        const [gotLastMutationID, gotCookie] = db.snapshotMetaParts(
          syncHead as Commit<SnapshotMeta>,
        );
        expect(expSyncHead.lastMutationID).to.equal(gotLastMutationID);
        expect(expSyncHead.cookie).to.deep.equal(gotCookie);
        // Check the value is what's expected.
        const [, , bTreeRead] = await db.readCommitForBTreeRead(
          db.whenceHash(syncHead.chunk.hash),
          read,
        );
        const gotValueMap = await asyncIterableToArray(bTreeRead.entries());
        gotValueMap.sort((a, b) => stringCompare(a[0], b[0]));
        const expValueMap = Array.from(expSyncHead.valueMap);
        expValueMap.sort((a, b) => stringCompare(a[0], b[0]));
        expect(expValueMap.length).to.equal(gotValueMap.length);

        // Check we have the expected index definitions.
        const indexes: string[] = syncHead.indexes.map(i => i.definition.name);
        expect(expSyncHead.indexes.length).to.equal(
          indexes.length,
          `${c.name}: expected indexes ${expSyncHead.indexes}, got ${indexes}`,
        );
        expSyncHead.indexes.forEach(
          i => expect(indexes.includes(i)).to.be.true,
        );

        // Check that we *don't* have old indexed values. The indexes should
        // have been rebuilt with a client view returned by the server that
        // does not include local= values. The check for len > 1 is because
        // the snapshot's index is not what we want; we want the first index
        // change's index ("2").
        if (expSyncHead.indexes.length > 1) {
          await store.withRead(async dagRead => {
            const read = await db.fromWhence(
              db.whenceHead(SYNC_HEAD_NAME),
              dagRead,
            );
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for await (const _ of read.scan(
              {
                prefix: '',
                indexName: '2',
              },
              e => e,
            )) {
              expect(false).to.be.true;
            }
          });

          assertObject(result);
          expect(syncHeadHash).to.equal(result.syncHead);
        }
      } else {
        const gotHead = await read.getHead(SYNC_HEAD_NAME);
        expect(gotHead).to.be.undefined;
        // In a nop sync we except Beginpull to succeed but sync_head will
        // be empty.
        if (typeof c.expBeginPullResult !== 'string') {
          assertObject(result);
          expect(result.syncHead).to.be.equal(emptyHash);
        }
      }

      expect(typeof result).to.equal(typeof c.expBeginPullResult);
      if (typeof result === 'object') {
        assertObject(c.expBeginPullResult);
        expect(result.httpRequestInfo).to.deep.equal(
          c.expBeginPullResult.httpRequestInfo,
        );
      } else {
        // use to_debug since some errors cannot be made PartialEq
        expect(result).to.equal(c.expBeginPullResult);
      }
    });
  }
});

test('maybe end try pull', async () => {
  type Case = {
    name: string;
    numPending: number;
    numNeedingReplay: number;
    interveningSync: boolean;
    expReplayIDs: number[];
    expErr?: string;
    // The expected changed keys as reported by the maybe end pull.
    expChangedKeys: sync.ChangedKeysMap;
  };
  const cases: Case[] = [
    {
      name: 'nothing pending',
      numPending: 0,
      numNeedingReplay: 0,
      interveningSync: false,
      expReplayIDs: [],
      expErr: undefined,
      expChangedKeys: new Map([['', ['key/0']]]),
    },
    {
      name: '2 pending but nothing to replay',
      numPending: 2,
      numNeedingReplay: 0,
      interveningSync: false,
      expReplayIDs: [],
      expErr: undefined,
      expChangedKeys: new Map([['', ['key/1', 'local']]]),
    },
    {
      name: '3 pending, 2 to replay',
      numPending: 3,
      numNeedingReplay: 2,
      interveningSync: false,
      expReplayIDs: [2, 3],
      expErr: undefined,
      // The changed keys are not reported when further replay is needed.
      expChangedKeys: new Map(),
    },
    {
      name: 'another sync landed during replay',
      numPending: 0,
      numNeedingReplay: 0,
      interveningSync: true,
      expReplayIDs: [],
      expErr: 'Overlapping syncs',
      expChangedKeys: new Map(),
    },
  ];

  for (const [i, c] of cases.entries()) {
    const store = new dag.TestStore();
    const lc = new LogContext();
    const chain: Chain = [];
    await addGenesis(chain, store);
    // Add pending commits to the main chain.
    for (let j = 0; j < c.numPending; j++) {
      await addLocal(chain, store);
    }
    let basisHash = await store.withWrite(async dagWrite => {
      await dagWrite.setHead(
        db.DEFAULT_HEAD_NAME,
        chain[chain.length - 1].chunk.hash,
      );

      // Add snapshot and replayed commits to the sync chain.
      const w = await db.Write.newSnapshot(
        db.whenceHash(chain[0].chunk.hash),
        0,
        'sync_cookie',
        dagWrite,
        db.readIndexesForWrite(chain[0]),
      );
      await w.put(lc, `key/${i}`, `${i}`);
      return await w.commit(SYNC_HEAD_NAME);
    });

    if (c.interveningSync) {
      await addSnapshot(chain, store, undefined);
    }

    for (let i = 0; i < c.numPending - c.numNeedingReplay; i++) {
      const chainIndex = i + 1; // chain[0] is genesis
      const original = chain[chainIndex];
      let mutatorName: string;
      let mutatorArgs: ReadonlyJSONValue;
      if (original.isLocal()) {
        const lm = original.meta;
        mutatorName = lm.mutatorName;
        mutatorArgs = lm.mutatorArgsJSON;
      } else {
        throw new Error('impossible');
      }
      basisHash = await store.withWrite(async dagWrite => {
        const w = await db.Write.newLocal(
          db.whenceHash(basisHash),
          mutatorName,
          mutatorArgs,
          original.chunk.hash,
          dagWrite,
          original.meta.timestamp,
        );
        return await w.commit(SYNC_HEAD_NAME);
      });
    }
    const syncHead = basisHash;

    let result: MaybeEndPullResult | string;
    try {
      result = await maybeEndPull(store, lc, syncHead);
    } catch (e) {
      result = (e as Error).message;
    }

    if (c.expErr !== undefined) {
      const e = c.expErr;
      expect(result).to.equal(e);
    } else {
      assertObject(result);
      const resp = result;
      expect(syncHead).to.equal(resp.syncHead);
      expect(c.expReplayIDs.length).to.equal(
        resp.replayMutations?.length,
        `${c.name}: expected ${c.expReplayIDs}, got ${resp.replayMutations}`,
      );
      expect(resp.changedKeys, c.name).to.deep.equal(c.expChangedKeys);

      for (let i = 0; i < c.expReplayIDs.length; i++) {
        const chainIdx = chain.length - c.numNeedingReplay + i;
        expect(c.expReplayIDs[i]).to.equal(resp.replayMutations?.[i].id);
        const commit = chain[chainIdx];
        if (commit.isLocal()) {
          const lm = commit.meta;
          expect(lm.mutatorName).to.equal(
            resp.replayMutations?.[i].name,
            `${c.name}: expected ${lm.mutatorName}, got ${resp.replayMutations?.[i].name}`,
          );
          const gotArgs = resp.replayMutations?.[i].args;
          const expArgs = lm.mutatorArgsJSON;
          expect(expArgs).to.deep.equal(gotArgs);
        } else {
          throw new Error('inconceivable');
        }
      }

      // Check if we set the main head like we should have.
      if (c.expReplayIDs.length === 0) {
        await store.withRead(async read => {
          expect(syncHead).to.equal(
            await read.getHead(db.DEFAULT_HEAD_NAME),
            c.name,
          );
          expect(await read.getHead(SYNC_HEAD_NAME)).to.be.undefined;
        });
      }
    }
  }
});

type FakePullerArgs = {
  expPullReq: PullRequest;
  expPullURL: string;
  expPullAuth: string;
  expRequestID: string;
  resp?: PullResponse;
  err?: string;
};

function makeFakePuller(options: FakePullerArgs): Puller {
  return async (req: Request): Promise<PullerResult> => {
    const pullReq: PullRequest = await req.json();
    expect(options.expPullReq).to.deep.equal(pullReq);

    expect(new URL(options.expPullURL, location.href).toString()).to.equal(
      req.url,
    );
    expect(options.expPullAuth).to.equal(req.headers.get('Authorization'));
    expect(options.expRequestID).to.equal(
      req.headers.get('X-Replicache-RequestID'),
    );

    let httpRequestInfo: HTTPRequestInfo;
    if (options.err !== undefined) {
      if (options.err === 'FetchNotOk(500)') {
        httpRequestInfo = {
          httpStatusCode: 500,
          errorMessage: 'Fetch not OK',
        };
      } else {
        throw new Error('not implemented');
      }
    } else {
      httpRequestInfo = {
        httpStatusCode: 200,
        errorMessage: '',
      };
    }
    return {response: options.resp, httpRequestInfo};
  };
}

test('changed keys', async () => {
  type IndexDef = {
    name: string;
    prefix: string;
    jsonPointer: string;
  };
  const t = async (
    baseMap: Map<string, string>,
    indexDef: IndexDef | undefined,
    patch: PatchOperation[],
    expectedChangedKeysMap: sync.ChangedKeysMap,
  ) => {
    const store = new dag.TestStore();
    const lc = new LogContext();
    const chain: Chain = [];
    await addGenesis(chain, store);

    if (indexDef) {
      const {name, prefix, jsonPointer} = indexDef;

      chain.push(await createIndex(name, prefix, jsonPointer, store));
    }

    const entries = [...baseMap];
    await addSnapshot(chain, store, entries);

    const baseSnapshot = chain[chain.length - 1];
    const [baseLastMutationID, baseCookie] = db.snapshotMetaParts(
      baseSnapshot as Commit<SnapshotMeta>,
    );

    const requestID = 'request_id';
    const clientID = 'test_client_id';
    const pullAuth = 'pull_auth';
    const pullURL = 'pull_url';
    const schemaVersion = 'schema_version';

    const newCookie = 'new_cookie';

    const expPullReq: PullRequest = {
      clientID,
      cookie: baseCookie,
      lastMutationID: baseLastMutationID,
      pullVersion: PULL_VERSION,
      schemaVersion,
    };

    const pullResp: PullResponse = {
      cookie: newCookie,
      lastMutationID: baseLastMutationID,
      patch,
    };

    const fakePuller = makeFakePuller({
      expPullReq,
      expPullURL: pullURL,
      expPullAuth: pullAuth,
      expRequestID: requestID,
      resp: pullResp,
      err: undefined,
    });

    const beginPullReq: BeginPullRequest = {
      pullURL,
      pullAuth,
      schemaVersion,
      puller: () => {
        // not used with fake puller
        throw new Error('unreachable');
      },
    };

    const pullResult = await beginPull(
      clientID,
      beginPullReq,
      fakePuller,
      requestID,
      store,
      new LogContext(),
    );

    const result = await maybeEndPull(store, lc, pullResult.syncHead);
    expect(result.changedKeys).to.deep.equal(expectedChangedKeysMap);
  };

  await t(
    new Map(),
    undefined,
    [{op: 'put', key: 'key', value: 'value'}],
    new Map([['', ['key']]]),
  );

  await t(
    new Map([['foo', 'val']]),
    undefined,
    [{op: 'put', key: 'foo', value: 'new val'}],
    new Map([['', ['foo']]]),
  );

  await t(
    new Map([['a', '1']]),
    undefined,
    [{op: 'put', key: 'b', value: '2'}],
    new Map([['', ['b']]]),
  );

  await t(
    new Map([['a', '1']]),
    undefined,
    [
      {op: 'put', key: 'b', value: '3'},
      {op: 'put', key: 'a', value: '2'},
    ],
    new Map([['', ['a', 'b']]]),
  );

  await t(
    new Map([
      ['a', '1'],
      ['b', '2'],
    ]),
    undefined,
    [{op: 'del', key: 'b'}],
    new Map([['', ['b']]]),
  );

  await t(
    new Map([
      ['a', '1'],
      ['b', '2'],
    ]),
    undefined,
    [{op: 'del', key: 'c'}],
    new Map(),
  );

  await t(
    new Map([
      ['a', '1'],
      ['b', '2'],
    ]),
    undefined,
    [{op: 'clear'}],
    new Map([['', ['a', 'b']]]),
  );

  await t(
    new Map([['a1', `{"id": "a-1", "x": 1}`]]),
    {
      name: 'i1',
      prefix: '',
      jsonPointer: '/id',
    },
    [{op: 'put', key: 'a2', value: {id: 'a-2', x: 2}}],
    new Map([
      ['', ['a2']],
      ['i1', ['\u{0}a-2\u{0}a2']],
    ]),
  );

  await t(
    new Map(),
    {
      name: 'i1',
      prefix: '',
      jsonPointer: '/id',
    },
    [
      {op: 'put', key: 'a1', value: {id: 'a-1', x: 1}},
      {op: 'put', key: 'a2', value: {id: 'a-2', x: 2}},
    ],
    new Map([
      ['', ['a1', 'a2']],
      ['i1', ['\u{0}a-1\u{0}a1', '\u{0}a-2\u{0}a2']],
    ]),
  );

  await t(
    new Map([['a1', `{"id": "a-1", "x": 1}`]]),
    {
      name: 'i1',
      prefix: '',
      jsonPointer: '/id',
    },
    [{op: 'put', key: 'a2', value: {id: 'a-2', x: 2}}],
    new Map([
      ['', ['a2']],
      ['i1', ['\u{0}a-2\u{0}a2']],
    ]),
  );
});
