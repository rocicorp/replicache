import {benchmarks as replicacheBenchmarks} from './replicache';
import {benchmarkIDBRead, benchmarkIDBWrite} from './idb';
import {benchmarks as lockBenchmarks} from './lock';
import {benchmarks as hashBenchmarks} from './hash';
import {benchmarks as storageBenchmarks} from './storage';
import {formatAsBenchmarkJS, formatAsReplicache} from './format';
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

export type BenchmarkResult = {
  name: string;
  group: string;
  byteSize?: number;
  sortedRunTimesMs: number[];
  runTimesStatistics: {
    meanMs: number;
    medianMs: number;
    p75Ms: number;
    p90Ms: number;
    p95Ms: number;
    variance: number;
  };
};

async function runBenchmark(
  benchmark: Benchmark,
): Promise<BenchmarkResult | undefined> {
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
    let t0 = 0;
    let t1 = 0;
    const reset = () => {
      performance.mark('mark-' + i);
      t0 = performance.now();
    };
    const stop = () => {
      t1 = performance.now();
      performance.measure(benchmark.name, 'mark-' + i);
    };
    reset();

    await benchmark.run(
      {
        reset,
        stop,
      },
      i,
    );
    if (t1 === 0) {
      stop();
    }
    const dur = t1 - t0;
    times.push(dur);
    sum += dur;
  }

  if (benchmark.teardown) {
    await benchmark.teardown();
  }

  times.sort((a, b) => a - b);
  const calcPercentile = (percentile: number): number => {
    return times[Math.floor((runCount * percentile) / 100)];
  };
  const runCount = times.length;
  const medianMs = calcPercentile(50);
  return {
    name: benchmark.name,
    group: benchmark.group,
    byteSize: benchmark.byteSize,
    sortedRunTimesMs: times,
    runTimesStatistics: {
      meanMs: sum / runCount,
      medianMs,
      p75Ms: calcPercentile(75),
      p90Ms: calcPercentile(90),
      p95Ms: calcPercentile(95),
      variance: Math.max(
        medianMs - times[0],
        times[times.length - 1] - medianMs,
      ),
    },
  };
}

export const benchmarks = [
  ...replicacheBenchmarks(),
  ...lockBenchmarks(),
  ...hashBenchmarks(),
  ...storageBenchmarks(),
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

export async function runBenchmarkByNameAndGroup(
  name: string,
  group: string,
  format: 'replicache' | 'benchmarkJS',
): Promise<{jsonEntry: Entry; text: string} | {error: string} | undefined> {
  const b = findBenchmark(name, group);
  try {
    const result = await runBenchmark(b);
    if (!result) {
      return undefined;
    }
    return {
      jsonEntry: createGithubActionBenchmarkJsonEntry(result),
      text:
        format === 'replicache'
          ? formatAsReplicache(result)
          : formatAsBenchmarkJS(result),
    };
  } catch (e) {
    return {error: `${b.name} had an error: ${e}`};
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
    try {
      const result = await runBenchmark(b);
      if (result) {
        out.textContent += formatAsReplicache(result) + '\n';
      }
    } catch (e) {
      out.textContent += `${b.name} had an error: ${e}` + '\n';
    }
  }
  out.textContent += 'Done!\n';
}

// See https://github.com/benchmark-action/github-action-benchmark#examples
type Entry = {
  name: string;
  unit: string;
  value: number;
  // variance
  range?: string;
  // any extra info, will be displayed in tool tip on graphs
  extra?: string;
};

function createGithubActionBenchmarkJsonEntry(result: BenchmarkResult): Entry {
  return {
    name: result.name,
    unit: 'median ms',
    value: result.runTimesStatistics.medianMs,
    range: result.runTimesStatistics.variance.toFixed(2).toString(),
    extra: formatAsReplicache(result),
  };
}
