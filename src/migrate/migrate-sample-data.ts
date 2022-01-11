// This was copied from a running replicacha-sample-chat running using version

import * as dag from '../dag/mod';
import {addGenesis, addLocal, Chain} from '../db/test-helpers';
import {TestMemStore} from '../kv/test-mem-store';
import {addSyncSnapshot} from '../sync/test-helpers';
import {toJS} from './snippet';

// 6.4.2.
export const chatSampleV0 = {
  'c/a4u1aepu6ecqj3vg4ipgimq2ma79113v/d': new Uint8Array([
    12, 0, 0, 0, 0, 0, 6, 0, 8, 0, 4, 0, 6, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 12,
    0, 0, 0, 8, 0, 12, 0, 4, 0, 8, 0, 8, 0, 0, 0, 68, 0, 0, 0, 4, 0, 0, 0, 54,
    0, 0, 0, 123, 34, 99, 111, 110, 116, 101, 110, 116, 34, 58, 34, 72, 105, 46,
    32, 73, 39, 109, 32, 118, 101, 114, 115, 105, 111, 110, 32, 48, 34, 44, 34,
    102, 114, 111, 109, 34, 58, 34, 79, 108, 100, 34, 44, 34, 111, 114, 100,
    101, 114, 34, 58, 49, 125, 0, 0, 29, 0, 0, 0, 109, 101, 115, 115, 97, 103,
    101, 47, 104, 55, 106, 86, 100, 54, 50, 100, 73, 55, 98, 101, 52, 104, 56,
    116, 72, 80, 103, 69, 97, 0, 0, 0,
  ]),
  'c/a4u1aepu6ecqj3vg4ipgimq2ma79113v/r': new Uint8Array([1, 0]),
  'c/p115b9rblk4futgrb5m26d8n3eimfh2f/d': new Uint8Array([
    20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 16, 0, 4, 0, 8, 0, 12, 0, 10, 0, 0, 0,
    68, 0, 0, 0, 12, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 0, 116, 106,
    116, 116, 49, 109, 117, 48, 102, 100, 115, 56, 51, 57, 102, 105, 99, 54,
    108, 48, 56, 98, 103, 54, 112, 106, 106, 54, 113, 107, 114, 97, 0, 0, 0, 0,
    12, 0, 16, 0, 0, 0, 8, 0, 7, 0, 12, 0, 12, 0, 0, 0, 0, 0, 0, 2, 8, 0, 0, 0,
    52, 0, 0, 0, 32, 0, 0, 0, 114, 52, 107, 104, 51, 98, 108, 56, 102, 53, 105,
    108, 53, 55, 118, 56, 97, 101, 97, 105, 108, 102, 101, 50, 111, 105, 99, 55,
    52, 55, 57, 112, 0, 0, 10, 0, 20, 0, 12, 0, 4, 0, 8, 0, 10, 0, 0, 0, 100, 0,
    0, 0, 12, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 79, 0, 0, 0, 123, 34, 105, 100,
    34, 58, 34, 88, 118, 102, 111, 105, 70, 72, 120, 87, 117, 90, 86, 98, 79,
    86, 72, 117, 102, 104, 121, 66, 34, 44, 34, 102, 114, 111, 109, 34, 58, 34,
    79, 108, 100, 34, 44, 34, 99, 111, 110, 116, 101, 110, 116, 34, 58, 34, 71,
    111, 105, 110, 103, 32, 111, 102, 102, 108, 105, 110, 101, 34, 44, 34, 111,
    114, 100, 101, 114, 34, 58, 50, 125, 0, 13, 0, 0, 0, 99, 114, 101, 97, 116,
    101, 77, 101, 115, 115, 97, 103, 101, 0, 0, 0,
  ]),
  'c/p115b9rblk4futgrb5m26d8n3eimfh2f/m': new Uint8Array([
    12, 0, 0, 0, 0, 0, 6, 0, 8, 0, 4, 0, 6, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0, 8,
    0, 0, 0, 44, 0, 0, 0, 32, 0, 0, 0, 116, 106, 116, 116, 49, 109, 117, 48,
    102, 100, 115, 56, 51, 57, 102, 105, 99, 54, 108, 48, 56, 98, 103, 54, 112,
    106, 106, 54, 113, 107, 114, 97, 0, 0, 0, 0, 32, 0, 0, 0, 114, 52, 107, 104,
    51, 98, 108, 56, 102, 53, 105, 108, 53, 55, 118, 56, 97, 101, 97, 105, 108,
    102, 101, 50, 111, 105, 99, 55, 52, 55, 57, 112, 0, 0, 0, 0,
  ]),
  'c/p115b9rblk4futgrb5m26d8n3eimfh2f/r': new Uint8Array([1, 0]),
  'c/r4kh3bl8f5il57v8aeailfe2oic7479p/d': new Uint8Array([
    16, 0, 0, 0, 0, 0, 10, 0, 16, 0, 4, 0, 8, 0, 12, 0, 10, 0, 0, 0, 68, 0, 0,
    0, 12, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 0, 97, 52, 117, 49, 97,
    101, 112, 117, 54, 101, 99, 113, 106, 51, 118, 103, 52, 105, 112, 103, 105,
    109, 113, 50, 109, 97, 55, 57, 49, 49, 51, 118, 0, 0, 0, 0, 12, 0, 16, 0, 0,
    0, 8, 0, 7, 0, 12, 0, 12, 0, 0, 0, 0, 0, 0, 3, 8, 0, 0, 0, 52, 0, 0, 0, 32,
    0, 0, 0, 48, 114, 113, 49, 101, 102, 105, 50, 105, 110, 110, 104, 54, 99,
    105, 49, 53, 98, 115, 102, 51, 116, 100, 55, 114, 114, 48, 108, 117, 113,
    109, 101, 0, 0, 0, 0, 8, 0, 16, 0, 8, 0, 4, 0, 8, 0, 0, 0, 12, 0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 34, 49, 34, 0,
  ]),
  'c/r4kh3bl8f5il57v8aeailfe2oic7479p/m': new Uint8Array([
    12, 0, 0, 0, 0, 0, 6, 0, 8, 0, 4, 0, 6, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 4,
    0, 0, 0, 32, 0, 0, 0, 97, 52, 117, 49, 97, 101, 112, 117, 54, 101, 99, 113,
    106, 51, 118, 103, 52, 105, 112, 103, 105, 109, 113, 50, 109, 97, 55, 57,
    49, 49, 51, 118, 0, 0, 0, 0,
  ]),
  'c/r4kh3bl8f5il57v8aeailfe2oic7479p/r': new Uint8Array([1, 0]),
  'c/tjtt1mu0fds839fic6l08bg6pjj6qkra/d': new Uint8Array([
    12, 0, 0, 0, 0, 0, 6, 0, 8, 0, 4, 0, 6, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0,
    124, 0, 0, 0, 4, 0, 0, 0, 148, 255, 255, 255, 68, 0, 0, 0, 4, 0, 0, 0, 54,
    0, 0, 0, 123, 34, 99, 111, 110, 116, 101, 110, 116, 34, 58, 34, 72, 105, 46,
    32, 73, 39, 109, 32, 118, 101, 114, 115, 105, 111, 110, 32, 48, 34, 44, 34,
    102, 114, 111, 109, 34, 58, 34, 79, 108, 100, 34, 44, 34, 111, 114, 100,
    101, 114, 34, 58, 49, 125, 0, 0, 29, 0, 0, 0, 109, 101, 115, 115, 97, 103,
    101, 47, 104, 55, 106, 86, 100, 54, 50, 100, 73, 55, 98, 101, 52, 104, 56,
    116, 72, 80, 103, 69, 97, 0, 0, 0, 8, 0, 12, 0, 4, 0, 8, 0, 8, 0, 0, 0, 64,
    0, 0, 0, 4, 0, 0, 0, 50, 0, 0, 0, 123, 34, 102, 114, 111, 109, 34, 58, 34,
    79, 108, 100, 34, 44, 34, 99, 111, 110, 116, 101, 110, 116, 34, 58, 34, 71,
    111, 105, 110, 103, 32, 111, 102, 102, 108, 105, 110, 101, 34, 44, 34, 111,
    114, 100, 101, 114, 34, 58, 50, 125, 0, 0, 29, 0, 0, 0, 109, 101, 115, 115,
    97, 103, 101, 47, 88, 118, 102, 111, 105, 70, 72, 120, 87, 117, 90, 86, 98,
    79, 86, 72, 117, 102, 104, 121, 66, 0, 0, 0,
  ]),
  'c/tjtt1mu0fds839fic6l08bg6pjj6qkra/r': new Uint8Array([1, 0]),
  'h/main': new Uint8Array([
    112, 49, 49, 53, 98, 57, 114, 98, 108, 107, 52, 102, 117, 116, 103, 114, 98,
    53, 109, 50, 54, 100, 56, 110, 51, 101, 105, 109, 102, 104, 50, 102,
  ]),
  'sys/cid': new Uint8Array([
    56, 101, 57, 57, 98, 52, 100, 55, 45, 97, 98, 102, 53, 45, 52, 57, 54, 100,
    45, 56, 51, 48, 52, 45, 101, 57, 50, 49, 101, 48, 102, 100, 54, 48, 98, 97,
  ]),
};

