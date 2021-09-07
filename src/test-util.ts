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
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const noop = function () {};

    self.setup = noop;
    self.teardown = noop;
    self.suiteSetup = noop;
    self.suiteTeardown = noop;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const suite = function () {};
    suite.only = noop;
    suite.skip = noop;
    self.suite = suite as unknown as Mocha.SuiteFunction;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const test = function () {};
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
  message: string;
};

export async function initializeNewTab(event: MessageEvent): Promise<void> {
  const {tabId, path} = event.data;

  ['error', 'warn', 'info', 'debug', 'log'].forEach(level => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore No index signature of type 'string' was found on 'Console'.
    console[level] = (...data: unknown[]) => {
      window.opener.postMessage(
        {tabId, id: 'log', result: {level, message: data.join(' ')}},
        window.origin,
      );
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  let module: typeof import('./test-util');
  if (path !== undefined) {
    try {
      module = await import(window.origin + '/' + path);
    } catch (e) {
      console.log('Error importing ' + path + ':', e);
    }
  }

  const handle = async (event: MessageEvent) => {
    if (event.source === null || event.source != window.opener) {
      return;
    }
    const {id, expr} = event.data;
    const response: Response = {tabId, id};
    if (expr) {
      try {
        response.result = await AsyncFunction(
          'module',
          '"use strict"; Object.assign(self, module); {' + expr + '}',
        )(module);
      } catch (e) {
        response.error = e;
      }
    }
    event.source.postMessage(response);
  };

  window.addEventListener('message', handle, false);
  void handle(event);
}

export type Tab = {
  run: (expr: string) => Promise<unknown>;
  close: () => void;
};

// Registered callbacks for listener(), by tabId and call id.
const callbacks: Record<
  string,
  Record<
    string,
    {
      resolve: (res: unknown) => void;
      reject?: (err: unknown) => void;
    }
  >
> = {};

function listener(event: MessageEvent<Response>): void {
  const {tabId, id, result, error} = event.data;
  const tabCallbacks = callbacks[tabId];
  if (tabCallbacks === undefined) {
    return;
  }
  if (id == 'log') {
    const levels: Record<string, typeof console.log> = {
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
    };
    const {level, message} = result as LogResponse;
    (levels[level] ?? console.log)('Page:', message);
  } else {
    const {resolve, reject} = tabCallbacks[id];
    if (error !== undefined && reject !== undefined) {
      reject(error);
    } else {
      resolve(result);
    }
  }
}

export async function newTab(filename?: string): Promise<Tab> {
  const tabId = uuid();
  const {promise, resolve} = resolver<unknown>();

  if (!Object.keys(callbacks).length) {
    window.addEventListener('message', listener, false);
  }
  callbacks[tabId] = {init: {resolve}};
  const tabCallbacks = callbacks[tabId];

  // Open a new tab to a URL that doesn't run anything on load.
  const tab = window.open(
    document.location.origin + '/src/test-util.ts',
    '_blank',
  );
  if (tab == null) {
    throw new Error('Failed to open window');
  }

  // Add a script element to import this file and call initializeNewTab().
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.text = `
    const initialize = async (event) => {
      let testutil = await import(window.origin + '/src/test-util.ts');
      testutil.initializeNewTab(event);
      window.removeEventListener('message', initialize, false);
    };
    window.addEventListener("message", initialize, false);
  `;
  tab.document.head.appendChild(script);

  // Start initialization process, waiting for page to become live.
  const interval = setInterval(() => {
    tab.postMessage({id: 'init', tabId, path: filename}, window.origin);
  }, 100);
  await promise;
  clearInterval(interval);

  return {
    run: async (expr: string) => {
      const id = uuid();
      const {promise, resolve, reject} = resolver<unknown>();
      tabCallbacks[id] = {resolve, reject};
      if (expr.search('return ') == -1) {
        expr = 'return ' + expr;
      }
      tab.postMessage({id, expr}, window.origin);
      const result = await promise;
      delete callbacks[id];
      return result;
    },
    close: () => {
      tab.close();
      delete callbacks[tabId];
      if (!Object.keys(callbacks).length) {
        window.removeEventListener('message', listener);
      }
    },
  };
}
