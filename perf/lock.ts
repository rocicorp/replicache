import 'navigator.locks';
import {assert} from './replicache';
import {newTab, Tab, isFirefox} from '../src/test-util';
import {uuid} from '../src/sync/uuid';

enum Mode {
  SameTab = '',
  OtherTab = 'other tab',
  OtherProcess = 'other process',
}

export function benchmarks(): Array<unknown> {
  return [
    benchmarkUncontendedRead(),
    benchmarkHeldRead(Mode.SameTab),
    benchmarkHeldRead(Mode.OtherTab),
    benchmarkHeldRead(Mode.OtherProcess),
    benchmarkUncontendedWrite(),
  ];
}

export async function isHeld(name: string): Promise<boolean> {
  return (await navigator.locks.request(
    name,
    {ifAvailable: true},
    async lock => lock === null,
  )) as unknown as boolean;
}

const locks: Map<string, (value?: unknown) => void> = new Map();

export function lockShared(name: string): void {
  const p = new Promise(res => {
    locks.set(name, res);
  });
  void navigator.locks.request(name, {mode: 'shared'}, async () => p);
}

export function unlock(name: string): void {
  const resolve = locks.get(name);
  if (resolve) {
    resolve();
    locks.delete(name);
  }
}

function benchmarkUncontendedRead() {
  return {
    name: 'unheld read',
    group: 'lock',
    id: '',
    setup() {
      this.id = uuid();
    },
    async run() {
      await navigator.locks.request(
        this.id,
        {mode: 'shared'},
        async () => undefined,
      );
    },
  };
}

function benchmarkHeldRead(mode: Mode) {
  return {
    name: 'held read' + (mode ? ' ' + mode : ''),
    group: 'lock',
    id: '',
    tab: null as Tab | null,
    skip() {
      return mode === Mode.OtherProcess && isFirefox();
    },
    async setup() {
      this.id = uuid();
      if (mode) {
        this.tab = await newTab('perf/lock.ts', {opener: mode === 'other tab'});
        await this.tab.run(`lockShared('${this.id}')`);
      } else {
        lockShared(this.id);
      }
      assert(await isHeld(this.id));
    },
    async teardown() {
      assert(await isHeld(this.id));
      mode ? this.tab?.run(`unlock('${this.id}')`) : unlock(this.id);
      await navigator.locks.request(this.id, async () => undefined);
      assert(!(await isHeld(this.id)));
      if (mode) {
        this.tab?.close();
      }
    },
    async run() {
      await navigator.locks.request(
        this.id,
        {mode: 'shared'},
        async () => undefined,
      );
    },
  };
}

function benchmarkUncontendedWrite() {
  return {
    name: 'unheld write',
    group: 'lock',
    id: '',
    setup() {
      this.id = uuid();
    },
    async run() {
      await navigator.locks.request(this.id, async () => undefined);
    },
  };
}