const enum MetaTypeV1 {
  NONE = 0,
  IndexChangeMeta = 1,
  LocalMeta = 2,
  SnapshotMeta = 3,
}

export const chatSampleV1 = {
  'c/a4u1aepu6ecqj3vg4ipgimq2ma79113v/d': [
    [
      'message/h7jVd62dI7be4h8tHPgEa',
      {
        content: "Hi. I'm version 0",
        from: 'Old',
        order: 1,
      },
    ],
  ],
  'c/a4u1aepu6ecqj3vg4ipgimq2ma79113v/r': 1,
  'c/p115b9rblk4futgrb5m26d8n3eimfh2f/d': {
    meta: {
      type: MetaTypeV1.LocalMeta,
      basisHash: 'r4kh3bl8f5il57v8aeailfe2oic7479p',
      mutationID: 2,
      mutatorName: 'createMessage',
      mutatorArgsJSON: {
        id: 'XvfoiFHxWuZVbOVHufhyB',
        from: 'Old',
        content: 'Going offline',
        order: 2,
      },
      originalHash: null,
    },
    valueHash: 'tjtt1mu0fds839fic6l08bg6pjj6qkra',
    indexes: [],
  },
  'c/p115b9rblk4futgrb5m26d8n3eimfh2f/m': [
    'tjtt1mu0fds839fic6l08bg6pjj6qkra',
    'r4kh3bl8f5il57v8aeailfe2oic7479p',
  ],
  'c/p115b9rblk4futgrb5m26d8n3eimfh2f/r': 1,
  'c/r4kh3bl8f5il57v8aeailfe2oic7479p/d': {
    meta: {
      type: MetaTypeV1.SnapshotMeta,
      basisHash: '0rq1efi2innh6ci15bsf3td7rr0luqme',
      lastMutationID: 1,
      cookieJSON: '1',
    },
    valueHash: 'a4u1aepu6ecqj3vg4ipgimq2ma79113v',
    indexes: [],
  },
  'c/r4kh3bl8f5il57v8aeailfe2oic7479p/m': ['a4u1aepu6ecqj3vg4ipgimq2ma79113v'],
  'c/r4kh3bl8f5il57v8aeailfe2oic7479p/r': 1,
  'c/tjtt1mu0fds839fic6l08bg6pjj6qkra/d': [
    [
      'message/XvfoiFHxWuZVbOVHufhyB',
      {
        from: 'Old',
        content: 'Going offline',
        order: 2,
      },
    ],
    [
      'message/h7jVd62dI7be4h8tHPgEa',
      {
        content: "Hi. I'm version 0",
        from: 'Old',
        order: 1,
      },
    ],
  ],
  'c/tjtt1mu0fds839fic6l08bg6pjj6qkra/r': 1,
  'h/main': 'p115b9rblk4futgrb5m26d8n3eimfh2f',
  'sys/cid': '8e99b4d7-abf5-496d-8304-e921e0fd60ba',
  'sys/storage-format-version': 1,
};

// 8.0.0
export const chatSampleV2 = {
  'c/fdjkbhvnjrfb2mnc634fk790fu9as4gp/d': {
    indexes: [],
    meta: {
      basisHash: 'o9gr71jco5lv284mhnke2nrg6raj57vg',
      mutationID: 2,
      mutatorArgsJSON: {
        content: 'Going offline',
        from: 'Old',
        id: 'XvfoiFHxWuZVbOVHufhyB',
        order: 2,
      },
      mutatorName: 'createMessage',
      originalHash: null,
      type: 2,
    },
    valueHash: 'ok5mmt1pcv0k9ur5esjjndp9pfqqlflv',
  },
  'c/fdjkbhvnjrfb2mnc634fk790fu9as4gp/m': [
    'ok5mmt1pcv0k9ur5esjjndp9pfqqlflv',
    'o9gr71jco5lv284mhnke2nrg6raj57vg',
  ],
  'c/fdjkbhvnjrfb2mnc634fk790fu9as4gp/r': 1,
  'c/jlkcvk3hg2d8lkj184qfp0rsqr31uiou/d': [
    0,
    [
      [
        'message/h7jVd62dI7be4h8tHPgEa',
        {
          content: "Hi. I'm version 0",
          from: 'Old',
          order: 1,
        },
      ],
    ],
  ],
  'c/jlkcvk3hg2d8lkj184qfp0rsqr31uiou/r': 1,
  'c/o9gr71jco5lv284mhnke2nrg6raj57vg/d': {
    indexes: [],
    meta: {
      basisHash: '0rq1efi2innh6ci15bsf3td7rr0luqme',
      cookieJSON: '1',
      lastMutationID: 1,
      type: 3,
    },
    valueHash: 'jlkcvk3hg2d8lkj184qfp0rsqr31uiou',
  },
  'c/o9gr71jco5lv284mhnke2nrg6raj57vg/m': ['jlkcvk3hg2d8lkj184qfp0rsqr31uiou'],
  'c/o9gr71jco5lv284mhnke2nrg6raj57vg/r': 1,
  'c/ok5mmt1pcv0k9ur5esjjndp9pfqqlflv/d': [
    0,
    [
      [
        'message/XvfoiFHxWuZVbOVHufhyB',
        {
          content: 'Going offline',
          from: 'Old',
          order: 2,
        },
      ],
      [
        'message/h7jVd62dI7be4h8tHPgEa',
        {
          content: "Hi. I'm version 0",
          from: 'Old',
          order: 1,
        },
      ],
    ],
  ],
  'c/ok5mmt1pcv0k9ur5esjjndp9pfqqlflv/r': 1,
  'h/main': 'fdjkbhvnjrfb2mnc634fk790fu9as4gp',
  'sys/cid': '8e99b4d7-abf5-496d-8304-e921e0fd60ba',
  'sys/storage-format-version': 2,
};

