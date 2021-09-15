import {assert} from './replicache.js';
import {newTab} from '../src/test-util';
import {uuid} from '../src/sync/uuid.js';

enum Mode {
  SameTab = '',
  OtherTab = 'other tab',
  OtherProcess = 'other process',
}

export function benchmarks() {
  return [
    benchmarkUncontendedRead(),
    benchmarkHeldRead(Mode.SameTab),
    benchmarkHeldRead(Mode.OtherTab),
    benchmarkHeldRead(Mode.OtherProcess),
    benchmarkUncontendedWrite(),
  ];
}

export async function isHeld(name: string) {
  return await navigator.locks.request(
    name,
    {ifAvailable: true},
    async lock => lock === null,
  );
}

export function lockShared(name: string) {
  const p = new Promise(res => {
    window['resolve'] = res;
  });
  navigator.locks.request(name, {mode: 'shared'}, async () => p);
}

export function unlock() {
  window['resolve']();
}

function benchmarkUncontendedRead() {
  return {
    name: 'unheld read',
    group: 'lock',
    setup() {
      this.id = uuid();
    },
    async run() {
      await navigator.locks.request(this.id, {mode: 'shared'}, () => undefined);
    },
  };
}

function benchmarkHeldRead(mode: Mode) {
  return {
    name: 'held read' + (mode ? ' ' + mode : ''),
    group: 'lock',
    async setup() {
      this.id = uuid();
      if (mode) {
        this.tab = await newTab('perf/lock.ts', {opener: mode === 'other tab'});
        await this.tab.run(`await lockShared('${this.id}')`);
      } else {
        lockShared(this.id);
      }
      assert(await isHeld(this.id));
    },
    async teardown() {
      assert(await isHeld(this.id));
      mode ? this.tab.run(`await unlock('${this.id}')`) : unlock();
      await navigator.locks.request(this.id, () => undefined);
      assert(!(await isHeld(this.id)));
      if (mode) {
        this.tab.close();
      }
    },
    async run() {
      await navigator.locks.request(this.id, {mode: 'shared'}, () => undefined);
    },
  };
}

function benchmarkUncontendedWrite() {
  return {
    name: 'unheld write acq',
    group: 'lock',
    setup() {
      this.id = uuid();
    },
    async run() {
      await navigator.locks.request(this.id, () => undefined);
    },
  };
}
