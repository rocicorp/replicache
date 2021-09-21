import type {JSONObject, JSONValue} from './json';
import * as utf8 from './utf8';
import {resolver} from './resolver';
import {uuid} from './sync/uuid';
import {
  MutatorDefs,
  Replicache,
  BeginPullResult,
  MAX_REAUTH_TRIES,
} from './replicache';

export class ReplicacheTest<
  // eslint-disable-next-line @typescript-eslint/ban-types
  MD extends MutatorDefs = {},
> extends Replicache<MD> {
  beginPull(maxAuthTries = MAX_REAUTH_TRIES): Promise<BeginPullResult> {
    return super._beginPull(maxAuthTries);
  }

  maybeEndPull(beginPullResult: BeginPullResult): Promise<void> {
    return super._maybeEndPull(beginPullResult);
  }

  invokePush(maxAuthTries: number): Promise<boolean> {
    // indirection to allow test to spy on it.
    return super._invokePush(maxAuthTries);
  }

  protected override _invokePush(maxAuthTries: number): Promise<boolean> {
    return this.invokePush(maxAuthTries);
  }

  protected override _beginPull(
    maxAuthTries: number,
  ): Promise<BeginPullResult> {
    return this.beginPull(maxAuthTries);
  }
}

export const reps: Set<ReplicacheTest> = new Set();

export async function closeAllReps(): Promise<void> {
  for (const rep of reps) {
    if (!rep.closed) {
      await rep.close();
    }
    reps.delete(rep);
  }
}

export const dbsToDrop: Set<string> = new Set();

export function deletaAllDatabases(): void {
  for (const name of dbsToDrop) {
    indexedDB.deleteDatabase(name);
  }
  dbsToDrop.clear();
}

export function b(
  templatePart: TemplateStringsArray,
  ...placeholderValues: unknown[]
): Uint8Array {
  let s = templatePart[0];
  for (let i = 1; i < templatePart.length; i++) {
    s += String(placeholderValues[i - 1]) + templatePart[i];
  }
  return utf8.encode(s);
}

export function defineTestFunctions(self: Window & typeof globalThis): void {
  // Mocha functions aren't available when importing from a new page.
  if (typeof self.suiteSetup !== 'function') {
    const noop = () => undefined;

    self.setup = noop;
    self.teardown = noop;
    self.suiteSetup = noop;
    self.suiteTeardown = noop;

    const suite = () => undefined;
    suite.only = noop;
    suite.skip = noop;
    self.suite = suite as unknown as Mocha.SuiteFunction;

    const test = () => undefined;
    test.only = noop;
    test.skip = noop;
    test.retries = noop;
    self.test = test as unknown as Mocha.TestFunction;
  }
}

export function isFirefox(): boolean {
  return /firefox/i.test(navigator.userAgent);
}

defineTestFunctions(self);

type Response = {
  id: string;
  result?: JSONValue;
  error?: JSONValue;
};

type LogResponse = {
  level: string;
  data: JSONValue[];
};

export async function initializeNewTab(
  tabId: string,
  path: string | null,
  event: StorageEvent,
): Promise<void> {
  const send = (message: JSONObject) => {
    localStorage.setItem(
      tabId + '-in-' + performance.now(),
      JSON.stringify(message),
    );
  };

  ['error', 'warn', 'info', 'debug', 'log'].forEach(level => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore No index signature of type 'string' was found on 'Console'.
    console[level] = (...data) => {
      send({id: 'log', result: {level, data}});
    };
  });

  let module: typeof import('./test-util');
  if (path) {
    try {
      module = await import('/' + path);
    } catch (e) {
      console.log('Error importing ' + path + ':', e);
    }
  }

  const handle = async (event: StorageEvent) => {
    if (!event.key?.startsWith(tabId) || event.newValue === null) {
      return;
    }
    const {id, expr} = JSON.parse(event.newValue);
    const response: Response = {id};

    if (id === 'close') {
      window.close();
    } else if (expr) {
      try {
        response.result = await Function(
          'module',
          `"use strict";
           Object.assign(self, module);
           return (async () => { ${expr} })();`,
        )(module);
      } catch (e) {
        response.error = `${e}`;
      }
    }
    send(response);
  };

  addEventListener('storage', handle, false);
  await handle(event);
}

function withTimeout<T = void>(promise: Promise<T>, ms: number) {
  const timeout = new Promise((_resolve, reject) => {
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms.`)), ms);
  });
  return Promise.race([promise, timeout]);
}

export type Tab = {
  run: (expr: string) => Promise<unknown>;
  close: () => void;
};

// Registered callbacks for listener(), by tabId and call id.
type TabCallbacks = Map<
  string,
  {
    resolve: (res: unknown) => void;
    reject?: (err: unknown) => void;
  }
>;
const callbacks: Map<string, TabCallbacks> = new Map();

function listener(event: StorageEvent): void {
  if (event.newValue === null || event.key === null) {
    return;
  }
  const tabId = event.key.substr(0, 36);
  const tabCallbacks = callbacks.get(tabId);
  if (tabCallbacks === undefined) {
    return;
  }

  const {id, result, error} = JSON.parse(event.newValue) as Response;
  if (id === 'log') {
    const levels: Record<string, typeof console.log> = {
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
    };
    const {level, data} = result as LogResponse;
    (levels[level] ?? console.log)('Tab:', ...data);
  } else {
    const callback = tabCallbacks.get(id);
    if (callback === undefined) {
      return;
    }
    const {resolve, reject} = callback;
    if (error !== undefined && reject !== undefined) {
      reject(error);
    } else {
      resolve(result);
    }
  }
}

export type NewTabOptions = {
  /** Don't pass `noopener` when opening the new window. */
  opener?: boolean;
};

export async function newTab(
  path?: string,
  options?: NewTabOptions,
): Promise<Tab> {
  const tabId = uuid();
  const {promise, resolve} = resolver<unknown>();

  if (!Object.keys(callbacks).length) {
    addEventListener('storage', listener, false);
  }
  const tabCallbacks: TabCallbacks = new Map([['init', {resolve}]]);
  callbacks.set(tabId, tabCallbacks);

  const params: Record<string, string> = {tabId};
  if (path !== undefined) {
    params['path'] = path;
  }
  open(
    '/src/test-util-new-tab.html?' + new URLSearchParams(params).toString(),
    '_blank',
    options?.opener ? '' : 'noopener',
  );

  const send = (message: JSONObject) => {
    localStorage.setItem(
      tabId + '-out-' + performance.now(),
      JSON.stringify(message),
    );
  };

  // Start initialization process, waiting for page to become live.
  const interval = setInterval(() => {
    send({id: 'init'});
  }, 50);
  await withTimeout(promise, 25000);
  clearInterval(interval);

  return {
    run: async (expr: string) => {
      const id = uuid();
      const {promise, resolve, reject} = resolver<unknown>();
      tabCallbacks.set(id, {resolve, reject});
      if (expr.search('return ') === -1) {
        expr = 'return ' + expr;
      }
      send({id, expr});
      const result = await withTimeout(promise, 5000);
      tabCallbacks.delete(id);
      return result;
    },
    close: () => {
      send({id: 'close'});
      callbacks.delete(tabId);
      if (!Object.keys(callbacks).length) {
        removeEventListener('storage', listener);
      }
    },
  };
}