// This was used to generate test data below.
export async function getTestData(): Promise<void> {
  const kv = new TestMemStore();
  const store = new dag.Store(kv);

  const mainChain: Chain = [];

  await addGenesis(mainChain, store);
  await addLocal(mainChain, store);
  await addSyncSnapshot(mainChain, store, 0);
  await addLocal(mainChain, store);

  const o = Object.fromEntries(kv.entries());
  console.log(toJS(o));
}

// This data was generated by first checking out bb65babed41827fe876397a9e2fffc9e430592d9
// and then running the `getTestData` function above.
export const testDataV0 = {
  'c/jdh7scesonbpmik7k00vnb4ska0goree/d': new Uint8Array([
    12, 0, 0, 0, 0, 0, 6, 0, 8, 0, 4, 0, 6, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0,
  ]),
  'c/hjera9r19os7oumi22s4mkba84jdn16e/d': new Uint8Array([
    16, 0, 0, 0, 0, 0, 10, 0, 16, 0, 12, 0, 8, 0, 4, 0, 10, 0, 0, 0, 12, 0, 0,
    0, 12, 0, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 0, 106, 100, 104, 55,
    115, 99, 101, 115, 111, 110, 98, 112, 109, 105, 107, 55, 107, 48, 48, 118,
    110, 98, 52, 115, 107, 97, 48, 103, 111, 114, 101, 101, 0, 0, 0, 0, 12, 0,
    12, 0, 0, 0, 0, 0, 11, 0, 4, 0, 12, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 3, 8, 0,
    8, 0, 0, 0, 4, 0, 8, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 110, 117, 108, 108,
  ]),
  'c/hjera9r19os7oumi22s4mkba84jdn16e/m': new Uint8Array([
    12, 0, 0, 0, 0, 0, 6, 0, 8, 0, 4, 0, 6, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 4,
    0, 0, 0, 32, 0, 0, 0, 106, 100, 104, 55, 115, 99, 101, 115, 111, 110, 98,
    112, 109, 105, 107, 55, 107, 48, 48, 118, 110, 98, 52, 115, 107, 97, 48,
    103, 111, 114, 101, 101, 0, 0, 0, 0,
  ]),
  'h/main': new Uint8Array([
    111, 100, 50, 118, 107, 55, 55, 105, 111, 107, 53, 112, 106, 98, 112, 50,
    100, 52, 109, 106, 118, 56, 117, 53, 98, 99, 106, 107, 48, 117, 52, 101,
  ]),
  'c/jdh7scesonbpmik7k00vnb4ska0goree/r': new Uint8Array([2, 0]),
  'c/hjera9r19os7oumi22s4mkba84jdn16e/r': new Uint8Array([1, 0]),
  'c/bk5r3f2ui3neg8gh8na8pn8o1ij0n88p/d': new Uint8Array([
    12, 0, 0, 0, 0, 0, 6, 0, 8, 0, 4, 0, 6, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 12,
    0, 0, 0, 8, 0, 12, 0, 8, 0, 4, 0, 8, 0, 0, 0, 8, 0, 0, 0, 12, 0, 0, 0, 3, 0,
    0, 0, 34, 49, 34, 0, 5, 0, 0, 0, 108, 111, 99, 97, 108, 0, 0, 0,
  ]),
  'c/5vm3movfjjpjs5sanpmnd4n965kvn04p/d': new Uint8Array([
    20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 16, 0, 12, 0, 8, 0, 4, 0, 10, 0, 0, 0,
    12, 0, 0, 0, 12, 0, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 0, 98, 107, 53,
    114, 51, 102, 50, 117, 105, 51, 110, 101, 103, 56, 103, 104, 56, 110, 97,
    56, 112, 110, 56, 111, 49, 105, 106, 48, 110, 56, 56, 112, 0, 0, 0, 0, 12,
    0, 16, 0, 0, 0, 12, 0, 11, 0, 4, 0, 12, 0, 0, 0, 60, 0, 0, 0, 0, 0, 0, 2, 4,
    0, 0, 0, 32, 0, 0, 0, 104, 106, 101, 114, 97, 57, 114, 49, 57, 111, 115, 55,
    111, 117, 109, 105, 50, 50, 115, 52, 109, 107, 98, 97, 56, 52, 106, 100,
    110, 49, 54, 101, 0, 0, 10, 0, 24, 0, 12, 0, 8, 0, 4, 0, 10, 0, 0, 0, 20, 0,
    0, 0, 24, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 91, 49,
    93, 0, 14, 0, 0, 0, 109, 117, 116, 97, 116, 111, 114, 95, 110, 97, 109, 101,
    95, 49, 0, 0,
  ]),
  'c/5vm3movfjjpjs5sanpmnd4n965kvn04p/m': new Uint8Array([
    12, 0, 0, 0, 0, 0, 6, 0, 8, 0, 4, 0, 6, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0, 48,
    0, 0, 0, 4, 0, 0, 0, 32, 0, 0, 0, 104, 106, 101, 114, 97, 57, 114, 49, 57,
    111, 115, 55, 111, 117, 109, 105, 50, 50, 115, 52, 109, 107, 98, 97, 56, 52,
    106, 100, 110, 49, 54, 101, 0, 0, 0, 0, 32, 0, 0, 0, 98, 107, 53, 114, 51,
    102, 50, 117, 105, 51, 110, 101, 103, 56, 103, 104, 56, 110, 97, 56, 112,
    110, 56, 111, 49, 105, 106, 48, 110, 56, 56, 112, 0, 0, 0, 0,
  ]),
  'c/bk5r3f2ui3neg8gh8na8pn8o1ij0n88p/r': new Uint8Array([1, 0]),
  'c/5vm3movfjjpjs5sanpmnd4n965kvn04p/r': new Uint8Array([1, 0]),
  'c/c50qh3sv6pv6g956205g5566ftjd20pr/d': new Uint8Array([
    16, 0, 0, 0, 0, 0, 10, 0, 16, 0, 12, 0, 8, 0, 4, 0, 10, 0, 0, 0, 12, 0, 0,
    0, 12, 0, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 0, 106, 100, 104, 55,
    115, 99, 101, 115, 111, 110, 98, 112, 109, 105, 107, 55, 107, 48, 48, 118,
    110, 98, 52, 115, 107, 97, 48, 103, 111, 114, 101, 101, 0, 0, 0, 0, 12, 0,
    16, 0, 0, 0, 12, 0, 11, 0, 4, 0, 12, 0, 0, 0, 60, 0, 0, 0, 0, 0, 0, 3, 4, 0,
    0, 0, 32, 0, 0, 0, 104, 106, 101, 114, 97, 57, 114, 49, 57, 111, 115, 55,
    111, 117, 109, 105, 50, 50, 115, 52, 109, 107, 98, 97, 56, 52, 106, 100,
    110, 49, 54, 101, 0, 0, 0, 0, 8, 0, 8, 0, 0, 0, 4, 0, 8, 0, 0, 0, 4, 0, 0,
    0, 15, 0, 0, 0, 34, 115, 121, 110, 99, 95, 99, 111, 111, 107, 105, 101, 95,
    50, 34, 0,
  ]),
  'c/c50qh3sv6pv6g956205g5566ftjd20pr/m': new Uint8Array([
    12, 0, 0, 0, 0, 0, 6, 0, 8, 0, 4, 0, 6, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 4,
    0, 0, 0, 32, 0, 0, 0, 106, 100, 104, 55, 115, 99, 101, 115, 111, 110, 98,
    112, 109, 105, 107, 55, 107, 48, 48, 118, 110, 98, 52, 115, 107, 97, 48,
    103, 111, 114, 101, 101, 0, 0, 0, 0,
  ]),
  'h/sync': new Uint8Array([
    99, 53, 48, 113, 104, 51, 115, 118, 54, 112, 118, 54, 103, 57, 53, 54, 50,
    48, 53, 103, 53, 53, 54, 54, 102, 116, 106, 100, 50, 48, 112, 114,
  ]),
  'c/c50qh3sv6pv6g956205g5566ftjd20pr/r': new Uint8Array([1, 0]),
  'c/e0vv0irhobdvsifog3v0prpkniapg1iv/d': new Uint8Array([
    12, 0, 0, 0, 0, 0, 6, 0, 8, 0, 4, 0, 6, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 12,
    0, 0, 0, 8, 0, 12, 0, 8, 0, 4, 0, 8, 0, 0, 0, 8, 0, 0, 0, 12, 0, 0, 0, 3, 0,
    0, 0, 34, 50, 34, 0, 5, 0, 0, 0, 108, 111, 99, 97, 108, 0, 0, 0,
  ]),
  'c/od2vk77iok5pjbp2d4mjv8u5bcjk0u4e/d': new Uint8Array([
    20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 16, 0, 12, 0, 8, 0, 4, 0, 10, 0, 0, 0,
    12, 0, 0, 0, 12, 0, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 0, 101, 48,
    118, 118, 48, 105, 114, 104, 111, 98, 100, 118, 115, 105, 102, 111, 103, 51,
    118, 48, 112, 114, 112, 107, 110, 105, 97, 112, 103, 49, 105, 118, 0, 0, 0,
    0, 12, 0, 16, 0, 0, 0, 12, 0, 11, 0, 4, 0, 12, 0, 0, 0, 60, 0, 0, 0, 0, 0,
    0, 2, 4, 0, 0, 0, 32, 0, 0, 0, 53, 118, 109, 51, 109, 111, 118, 102, 106,
    106, 112, 106, 115, 53, 115, 97, 110, 112, 109, 110, 100, 52, 110, 57, 54,
    53, 107, 118, 110, 48, 52, 112, 0, 0, 10, 0, 24, 0, 12, 0, 8, 0, 4, 0, 10,
    0, 0, 0, 20, 0, 0, 0, 24, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0,
    0, 0, 91, 50, 93, 0, 14, 0, 0, 0, 109, 117, 116, 97, 116, 111, 114, 95, 110,
    97, 109, 101, 95, 50, 0, 0,
  ]),
  'c/od2vk77iok5pjbp2d4mjv8u5bcjk0u4e/m': new Uint8Array([
    12, 0, 0, 0, 0, 0, 6, 0, 8, 0, 4, 0, 6, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0, 48,
    0, 0, 0, 4, 0, 0, 0, 32, 0, 0, 0, 53, 118, 109, 51, 109, 111, 118, 102, 106,
    106, 112, 106, 115, 53, 115, 97, 110, 112, 109, 110, 100, 52, 110, 57, 54,
    53, 107, 118, 110, 48, 52, 112, 0, 0, 0, 0, 32, 0, 0, 0, 101, 48, 118, 118,
    48, 105, 114, 104, 111, 98, 100, 118, 115, 105, 102, 111, 103, 51, 118, 48,
    112, 114, 112, 107, 110, 105, 97, 112, 103, 49, 105, 118, 0, 0, 0, 0,
  ]),
  'c/e0vv0irhobdvsifog3v0prpkniapg1iv/r': new Uint8Array([1, 0]),
  'c/od2vk77iok5pjbp2d4mjv8u5bcjk0u4e/r': new Uint8Array([1, 0]),
};

