import {expect} from '@esm-bundle/chai';
import * as dag from '../dag/mod';
import {DEFAULT_HEAD_NAME} from '../db/commit';
import {fromWhence, whenceHead} from '../db/read';
import {
  addGenesis,
  addIndexChange,
  addLocal,
  addSnapshot,
  Chain,
} from '../db/test-helpers';
import {MemStore} from '../kv/mod';
import type {HTTPRequestInfo} from '../repm-invoker';
import {SYNC_HEAD_NAME} from './sync-head-name';
import {InternalPusher, push, PushRequest, PUSH_VERSION} from './push';
import {LogContext} from '../logger';
import {initHasher} from '../hash';

setup(async () => {
  await initHasher();
});

type FakePusherArgs = {
  expPush: boolean;
  expPushReq?: PushRequest;
  expPushURL: string;
  expPushAuth: string;
  expRequestID: string;
  err?: string;
};

class FakePusher implements InternalPusher, FakePusherArgs {
  readonly expPush;
  readonly expPushReq?: PushRequest;
  readonly expPushURL;
  readonly expPushAuth;
  readonly expRequestID;
  readonly err?: string;

  constructor(options: FakePusherArgs) {
    this.expPush = options.expPush;
    this.expPushReq = options.expPushReq;
    this.expPushURL = options.expPushURL;
    this.expPushAuth = options.expPushAuth;
    this.expRequestID = options.expRequestID;
    this.err = options.err;
  }

  async push(
    pushReq: PushRequest,
    pushUrl: string,
    pushAuth: string,
    requestID: string,
  ): Promise<HTTPRequestInfo> {
    expect(this.expPush).to.be.true;

    if (this.expPushReq) {
      expect(this.expPushReq).to.deep.equal(pushReq);
      expect(this.expPushURL).to.equal(pushUrl);
      expect(this.expPushAuth).to.equal(pushAuth);
      expect(this.expRequestID).to.equal(requestID);
    }

    if (this.err) {
      if (this.err === 'FetchNotOk(500)') {
        return {
          httpStatusCode: 500,
          errorMessage: 'Fetch not OK',
        };
      } else {
        throw new Error('not implented');
      }
    }

    return {
      httpStatusCode: 200,
      errorMessage: '',
    };
  }
}

test('try push', async () => {
  const store = new dag.Store(new MemStore());
  const lc = new LogContext();
  const chain: Chain = [];
  await addGenesis(chain, store);
  await addSnapshot(chain, store, [['foo', 'bar']]);
  // chain[2] is an index change
  await addIndexChange(chain, store);
  const startingNumCommits = chain.length;

  const requestID = 'request_id';
  const clientID = 'test_client_id';
  const pushAuth = 'push_auth';

  // Push
  const pushURL = 'push_url';
  const pushSchemaVersion = 'pushSchemaVersion';

  type Case = {
    name: string;

    // Push expectations.
    numPendingMutations: number;
    expPushReq: PushRequest | undefined;
    pushResult: undefined | 'ok' | {error: string};
    expBatchPushInfo: HTTPRequestInfo | undefined;
  };
  const cases: Case[] = [
    {
      name: '0 pending',
      numPendingMutations: 0,
      expPushReq: undefined,
      pushResult: undefined,
      expBatchPushInfo: undefined,
    },
    {
      name: '1 pending',
      numPendingMutations: 1,
      expPushReq: {
        clientID,
        mutations: [
          {
            id: 2,
            name: 'mutator_name_3',
            args: [3],
          },
        ],
        pushVersion: PUSH_VERSION,
        schemaVersion: pushSchemaVersion,
      },
      pushResult: 'ok',
      expBatchPushInfo: {
        httpStatusCode: 200,
        errorMessage: '',
      },
    },
    {
      name: '2 pending',
      numPendingMutations: 2,
      expPushReq: {
        clientID,
        mutations: [
          // These mutations aren't actually added to the chain until the test
          // case runs, but we happen to know how they are created by the db
          // test helpers so we use that knowledge here.
          {
            id: 2,
            name: 'mutator_name_3',
            args: [3],
          },
          {
            id: 3,
            name: 'mutator_name_5',
            args: [5],
          },
        ],
        pushVersion: PUSH_VERSION,
        schemaVersion: pushSchemaVersion,
      },
      pushResult: 'ok',
      expBatchPushInfo: {
        httpStatusCode: 200,
        errorMessage: '',
      },
    },
    {
      name: '2 mutations to push, push errors',
      numPendingMutations: 2,
      expPushReq: {
        clientID,
        mutations: [
          // These mutations aren't actually added to the chain until the test
          // case runs, but we happen to know how they are created by the db
          // test helpers so we use that knowledge here.
          {
            id: 2,
            name: 'mutator_name_3',
            args: [3],
          },
          {
            id: 3,
            name: 'mutator_name_5',
            args: [5],
          },
        ],
        pushVersion: PUSH_VERSION,
        schemaVersion: pushSchemaVersion,
      },
      pushResult: {error: 'FetchNotOk(500)'},
      expBatchPushInfo: {
        httpStatusCode: 500,
        errorMessage: 'Fetch not OK',
      },
    },
  ];

  for (const c of cases) {
    // Reset state of the store.
    chain.length = startingNumCommits;
    await store.withWrite(async w => {
      await w.setHead(DEFAULT_HEAD_NAME, chain[chain.length - 1].chunk.hash);
      await w.setHead(SYNC_HEAD_NAME, undefined);
      await w.commit();
    });
    for (let i = 0; i < c.numPendingMutations; i++) {
      await addLocal(chain, store);
      await addIndexChange(chain, store);
    }

    // There was an index added after the snapshot, and one for each local
    // commit. Here we scan to ensure that we get values when scanning using one
    // of the indexes created. We do this because after calling begin_sync we
    // check that the index no longer returns values, demonstrating that it was
    // rebuilt.
    if (c.numPendingMutations > 0) {
      await store.withRead(async dagRead => {
        const read = await fromWhence(whenceHead(DEFAULT_HEAD_NAME), dagRead);
        let got = false;

        await read.scan({prefix: '', indexName: '2'}, () => {
          got = true;
        });
        expect(got).to.be.true;
      });
    }

    // See explanation in FakePusher for why we do this dance with the
    // push_result.
    const [expPush, pushErr] = (() => {
      switch (c.pushResult) {
        case undefined:
          return [false, undefined] as const;
        case 'ok':
          return [true, undefined] as const;
        default:
          return [true, c.pushResult.error] as const;
      }
    })();

    const pusher = new FakePusher({
      expPush,
      expPushReq: c.expPushReq,
      expPushURL: pushURL,
      expPushAuth: pushAuth,
      expRequestID: requestID,
      err: pushErr,
    });

    const clientID = 'test_client_id';
    const batchPushInfo = await push(requestID, store, lc, clientID, pusher, {
      pushURL,
      pushAuth,
      schemaVersion: pushSchemaVersion,
      pusher: () => {
        // not used with fake pusher
        throw new Error('unreachable');
      },
    });

    expect(batchPushInfo).to.deep.equal(c.expBatchPushInfo, `name: ${c.name}`);
  }
});
