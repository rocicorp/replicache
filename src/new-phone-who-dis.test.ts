import {expect} from '@esm-bundle/chai';
import * as sinon from 'sinon';
import type {Puller} from './puller.js';
import type {Pusher} from './pusher.js';
import type {Poke} from './replicache.js';
import {
  initReplicacheTesting,
  replicacheForTesting,
  tickAFewTimes,
} from './test-util.js';

initReplicacheTesting();

test('pull returning ClientStateNotFoundResponse should call onClientStateNotFound', async () => {
  const puller: Puller = async _req => {
    return {
      httpRequestInfo: {httpStatusCode: 200, errorMessage: ''},
      response: {
        error: 'ClientStateNotFound',
      },
    };
  };
  const pusher: Pusher = async _req => {
    return {httpStatusCode: 200, errorMessage: ''};
  };

  const consoleErrorStub = sinon.stub(console, 'error');
  const onClientStateNotFound = sinon.fake();

  const rep = await replicacheForTesting('new-phone', {
    puller,
    pusher,
    onClientStateNotFound,
  });

  // One pull from open

  expect(onClientStateNotFound.callCount).to.equal(1);
  expect(consoleErrorStub.callCount).to.equal(1);
  expect(consoleErrorStub.lastCall.args).to.deep.equal([
    `Client state not found, clientID: ${await rep.clientID}`,
  ]);

  rep.pull();
  await tickAFewTimes();

  expect(onClientStateNotFound.callCount).to.equal(2);
  expect(consoleErrorStub.callCount).to.equal(2);
  expect(consoleErrorStub.lastCall.args).to.deep.equal([
    `Client state not found, clientID: ${await rep.clientID}`,
  ]);
});

test('poke with ClientStateNotFoundResponse should call onClientStateNotFound', async () => {
  const puller: Puller = async _req => {
    return {
      httpRequestInfo: {httpStatusCode: 200, errorMessage: ''},
    };
  };

  const consoleErrorStub = sinon.stub(console, 'error');
  const onClientStateNotFound = sinon.fake();

  const rep = await replicacheForTesting('new-phone', {
    puller,
    onClientStateNotFound,
  });

  const pokeBody: Poke = {
    baseCookie: null,
    pullResponse: {error: 'ClientStateNotFound'},
  };
  await rep.poke(pokeBody);

  expect(onClientStateNotFound.callCount).to.equal(1);
  expect(consoleErrorStub.callCount).to.equal(1);
  expect(consoleErrorStub.lastCall.args).to.deep.equal([
    `Client state not found, clientID: ${await rep.clientID}`,
  ]);
});