export const testDataV1 = {
  'c/jdh7scesonbpmik7k00vnb4ska0goree/d': [],
  'c/hjera9r19os7oumi22s4mkba84jdn16e/d': {
    meta: {
      type: MetaTypeV1.SnapshotMeta,
      basisHash: null,
      lastMutationID: 0,
      cookieJSON: null,
    },
    valueHash: 'jdh7scesonbpmik7k00vnb4ska0goree',
    indexes: [],
  },
  'c/hjera9r19os7oumi22s4mkba84jdn16e/m': ['jdh7scesonbpmik7k00vnb4ska0goree'],
  'h/main': 'od2vk77iok5pjbp2d4mjv8u5bcjk0u4e',
  'c/jdh7scesonbpmik7k00vnb4ska0goree/r': 2,
  'c/hjera9r19os7oumi22s4mkba84jdn16e/r': 1,
  'c/bk5r3f2ui3neg8gh8na8pn8o1ij0n88p/d': [['local', '1']],
  'c/5vm3movfjjpjs5sanpmnd4n965kvn04p/d': {
    meta: {
      type: MetaTypeV1.LocalMeta,
      basisHash: 'hjera9r19os7oumi22s4mkba84jdn16e',
      mutationID: 1,
      mutatorName: 'mutator_name_1',
      mutatorArgsJSON: [1],
      originalHash: null,
    },
    valueHash: 'bk5r3f2ui3neg8gh8na8pn8o1ij0n88p',
    indexes: [],
  },
  'c/5vm3movfjjpjs5sanpmnd4n965kvn04p/m': [
    'bk5r3f2ui3neg8gh8na8pn8o1ij0n88p',
    'hjera9r19os7oumi22s4mkba84jdn16e',
  ],
  'c/bk5r3f2ui3neg8gh8na8pn8o1ij0n88p/r': 1,
  'c/5vm3movfjjpjs5sanpmnd4n965kvn04p/r': 1,
  'c/c50qh3sv6pv6g956205g5566ftjd20pr/d': {
    meta: {
      type: MetaTypeV1.SnapshotMeta,
      basisHash: 'hjera9r19os7oumi22s4mkba84jdn16e',
      lastMutationID: 0,
      cookieJSON: 'sync_cookie_2',
    },
    valueHash: 'jdh7scesonbpmik7k00vnb4ska0goree',
    indexes: [],
  },
  'c/c50qh3sv6pv6g956205g5566ftjd20pr/m': ['jdh7scesonbpmik7k00vnb4ska0goree'],
  'h/sync': 'c50qh3sv6pv6g956205g5566ftjd20pr',
  'c/c50qh3sv6pv6g956205g5566ftjd20pr/r': 1,
  'c/e0vv0irhobdvsifog3v0prpkniapg1iv/d': [['local', '2']],
  'c/od2vk77iok5pjbp2d4mjv8u5bcjk0u4e/d': {
    meta: {
      type: MetaTypeV1.LocalMeta,
      basisHash: '5vm3movfjjpjs5sanpmnd4n965kvn04p',
      mutationID: 2,
      mutatorName: 'mutator_name_2',
      mutatorArgsJSON: [2],
      originalHash: null,
    },
    valueHash: 'e0vv0irhobdvsifog3v0prpkniapg1iv',
    indexes: [],
  },
  'c/od2vk77iok5pjbp2d4mjv8u5bcjk0u4e/m': [
    'e0vv0irhobdvsifog3v0prpkniapg1iv',
    '5vm3movfjjpjs5sanpmnd4n965kvn04p',
  ],
  'c/e0vv0irhobdvsifog3v0prpkniapg1iv/r': 1,
  'c/od2vk77iok5pjbp2d4mjv8u5bcjk0u4e/r': 1,
  'sys/storage-format-version': 1,
};

