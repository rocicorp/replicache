import {silenceConsole} from './test-util.js';
import './worker.js';
import type {JSONValue} from './json.js';

// This file is the entry point for the built worker bundle for testing. It
// implements mocking of fetch inside the worker.

silenceConsole();

export type MockFetch = {
  url: string;
  method: 'GET' | 'POST';
  responses: JSONValue[];
};

export type MockFetchRequest = {
  mockFetch: MockFetch;
};

export type ClearFetchMocksRequest = {
  clearFetchMocks: true;
};

const mocks: MockFetch[] = [];

const originalFetch = globalThis.fetch;

async function mockFetch(req: RequestInfo): Promise<Response> {
  let url: string;
  let method: string;
  if (typeof req === 'string') {
    url = req;
    method = 'GET';
  } else {
    ({url, method} = req);
  }

  const index = mocks.findIndex(
    req => req.url === url && req.method === method,
  );
  if (index === -1) {
    return originalFetch(req);
  }
  const m = mocks[index];
  const {responses} = m;
  const response = responses.shift();
  if (responses.length === 0) {
    mocks.splice(index, 1);
  }

  return new Response(JSON.stringify(response));
}

function onMessage(e: MessageEvent) {
  try {
    const found = onMessageInner(e);
    if (found) {
      e.ports[0].postMessage([1, null]);
    }
  } catch (ex) {
    e.ports[0].postMessage([0, ex.message]);
  }
}

self.addEventListener('message', onMessage);

function onMessageInner(e: MessageEvent): boolean {
  const {data} = e;
  if (isMockFetchRequest(data)) {
    globalThis.fetch = mockFetch;
    mocks.push(data.mockFetch);
    return true;
  }

  if (isClearFetchMocksRequest(data)) {
    globalThis.fetch = originalFetch;
    if (mocks.length > 0) {
      console.error('Pending mocks', [...mocks]);
      const n = mocks.reduce((p, v) => p + v.responses.length, 0);
      mocks.length = 0;
      throw new Error(`There are still ${n} pending fetch mocks`);
    }
    return true;
  }
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isMockFetchRequest(data: any): data is MockFetchRequest {
  return data && data.mockFetch;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isClearFetchMocksRequest(data: any): data is ClearFetchMocksRequest {
  return data && data.clearFetchMocks;
}
