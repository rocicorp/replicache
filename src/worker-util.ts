// TODO(arv): Include version in path
const SERVICE_WORKER_PATH = new URL('./worker-bundle.js', import.meta.url) + '';
const SCOPE = new URL('./replicache-sw/', import.meta.url) + '';

export interface PostMessage {
  postMessage(message: unknown, transfer: Transferable[]): void;
}

function findServiceWorker(
  reg: ServiceWorkerRegistration,
): ServiceWorker | undefined {
  let sw;
  for (sw of [reg.active, reg.installing, reg.waiting]) {
    if (sw && sw.scriptURL === SERVICE_WORKER_PATH) {
      return sw;
    }
  }

  return undefined;
}

function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
    scope: SCOPE,
  });
}

export async function getWorker(): Promise<ServiceWorker> {
  const reg = await registerServiceWorker();
  const sw = findServiceWorker(reg);
  if (!sw) {
    throw new Error('no service worker');
  }
  return sw;
}

const RESULT_OK = 1;
const RESULT_ERROR = 0;

export type Result<R> =
  | [ok: typeof RESULT_OK, result: R]
  | [ok: typeof RESULT_ERROR, error: string];

export function sendMessage<D, R>(sw: PostMessage, data: D): Promise<R> {
  return new Promise((resolve, reject) => {
    const c = new MessageChannel();
    c.port1.onmessage = (e: MessageEvent<Result<R>>) => {
      const {data} = e;
      if (data[0] === RESULT_OK) {
        resolve(data[1]);
      } else {
        reject(new Error(data[1]));
      }
    };

    sw.postMessage(data, [c.port2]);
  });
}

export async function findWorker(): Promise<PostMessage> {
  let sw;
  for (const reg of await navigator.serviceWorker.getRegistrations()) {
    if ((sw = findServiceWorker(reg))) {
      return sw;
    }
  }

  throw new Error('cannot find service worker');
}