export const testDataV2 = {
  'c/9lrb08p9b7jqo8oad3aef60muj4td8ke/d': {
    indexes: [],
    meta: {
      basisHash: null,
      cookieJSON: null,
      lastMutationID: 0,
      type: 3,
    },
    valueHash: 'mdcncodijhl6jk2o8bb7m0hg15p3sf24',
  },
  'c/9lrb08p9b7jqo8oad3aef60muj4td8ke/m': ['mdcncodijhl6jk2o8bb7m0hg15p3sf24'],
  'c/9lrb08p9b7jqo8oad3aef60muj4td8ke/r': 1,
  'c/b3863icha1gsbso9ffljo02ei3rre2o2/d': [0, [['local', '1']]],
  'c/b3863icha1gsbso9ffljo02ei3rre2o2/r': 1,
  'c/c1h0l57s5utibjcb949ounpad7epfbsa/d': {
    indexes: [],
    meta: {
      basisHash: 'kf7ac7jta5b86iu74e3sqk49ec0tq6d3',
      mutationID: 2,
      mutatorArgsJSON: [2],
      mutatorName: 'mutator_name_2',
      originalHash: null,
      type: 2,
    },
    valueHash: 'rkk61b2245as3tddh7gdsa1aedgujvhl',
  },
  'c/c1h0l57s5utibjcb949ounpad7epfbsa/m': [
    'rkk61b2245as3tddh7gdsa1aedgujvhl',
    'kf7ac7jta5b86iu74e3sqk49ec0tq6d3',
  ],
  'c/c1h0l57s5utibjcb949ounpad7epfbsa/r': 1,
  'c/e3fh6n436slf6850mgv1uld8j2kf459b/d': {
    indexes: [],
    meta: {
      basisHash: '9lrb08p9b7jqo8oad3aef60muj4td8ke',
      cookieJSON: 'sync_cookie_2',
      lastMutationID: 0,
      type: 3,
    },
    valueHash: 'mdcncodijhl6jk2o8bb7m0hg15p3sf24',
  },
  'c/e3fh6n436slf6850mgv1uld8j2kf459b/m': ['mdcncodijhl6jk2o8bb7m0hg15p3sf24'],
  'c/e3fh6n436slf6850mgv1uld8j2kf459b/r': 1,
  'c/kf7ac7jta5b86iu74e3sqk49ec0tq6d3/d': {
    indexes: [],
    meta: {
      basisHash: '9lrb08p9b7jqo8oad3aef60muj4td8ke',
      mutationID: 1,
      mutatorArgsJSON: [1],
      mutatorName: 'mutator_name_1',
      originalHash: null,
      type: 2,
    },
    valueHash: 'b3863icha1gsbso9ffljo02ei3rre2o2',
  },
  'c/kf7ac7jta5b86iu74e3sqk49ec0tq6d3/m': [
    'b3863icha1gsbso9ffljo02ei3rre2o2',
    '9lrb08p9b7jqo8oad3aef60muj4td8ke',
  ],
  'c/kf7ac7jta5b86iu74e3sqk49ec0tq6d3/r': 1,
  'c/mdcncodijhl6jk2o8bb7m0hg15p3sf24/d': [0, []],
  'c/mdcncodijhl6jk2o8bb7m0hg15p3sf24/r': 2,
  'c/rkk61b2245as3tddh7gdsa1aedgujvhl/d': [0, [['local', '2']]],
  'c/rkk61b2245as3tddh7gdsa1aedgujvhl/r': 1,
  'h/main': 'c1h0l57s5utibjcb949ounpad7epfbsa',
  'h/sync': 'e3fh6n436slf6850mgv1uld8j2kf459b',
  'sys/storage-format-version': 2,
};

