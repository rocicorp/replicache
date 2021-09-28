import {benchmarks as replicacheBenchmarks} from './replicache';
import {benchmarkIDBRead, benchmarkIDBWrite} from './idb';
import {benchmarks as lockBenchmarks} from './lock';
import {benchmarks as hashBenchmarks} from './hash';
import type {RandomDataType} from './data';

export type Benchmark = {
  name: string;
  group: string;
  byteSize?: number;
  skip?: () => Promise<boolean> | boolean;
  setup?: () => Promise<void> | void;
  teardown?: () => Promise<void> | void;
  run: (b: Bencher, i: number) => Promise<void> | void;
};

export type Bencher = {
  reset: () => void;
  stop: () => void;
};

async function runBenchmark(
  benchmark: Benchmark,
  format: OutputFormat,
): Promise<string | undefined> {
  // Execute fn at least this many runs.
  const minRuns = 5;
  // Execute fn at least for this long.
  const minTime = 500;
  const times: number[] = [];
  let sum = 0;

  if (benchmark.skip && (await benchmark.skip())) {
    return;
  }

  if (benchmark.setup) {
    await benchmark.setup();
  }

  for (let i = 0; i < minRuns || sum < minTime; i++) {
    let t0 = performance.now();
    let t1 = 0;
    await benchmark.run(
      {
        reset() {
          t0 = performance.now();
        },
        stop() {
          t1 = performance.now();
        },
      },
      i,
    );
    if (t1 === 0) {
      t1 = performance.now();
    }
    const dur = t1 - t0;
    times.push(dur);
    sum += dur;
  }

  if (benchmark.teardown) {
    await benchmark.teardown();
  }

  times.sort((a, b) => a - b);
  const runs = times.length;

  const median = 0.5;
  const medianTime = times[Math.floor(runs * median)];
  const bytesPerSecond = benchmark.byteSize
    ? `${formatToMBPerSecond(benchmark.byteSize, medianTime)} `
    : '';

  if (format === 'replicache') {
    const ptiles = [median, 0.75, 0.9, 0.95];
    return `${benchmark.name} ${ptiles
      .map(p => String(p * 100))
      .join('/')}%=${ptiles.map(p =>
      times[Math.floor(runs * p)].toFixed(2),
    )}ms/op ${bytesPerSecond}(${runs} runs sampled)`;
  } else {
    const variance =
      Math.max(medianTime - times[0], times[times.length - 1] - medianTime) /
      medianTime;
    return formatAsBenchmarkJS({
      name: benchmark.name,
      value: bytesPerSecond || `${((runs / sum) * 1000).toFixed(2)} ops/sec `,
      variance: `${(variance * 100).toFixed(1)}%`,
      runs,
    });
  }
}

function formatAsBenchmarkJS({
  name,
  value,
  variance,
  runs,
}: {
  name: string;
  value: string;
  variance: string;
  runs: number;
}): string {
  // Example:
  //   fib(20) x 11,465 ops/sec ±1.12% (91 runs sampled)
  //   createObjectBuffer with 200 comments x 81.61 ops/sec ±1.70% (69 runs sampled)
  return `${name} x ${value}±${variance} (${runs} runs sampled)`;
}

function formatToMBPerSecond(size: number, timeMS: number): string {
  const bytes = (size / timeMS) * 1000;
  return (bytes / 2 ** 20).toFixed(2) + ' MB/s';
}

export const benchmarks = [
  ...replicacheBenchmarks(),
  ...lockBenchmarks(),
  ...hashBenchmarks(),
];

for (const b of [benchmarkIDBRead, benchmarkIDBWrite]) {
  for (const numKeys of [1, 10, 100, 1000]) {
    const dataTypes: RandomDataType[] = ['string', 'object', 'arraybuffer'];
    for (const dataType of dataTypes) {
      const kb = 1024;
      const mb = kb * kb;
      const sizes = [
        kb,
        32 * kb,
        // Note: on blink, as of 4/2/2021, there's a cliff at 64kb
        mb,
        10 * mb,
        100 * mb,
      ];
      const group = dataType === 'arraybuffer' ? 'idb' : 'idb-extras';
      for (const valSize of sizes) {
        if (valSize > 10 * mb) {
          if (numKeys > 1) {
            continue;
          }
        } else if (valSize >= mb) {
          if (numKeys > 10) {
            continue;
          }
        }

        benchmarks.push(b({group, dataType, numKeys, valSize}));
      }
    }
  }
}

function findBenchmark(name: string, group: string): Benchmark {
  for (const b of benchmarks) {
    if (b.name === name && b.group === group) {
      return b;
    }
  }
  throw new Error(`No benchmark named "${name}" in group "${group}"`);
}

type OutputFormat = 'replicache' | 'benchmarkjs';

export async function runBenchmarkByNameAndGroup(
  name: string,
  group: string,
  format: OutputFormat | undefined = 'benchmarkjs',
): Promise<string | undefined> {
  const b = findBenchmark(name, group);
  try {
    return await runBenchmark(b, format);
  } catch (e) {
    return `${b.name}: Error: ${e}`;
  }
}

export function findBenchmarks(groups: string[]): Benchmark[] {
  return benchmarks.filter(b => groups.includes(b.group));
}

export async function runAll(groups: string[]): Promise<void> {
  const out: HTMLElement | null = document.getElementById('out');
  if (!out) {
    return;
  }
  const benchmarks = findBenchmarks(groups);
  for (const b of benchmarks) {
    const r = await runBenchmark(b, 'replicache');
    out.textContent += r + '\n';
  }
  out.textContent += 'Done!\n';
}
