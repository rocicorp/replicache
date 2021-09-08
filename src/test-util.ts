// Test utils
import type {ReplicacheTest} from './replicache';
import * as utf8 from './utf8';
import {resolver} from './resolver';
import {uuid} from './sync/uuid';

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

defineTestFunctions(self);

type Response = {
  tabId: string;
  id: string;
  result?: unknown;
  error?: unknown;
};

type LogResponse = {
  level: string;
  data: unknown[];
};

export async function initializeNewTab(event: MessageEvent): Promise<void> {
  const {tabId, path} = event.data;
  const {opener} = window;
  if (opener === null) {
    return;
  }

  ['error', 'warn', 'info', 'debug', 'log'].forEach(level => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore No index signature of type 'string' was found on 'Console'.
    console[level] = (...data: unknown[]) => {
      opener.postMessage({tabId, id: 'log', result: {level, data}}, origin);
    };
  });

  let module: typeof import('./test-util');
  if (path !== undefined) {
    try {
      module = await import(new URL('/' + path, location.href).toString());
    } catch (e) {
      console.log('Error importing ' + path + ':', e);
    }
  }

  const handle = async (event: MessageEvent) => {
    const {source, data} = event;
    const {id, expr} = data;
    const response: Response = {tabId, id};

    if (source === null || source !== opener) {
      return;
    }
    if (expr) {
      try {
        response.result = await Function(
          'module',
          `"use strict";
           Object.assign(self, module);
           return (async () => { ${expr} })();`,
        )(module);
      } catch (e) {
        response.error = e;
      }
    }
    opener.postMessage(response, origin);
  };

  addEventListener('message', handle, false);
  void handle(event);
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

function listener(event: MessageEvent<Response>): void {
  const {tabId, id, result, error} = event.data;
  const tabCallbacks = callbacks.get(tabId);
  if (tabCallbacks === undefined) {
    return;
  }
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

export async function newTab(path?: string): Promise<Tab> {
  const tabId = uuid();
  const {promise, resolve} = resolver<unknown>();

  if (!Object.keys(callbacks).length) {
    addEventListener('message', listener, false);
  }
  const tabCallbacks: TabCallbacks = new Map([['init', {resolve}]]);
  callbacks.set(tabId, tabCallbacks);

  // Open a tab to a page on the same domain that doesn't run anything on load.
  const tab = open(
    new URL('/src/test-util.ts', location.href).toString(),
    '_blank',
    'rel="noopener"',
  );
  if (tab === null) {
    throw new Error('Failed to open window');
  }

  // Add a script element to import this file and call initializeNewTab().
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.text = `
    const initialize = async (event) => {
      let testutil = await import(new URL('/src/test-util.ts', location.href));
      testutil.initializeNewTab(event);
      removeEventListener('message', initialize, false);
    };
    addEventListener("message", initialize, false);
  `;
  tab.document.head.appendChild(script);

  // Start initialization process, waiting for page to become live.
  const interval = setInterval(() => {
    tab.postMessage({id: 'init', tabId, path}, origin);
  }, 100);
  await withTimeout(promise, 3000);
  clearInterval(interval);

  return {
    run: async (expr: string) => {
      const id = uuid();
      const {promise, resolve, reject} = resolver<unknown>();
      tabCallbacks.set(id, {resolve, reject});
      if (expr.search('return ') === -1) {
        expr = 'return ' + expr;
      }
      tab.postMessage({id, expr}, origin);
      const result = await withTimeout(promise, 1000);
      tabCallbacks.delete(id);
      return result;
    },
    close: () => {
      tab.close();
      callbacks.delete(tabId);
      if (!Object.keys(callbacks).length) {
        removeEventListener('message', listener);
      }
    },
  };
}