export const testIndexDataV0 = {
  'c/jdh7scesonbpmik7k00vnb4ska0goree/d': new Uint8Array([
    12, 0, 0, 0, 0, 0, 6, 0, 8, 0, 4, 0, 6, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0,
  ]),
  'c/hjera9r19os7oumi22s4mkba84jdn16e/d': new Uint8Array([
    16, 0, 0, 0, 0, 0, 10, 0, 16, 0, 12, 0, 8, 0, 4, 0, 10, 0, 0, 0, 12, 0, 0,
    0, 12, 0, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 0, 106, 100, 104, 55,
    115, 99, 101, 115, 111, 110, 98, 112, 109, 105, 107, 55, 107, 48, 48, 118,
    110, 98, 52, 115, 107, 97, 48, 103, 111, 114, 101, 101, 0, 0, 0, 0, 12, 0,
    12, 0, 0, 0, 0, 0, 11, 0, 4, 0, 12, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 3, 8, 0,
    8, 0, 0, 0, 4, 0, 8, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 110, 117, 108, 108,
  ]),
  'c/hjera9r19os7oumi22s4mkba84jdn16e/m': new Uint8Array([
    12, 0, 0, 0, 0, 0, 6, 0, 8, 0, 4, 0, 6, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 4,
    0, 0, 0, 32, 0, 0, 0, 106, 100, 104, 55, 115, 99, 101, 115, 111, 110, 98,
    112, 109, 105, 107, 55, 107, 48, 48, 118, 110, 98, 52, 115, 107, 97, 48,
    103, 111, 114, 101, 101, 0, 0, 0, 0,
  ]),
  'h/main': new Uint8Array([
    112, 102, 52, 56, 114, 112, 108, 103, 97, 53, 99, 115, 51, 101, 109, 57,
    110, 101, 118, 104, 118, 104, 109, 110, 113, 54, 112, 99, 55, 50, 118, 113,
  ]),
  'c/jdh7scesonbpmik7k00vnb4ska0goree/r': new Uint8Array([1, 0]),
  'c/hjera9r19os7oumi22s4mkba84jdn16e/r': new Uint8Array([1, 0]),
  'c/bk5r3f2ui3neg8gh8na8pn8o1ij0n88p/d': new Uint8Array([
    12, 0, 0, 0, 0, 0, 6, 0, 8, 0, 4, 0, 6, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 12,
    0, 0, 0, 8, 0, 12, 0, 8, 0, 4, 0, 8, 0, 0, 0, 8, 0, 0, 0, 12, 0, 0, 0, 3, 0,
    0, 0, 34, 49, 34, 0, 5, 0, 0, 0, 108, 111, 99, 97, 108, 0, 0, 0,
  ]),
  'c/5vm3movfjjpjs5sanpmnd4n965kvn04p/d': new Uint8Array([
    20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 16, 0, 12, 0, 8, 0, 4, 0, 10, 0, 0, 0,
    12, 0, 0, 0, 12, 0, 0, 0, 60, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 0, 98, 107, 53,
    114, 51, 102, 50, 117, 105, 51, 110, 101, 103, 56, 103, 104, 56, 110, 97,
    56, 112, 110, 56, 111, 49, 105, 106, 48, 110, 56, 56, 112, 0, 0, 0, 0, 12,
    0, 16, 0, 0, 0, 12, 0, 11, 0, 4, 0, 12, 0, 0, 0, 60, 0, 0, 0, 0, 0, 0, 2, 4,
    0, 0, 0, 32, 0, 0, 0, 104, 106, 101, 114, 97, 57, 114, 49, 57, 111, 115, 55,
    111, 117, 109, 105, 50, 50, 115, 52, 109, 107, 98, 97, 56, 52, 106, 100,
    110, 49, 54, 101, 0, 0, 10, 0, 24, 0, 12, 0, 8, 0, 4, 0, 10, 0, 0, 0, 20, 0,
    0, 0, 24, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 91, 49,
    93, 0, 14, 0, 0, 0, 109, 117, 116, 97, 116, 111, 114, 95, 110, 97, 109, 101,
    95, 49, 0, 0,
  ]),
  'c/5vm3movfjjpjs5sanpmnd4n965kvn04p/m': new Uint8Array([
    12, 0, 0, 0, 0, 0, 6, 0, 8, 0, 4, 0, 6, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0, 48,
    0, 0, 0, 4, 0, 0, 0, 32, 0, 0, 0, 104, 106, 101, 114, 97, 57, 114, 49, 57,
    111, 115, 55, 111, 117, 109, 105, 50, 50, 115, 52, 109, 107, 98, 97, 56, 52,
    106, 100, 110, 49, 54, 101, 0, 0, 0, 0, 32, 0, 0, 0, 98, 107, 53, 114, 51,
    102, 50, 117, 105, 51, 110, 101, 103, 56, 103, 104, 56, 110, 97, 56, 112,
    110, 56, 111, 49, 105, 106, 48, 110, 56, 56, 112, 0, 0, 0, 0,
  ]),
  'c/bk5r3f2ui3neg8gh8na8pn8o1ij0n88p/r': new Uint8Array([2, 0]),
  'c/5vm3movfjjpjs5sanpmnd4n965kvn04p/r': new Uint8Array([1, 0]),
  'c/fd4k0ag9h3h7i49q56bohra05cr0v236/d': new Uint8Array([
    12, 0, 0, 0, 0, 0, 6, 0, 8, 0, 4, 0, 6, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 12,
    0, 0, 0, 8, 0, 12, 0, 8, 0, 4, 0, 8, 0, 0, 0, 8, 0, 0, 0, 12, 0, 0, 0, 3, 0,
    0, 0, 34, 49, 34, 0, 8, 0, 0, 0, 0, 49, 0, 108, 111, 99, 97, 108,
  ]),
  'c/prs38sr9ijdeskrlf0oj5vqrs2j3lku2/d': new Uint8Array([
    16, 0, 0, 0, 0, 0, 10, 0, 16, 0, 12, 0, 8, 0, 4, 0, 10, 0, 0, 0, 12, 0, 0,
    0, 16, 0, 0, 0, 156, 0, 0, 0, 1, 0, 0, 0, 44, 0, 0, 0, 32, 0, 0, 0, 98, 107,
    53, 114, 51, 102, 50, 117, 105, 51, 110, 101, 103, 56, 103, 104, 56, 110,
    97, 56, 112, 110, 56, 111, 49, 105, 106, 48, 110, 56, 56, 112, 0, 0, 0, 0,
    204, 255, 255, 255, 8, 0, 0, 0, 52, 0, 0, 0, 32, 0, 0, 0, 102, 100, 52, 107,
    48, 97, 103, 57, 104, 51, 104, 55, 105, 52, 57, 113, 53, 54, 98, 111, 104,
    114, 97, 48, 53, 99, 114, 48, 118, 50, 51, 54, 0, 0, 0, 0, 8, 0, 12, 0, 8,
    0, 4, 0, 8, 0, 0, 0, 8, 0, 0, 0, 16, 0, 0, 0, 5, 0, 0, 0, 108, 111, 99, 97,
    108, 0, 0, 0, 1, 0, 0, 0, 50, 0, 0, 0, 12, 0, 16, 0, 0, 0, 12, 0, 11, 0, 4,
    0, 12, 0, 0, 0, 56, 0, 0, 0, 0, 0, 0, 1, 4, 0, 0, 0, 32, 0, 0, 0, 53, 118,
    109, 51, 109, 111, 118, 102, 106, 106, 112, 106, 115, 53, 115, 97, 110, 112,
    109, 110, 100, 52, 110, 57, 54, 53, 107, 118, 110, 48, 52, 112, 0, 0, 6, 0,
    12, 0, 4, 0, 6, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0,
  ]),
  'c/prs38sr9ijdeskrlf0oj5vqrs2j3lku2/m': new Uint8Array([
    12, 0, 0, 0, 0, 0, 6, 0, 8, 0, 4, 0, 6, 0, 0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 92,
    0, 0, 0, 48, 0, 0, 0, 4, 0, 0, 0, 32, 0, 0, 0, 102, 100, 52, 107, 48, 97,
    103, 57, 104, 51, 104, 55, 105, 52, 57, 113, 53, 54, 98, 111, 104, 114, 97,
    48, 53, 99, 114, 48, 118, 50, 51, 54, 0, 0, 0, 0, 32, 0, 0, 0, 53, 118, 109,
    51, 109, 111, 118, 102, 106, 106, 112, 106, 115, 53, 115, 97, 110, 112, 109,
    110, 100, 52, 110, 57, 54, 53, 107, 118, 110, 48, 52, 112, 0, 0, 0, 0, 32,
    0, 0, 0, 98, 107, 53, 114, 51, 102, 50, 117, 105, 51, 110, 101, 103, 56,
    103, 104, 56, 110, 97, 56, 112, 110, 56, 111, 49, 105, 106, 48, 110, 56, 56,
    112, 0, 0, 0, 0,
  ]),
  'c/fd4k0ag9h3h7i49q56bohra05cr0v236/r': new Uint8Array([1, 0]),
  'c/prs38sr9ijdeskrlf0oj5vqrs2j3lku2/r': new Uint8Array([1, 0]),
  'c/4chshi38boio0e88c3aqgb8ubeoq3gfn/d': new Uint8Array([
    12, 0, 0, 0, 0, 0, 6, 0, 8, 0, 4, 0, 6, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 12,
    0, 0, 0, 8, 0, 12, 0, 8, 0, 4, 0, 8, 0, 0, 0, 8, 0, 0, 0, 12, 0, 0, 0, 3, 0,
    0, 0, 34, 51, 34, 0, 5, 0, 0, 0, 108, 111, 99, 97, 108, 0, 0, 0,
  ]),
  'c/oab8b08vla0k6a3380t77fqac15o33vl/d': new Uint8Array([
    12, 0, 0, 0, 0, 0, 6, 0, 8, 0, 4, 0, 6, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 12,
    0, 0, 0, 8, 0, 12, 0, 8, 0, 4, 0, 8, 0, 0, 0, 8, 0, 0, 0, 12, 0, 0, 0, 3, 0,
    0, 0, 34, 51, 34, 0, 8, 0, 0, 0, 0, 51, 0, 108, 111, 99, 97, 108,
  ]),
  'c/pf48rplga5cs3em9nevhvhmnq6pc72vq/d': new Uint8Array([
    20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 16, 0, 12, 0, 8, 0, 4, 0, 10, 0, 0, 0,
    12, 0, 0, 0, 16, 0, 0, 0, 156, 0, 0, 0, 1, 0, 0, 0, 44, 0, 0, 0, 32, 0, 0,
    0, 52, 99, 104, 115, 104, 105, 51, 56, 98, 111, 105, 111, 48, 101, 56, 56,
    99, 51, 97, 113, 103, 98, 56, 117, 98, 101, 111, 113, 51, 103, 102, 110, 0,
    0, 0, 0, 204, 255, 255, 255, 8, 0, 0, 0, 52, 0, 0, 0, 32, 0, 0, 0, 111, 97,
    98, 56, 98, 48, 56, 118, 108, 97, 48, 107, 54, 97, 51, 51, 56, 48, 116, 55,
    55, 102, 113, 97, 99, 49, 53, 111, 51, 51, 118, 108, 0, 0, 0, 0, 8, 0, 12,
    0, 8, 0, 4, 0, 8, 0, 0, 0, 8, 0, 0, 0, 16, 0, 0, 0, 5, 0, 0, 0, 108, 111,
    99, 97, 108, 0, 0, 0, 1, 0, 0, 0, 50, 0, 0, 0, 12, 0, 16, 0, 0, 0, 12, 0,
    11, 0, 4, 0, 12, 0, 0, 0, 60, 0, 0, 0, 0, 0, 0, 2, 4, 0, 0, 0, 32, 0, 0, 0,
    112, 114, 115, 51, 56, 115, 114, 57, 105, 106, 100, 101, 115, 107, 114, 108,
    102, 48, 111, 106, 53, 118, 113, 114, 115, 50, 106, 51, 108, 107, 117, 50,
    0, 0, 10, 0, 24, 0, 12, 0, 8, 0, 4, 0, 10, 0, 0, 0, 20, 0, 0, 0, 24, 0, 0,
    0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 91, 51, 93, 0, 14, 0, 0,
    0, 109, 117, 116, 97, 116, 111, 114, 95, 110, 97, 109, 101, 95, 51, 0, 0,
  ]),
  'c/pf48rplga5cs3em9nevhvhmnq6pc72vq/m': new Uint8Array([
    12, 0, 0, 0, 0, 0, 6, 0, 8, 0, 4, 0, 6, 0, 0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 92,
    0, 0, 0, 48, 0, 0, 0, 4, 0, 0, 0, 32, 0, 0, 0, 111, 97, 98, 56, 98, 48, 56,
    118, 108, 97, 48, 107, 54, 97, 51, 51, 56, 48, 116, 55, 55, 102, 113, 97,
    99, 49, 53, 111, 51, 51, 118, 108, 0, 0, 0, 0, 32, 0, 0, 0, 112, 114, 115,
    51, 56, 115, 114, 57, 105, 106, 100, 101, 115, 107, 114, 108, 102, 48, 111,
    106, 53, 118, 113, 114, 115, 50, 106, 51, 108, 107, 117, 50, 0, 0, 0, 0, 32,
    0, 0, 0, 52, 99, 104, 115, 104, 105, 51, 56, 98, 111, 105, 111, 48, 101, 56,
    56, 99, 51, 97, 113, 103, 98, 56, 117, 98, 101, 111, 113, 51, 103, 102, 110,
    0, 0, 0, 0,
  ]),
  'c/4chshi38boio0e88c3aqgb8ubeoq3gfn/r': new Uint8Array([1, 0]),
  'c/oab8b08vla0k6a3380t77fqac15o33vl/r': new Uint8Array([1, 0]),
  'c/pf48rplga5cs3em9nevhvhmnq6pc72vq/r': new Uint8Array([1, 0]),
};

