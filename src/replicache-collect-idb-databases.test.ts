import {expect} from '@esm-bundle/chai';
import {clock, initReplicacheTesting, replicacheForTesting} from './test-util';

initReplicacheTesting();

test('collect IDB databases', async () => {
  if (!indexedDB.databases) {
    // Firefox does not support indexedDB.databases
    return;
  }

  const ONE_MINUTE = 1000 * 60 * 1;
  const FIVE_MINUTES = ONE_MINUTE * 5;
  const ONE_MONTH = 1000 * 60 * 60 * 24 * 30;
  const THREE_MONTHS = ONE_MONTH * 3;

  const rep = await replicacheForTesting('collect-idb-databases-1');
  await rep.close();

  expect(await getDatabases()).to.deep.equal(['collect-idb-databases-1']);

  await clock.tickAsync(THREE_MONTHS);

  const rep2 = await replicacheForTesting('collect-idb-databases-2');
  await rep2.close();

  expect(await getDatabases()).to.deep.equal([
    'collect-idb-databases-1',
    'collect-idb-databases-2',
  ]);

  await clock.tickAsync(ONE_MONTH);

  // Open one more database and keep it open long enough to trigger the collection.
  const rep3 = await replicacheForTesting('collect-idb-databases-3');
  await clock.tickAsync(FIVE_MINUTES);
  await rep3.close();

  expect(await getDatabases()).to.deep.equal([
    'collect-idb-databases-2',
    'collect-idb-databases-3',
  ]);

  async function getDatabases() {
    function parseName(idbName: string | undefined): string | undefined {
      return idbName && /^rep:[^:]+:([^:]+):\d+$/.exec(idbName)?.[1];
    }

    return (await indexedDB.databases())
      .map(({name}) => parseName(name))
      .filter(name => name && name.startsWith('collect-idb-databases'))
      .sort();
  }
});
