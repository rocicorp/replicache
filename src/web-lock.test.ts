import 'navigator.locks';
import {expect} from '@esm-bundle/chai';
import {newTab, Tab, isFirefox} from './test-util';

let tab: Tab;

suiteSetup(async () => {
  // TODO(nate): Debug why tests don't work with `noopener` on Firefox.
  tab = await newTab('src/web-lock.test.ts', {opener: isFirefox()});
});

suiteTeardown(() => {
  tab.close();
});

test('storage', async () => {
  localStorage.setItem('test', 'original');
  sessionStorage.setItem('test', 'original');

  await tab.run('sessionStorage.setItem("test", "modified")');
  expect(sessionStorage.getItem('test')).to.equal('original');

  await tab.run('localStorage.setItem("test", "modified")');
  expect(localStorage.getItem('test')).to.equal('modified');
});

export async function lockIfAvailable(name: string): Promise<boolean> {
  return (
    (await navigator.locks.request(
      name,
      {ifAvailable: true, mode: 'shared'},
      async lock => lock !== null,
    )) || false
  );
}

test('ifAvailable', async () => {
  await navigator.locks.request('exlock', {mode: 'shared'}, async () => {
    expect(await tab.run('await lockIfAvailable("exlock")')).to.equal(true);
  });
  await navigator.locks.request('exlock', {mode: 'exclusive'}, async () => {
    expect(await tab.run('await lockIfAvailable("exlock")')).to.equal(false);
  });
});

export async function lockTimeout(name: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = new Promise<void>(resolve => {
    setTimeout(() => {
      controller.abort();
      resolve();
    }, 100);
  });
  const request = navigator.locks.request(
    name,
    {mode: 'shared', signal: controller.signal},
    async () => 'locked',
  );
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore This condition will always return 'false' since the types
    // 'void' and 'string' have no overlap.
    return (await Promise.race([timeout, request])) === 'locked' || false;
  } catch (e) {
    return false;
  }
}

test('timeout', async () => {
  await navigator.locks.request('timeout', {mode: 'shared'}, async () => {
    expect(await tab.run('await lockTimeout("timeout")')).to.equal(true);
  });
  await navigator.locks.request('timeout', {mode: 'exclusive'}, async () => {
    expect(await tab.run('await lockTimeout("timeout")')).to.equal(false);
  });
});