export const testIndexDataV1 = {
  'c/jdh7scesonbpmik7k00vnb4ska0goree/d': [],
  'c/hjera9r19os7oumi22s4mkba84jdn16e/d': {
    meta: {type: 3, basisHash: null, lastMutationID: 0, cookieJSON: null},
    valueHash: 'jdh7scesonbpmik7k00vnb4ska0goree',
    indexes: [],
  },
  'c/hjera9r19os7oumi22s4mkba84jdn16e/m': ['jdh7scesonbpmik7k00vnb4ska0goree'],
  'h/main': 'pf48rplga5cs3em9nevhvhmnq6pc72vq',
  'c/jdh7scesonbpmik7k00vnb4ska0goree/r': 1,
  'c/hjera9r19os7oumi22s4mkba84jdn16e/r': 1,
  'c/bk5r3f2ui3neg8gh8na8pn8o1ij0n88p/d': [['local', '1']],
  'c/5vm3movfjjpjs5sanpmnd4n965kvn04p/d': {
    meta: {
      type: 2,
      basisHash: 'hjera9r19os7oumi22s4mkba84jdn16e',
      mutationID: 1,
      mutatorName: 'mutator_name_1',
      mutatorArgsJSON: [1],
      originalHash: null,
    },
    valueHash: 'bk5r3f2ui3neg8gh8na8pn8o1ij0n88p',
    indexes: [],
  },
  'c/5vm3movfjjpjs5sanpmnd4n965kvn04p/m': [
    'bk5r3f2ui3neg8gh8na8pn8o1ij0n88p',
    'hjera9r19os7oumi22s4mkba84jdn16e',
  ],
  'c/bk5r3f2ui3neg8gh8na8pn8o1ij0n88p/r': 2,
  'c/5vm3movfjjpjs5sanpmnd4n965kvn04p/r': 1,
  'c/fd4k0ag9h3h7i49q56bohra05cr0v236/d': [['\u00001\u0000local', '1']],
  'c/prs38sr9ijdeskrlf0oj5vqrs2j3lku2/d': {
    meta: {
      type: 1,
      basisHash: '5vm3movfjjpjs5sanpmnd4n965kvn04p',
      lastMutationID: 1,
    },
    valueHash: 'bk5r3f2ui3neg8gh8na8pn8o1ij0n88p',
    indexes: [
      {
        definition: {name: '2', keyPrefix: 'local', jsonPointer: ''},
        valueHash: 'fd4k0ag9h3h7i49q56bohra05cr0v236',
      },
    ],
  },
  'c/prs38sr9ijdeskrlf0oj5vqrs2j3lku2/m': [
    'bk5r3f2ui3neg8gh8na8pn8o1ij0n88p',
    '5vm3movfjjpjs5sanpmnd4n965kvn04p',
    'fd4k0ag9h3h7i49q56bohra05cr0v236',
  ],
  'c/fd4k0ag9h3h7i49q56bohra05cr0v236/r': 1,
  'c/prs38sr9ijdeskrlf0oj5vqrs2j3lku2/r': 1,
  'c/4chshi38boio0e88c3aqgb8ubeoq3gfn/d': [['local', '3']],
  'c/oab8b08vla0k6a3380t77fqac15o33vl/d': [['\u00003\u0000local', '3']],
  'c/pf48rplga5cs3em9nevhvhmnq6pc72vq/d': {
    meta: {
      type: 2,
      basisHash: 'prs38sr9ijdeskrlf0oj5vqrs2j3lku2',
      mutationID: 2,
      mutatorName: 'mutator_name_3',
      mutatorArgsJSON: [3],
      originalHash: null,
    },
    valueHash: '4chshi38boio0e88c3aqgb8ubeoq3gfn',
    indexes: [
      {
        definition: {name: '2', keyPrefix: 'local', jsonPointer: ''},
        valueHash: 'oab8b08vla0k6a3380t77fqac15o33vl',
      },
    ],
  },
  'c/pf48rplga5cs3em9nevhvhmnq6pc72vq/m': [
    '4chshi38boio0e88c3aqgb8ubeoq3gfn',
    'prs38sr9ijdeskrlf0oj5vqrs2j3lku2',
    'oab8b08vla0k6a3380t77fqac15o33vl',
  ],
  'c/4chshi38boio0e88c3aqgb8ubeoq3gfn/r': 1,
  'c/oab8b08vla0k6a3380t77fqac15o33vl/r': 1,
  'c/pf48rplga5cs3em9nevhvhmnq6pc72vq/r': 1,
  'sys/storage-format-version': 1,
};

