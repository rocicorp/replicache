import {LogContext} from '@rocicorp/logger';
import {expect} from '@esm-bundle/chai';
import {resolver} from '../deps';
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
  initBgIntervalProcess('testProcess', process, 100, new LogContext('info'));

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
  const stop = initBgIntervalProcess(
    'testProcess',
    process,
    100,
    new LogContext('info'),
  );

  expect(processCallCount).to.equal(0);
  await clock.tickAsync(100);
  expect(processCallCount).to.equal(1);
  stop();
  await clock.tickAsync(100);
  expect(processCallCount).to.equal(1);
  await clock.tickAsync(400);
  expect(processCallCount).to.equal(1);
});

test('error thrown during process (before stop is called) is logged to error', async () => {
  const lc = new LogContext('info');
  const errorStub = sinon.stub(console, 'error');
  const process = () => {
    return Promise.reject('TestErrorBeforeStop');
  };
  initBgIntervalProcess('testProcess', process, 100, lc);
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
  const stop = initBgIntervalProcess('testProcess', process, 100, lc);
  expect(processCallCount).to.equal(0);
  await clock.tickAsync(100);
  expect(processCallCount).to.equal(1);
  stop();
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
