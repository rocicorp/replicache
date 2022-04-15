import {LogContext} from '@rocicorp/logger';
import {resolver} from '@rocicorp/resolver';
import {expect} from '@esm-bundle/chai';
import sinon, {SinonFakeTimers, useFakeTimers} from 'sinon';
import {initBgIntervalProcess} from './bg-interval';

let clock: SinonFakeTimers;
setup(() => {
  clock = useFakeTimers();
});

teardown(() => {
  clock.restore();
  sinon.restore();
});

test('initBgIntervalProcess starts interval that executed process every intervalMs', async () => {
  let processCallCount = 0;
  const process = () => {
    processCallCount++;
    return Promise.resolve();
  };
  const controller = new AbortController();
  initBgIntervalProcess(
    'testProcess',
    process,
    100,
    new LogContext(),
    controller.signal,
  );

  expect(processCallCount).to.equal(0);
  await clock.tickAsync(100);
  expect(processCallCount).to.equal(1);
  await clock.tickAsync(100);
  expect(processCallCount).to.equal(2);
  await clock.tickAsync(400);
  expect(processCallCount).to.equal(6);
});

test('calling function returned by initBgIntervalProcess, stops interval', async () => {
  let processCallCount = 0;
  const process = () => {
    processCallCount++;
    return Promise.resolve();
  };
  const controller = new AbortController();
  initBgIntervalProcess(
    'testProcess',
    process,
    100,
    new LogContext(),
    controller.signal,
  );

  expect(processCallCount).to.equal(0);
  await clock.tickAsync(100);
  expect(processCallCount).to.equal(1);
  controller.abort();
  await clock.tickAsync(100);
  expect(processCallCount).to.equal(1);
  await clock.tickAsync(400);
  expect(processCallCount).to.equal(1);
});

test('error thrown during process (before stop is called) is logged to error', async () => {
  const lc = new LogContext();
  const errorStub = sinon.stub(console, 'error');
  const process = () => {
    return Promise.reject('TestErrorBeforeStop');
  };
  const controller = new AbortController();
  initBgIntervalProcess('testProcess', process, 100, lc, controller.signal);
  await clock.tickAsync(100);
  expect(errorStub.callCount).to.equal(1);
  expect(errorStub.getCall(0).args.join(' ')).to.contain('TestErrorBeforeStop');
});

test('error thrown during process (after stop is called) is logged to debug', async () => {
  const lc = new LogContext('debug');
  const errorStub = sinon.stub(console, 'error');
  const debugStub = sinon.stub(console, 'debug');

  let processCallCount = 0;
  const processResolver = resolver();
  const process = () => {
    processCallCount++;
    return processResolver.promise;
  };
  const controller = new AbortController();
  initBgIntervalProcess('testProcess', process, 100, lc, controller.signal);
  expect(processCallCount).to.equal(0);
  await clock.tickAsync(100);
  expect(processCallCount).to.equal(1);
  controller.abort();
  processResolver.reject('TestErrorAfterStop');
  try {
    await processResolver.promise;
  } catch (e) {
    expect(e).to.equal('TestErrorAfterStop');
  }
  expect(errorStub.callCount).to.equal(0);
  expect(debugStub.callCount).to.be.greaterThan(0);
  expect(debugStub.lastCall.args.join(' ')).to.contain('TestErrorAfterStop');
});