export const testIndexDataV2 = {
  'c/0ad65d6okc5uttpt6t7rougv91eoueka/d': {
    indexes: [
      {
        definition: {
          jsonPointer: '',
          keyPrefix: 'local',
          name: '2',
        },
        valueHash: 'bla65gnithpsbf9o3i3hfljbdvfseph8',
      },
    ],
    meta: {
      basisHash: 'kf7ac7jta5b86iu74e3sqk49ec0tq6d3',
      lastMutationID: 1,
      type: 1,
    },
    valueHash: 'b3863icha1gsbso9ffljo02ei3rre2o2',
  },
  'c/0ad65d6okc5uttpt6t7rougv91eoueka/m': [
    'b3863icha1gsbso9ffljo02ei3rre2o2',
    'kf7ac7jta5b86iu74e3sqk49ec0tq6d3',
    'bla65gnithpsbf9o3i3hfljbdvfseph8',
  ],
  'c/0ad65d6okc5uttpt6t7rougv91eoueka/r': 1,
  'c/9lrb08p9b7jqo8oad3aef60muj4td8ke/d': {
    indexes: [],
    meta: {
      basisHash: null,
      cookieJSON: null,
      lastMutationID: 0,
      type: 3,
    },
    valueHash: 'mdcncodijhl6jk2o8bb7m0hg15p3sf24',
  },
  'c/9lrb08p9b7jqo8oad3aef60muj4td8ke/m': ['mdcncodijhl6jk2o8bb7m0hg15p3sf24'],
  'c/9lrb08p9b7jqo8oad3aef60muj4td8ke/r': 1,
  'c/b3863icha1gsbso9ffljo02ei3rre2o2/d': [0, [['local', '1']]],
  'c/b3863icha1gsbso9ffljo02ei3rre2o2/r': 2,
  'c/bla65gnithpsbf9o3i3hfljbdvfseph8/d': [0, [['\u00001\u0000local', '1']]],
  'c/bla65gnithpsbf9o3i3hfljbdvfseph8/r': 1,
  'c/cb46475b4lgd84e763otcji59br5ndmo/d': [0, [['local', '3']]],
  'c/cb46475b4lgd84e763otcji59br5ndmo/r': 1,
  'c/kf7ac7jta5b86iu74e3sqk49ec0tq6d3/d': {
    indexes: [],
    meta: {
      basisHash: '9lrb08p9b7jqo8oad3aef60muj4td8ke',
      mutationID: 1,
      mutatorArgsJSON: [1],
      mutatorName: 'mutator_name_1',
      originalHash: null,
      type: 2,
    },
    valueHash: 'b3863icha1gsbso9ffljo02ei3rre2o2',
  },
  'c/kf7ac7jta5b86iu74e3sqk49ec0tq6d3/m': [
    'b3863icha1gsbso9ffljo02ei3rre2o2',
    '9lrb08p9b7jqo8oad3aef60muj4td8ke',
  ],
  'c/kf7ac7jta5b86iu74e3sqk49ec0tq6d3/r': 1,
  'c/lvi3nkb9703am7ukcet80j7cjfv148vn/d': {
    indexes: [
      {
        definition: {
          jsonPointer: '',
          keyPrefix: 'local',
          name: '2',
        },
        valueHash: 'rni607b73kne1e0ic5gkrri8ttrn5coa',
      },
    ],
    meta: {
      basisHash: '0ad65d6okc5uttpt6t7rougv91eoueka',
      mutationID: 2,
      mutatorArgsJSON: [3],
      mutatorName: 'mutator_name_3',
      originalHash: null,
      type: 2,
    },
    valueHash: 'cb46475b4lgd84e763otcji59br5ndmo',
  },
  'c/lvi3nkb9703am7ukcet80j7cjfv148vn/m': [
    'cb46475b4lgd84e763otcji59br5ndmo',
    '0ad65d6okc5uttpt6t7rougv91eoueka',
    'rni607b73kne1e0ic5gkrri8ttrn5coa',
  ],
  'c/lvi3nkb9703am7ukcet80j7cjfv148vn/r': 1,
  'c/mdcncodijhl6jk2o8bb7m0hg15p3sf24/d': [0, []],
  'c/mdcncodijhl6jk2o8bb7m0hg15p3sf24/r': 1,
  'c/rni607b73kne1e0ic5gkrri8ttrn5coa/d': [0, [['\u00003\u0000local', '3']]],
  'c/rni607b73kne1e0ic5gkrri8ttrn5coa/r': 1,
  'h/main': 'lvi3nkb9703am7ukcet80j7cjfv148vn',
  'sys/storage-format-version': 2,
};
