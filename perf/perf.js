import {
  benchmarkCreateIndex,
  benchmarkPopulate,
  benchmarkReadTransaction,
  benchmarkScan,
  benchmarkSingleByteWrite,
  benchmarkWriteReadRoundTrip,
  benchmarkSubscribe,
  benchmarkSubscribeSetup,
} from './replicache.js';
import {benchmarkIDBRead, benchmarkIDBWrite} from './idb.js';

/**
 * @typedef {{
 *   name: string;
 *   group: string;
 *   byteSize?: number;
 *   setup?: () => Promise<void> | void;
 *   teardown?: () => Promise<void> | void;
 *   run: (b: Bencher, i: number) => Promise<void> | void;
 * }} Benchmark
 *
 * @typedef {{
 *   reset: () => void;
 *   stop: () => void;
 * }} Bencher
 *
 * @typedef {"benchmarkJS"|"replicache"} OutputFormat
 */

/**
 * @param {Benchmark} benchmark
 * @param {OutputFormat} format
 */
async function runBenchmark(benchmark, format) {
  // Execute fn at least this many runs.
  const minRuns = 5;
  // Execute fn at least for this long.
  const minTime = 500;
  /** @type number[] */
  const times = [];
  let sum = 0;

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
    if (t1 == 0) {
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

/**
 * @param {{name: string; value: string; variance: string; runs: number}} opts
 */
function formatAsBenchmarkJS({name, value, variance, runs}) {
  // Example:
  //   fib(20) x 11,465 ops/sec ±1.12% (91 runs sampled)
  //   createObjectBuffer with 200 comments x 81.61 ops/sec ±1.70% (69 runs sampled)
  return `${name} x ${value}±${variance} (${runs} runs sampled)`;
}

/**
 * @param {number} size
 * @param {number} timeMS
 */
function formatToMBPerSecond(size, timeMS) {
  const bytes = (size / timeMS) * 1000;
  return (bytes / 2 ** 20).toFixed(2) + ' MB/s';
}

const benchmarks = [
  benchmarkPopulate({numKeys: 1000, clean: true}),
  benchmarkPopulate({numKeys: 1000, clean: false}),
  benchmarkPopulate({numKeys: 1000, clean: true, indexes: 1}),
  benchmarkPopulate({numKeys: 1000, clean: true, indexes: 2}),
  benchmarkReadTransaction({numKeys: 1000}),
  benchmarkReadTransaction({numKeys: 5000}),
  benchmarkScan({numKeys: 1000}),
  benchmarkScan({numKeys: 5000}),
  benchmarkSingleByteWrite(),
  benchmarkWriteReadRoundTrip(),
  benchmarkCreateIndex({numKeys: 1000}),
  benchmarkCreateIndex({numKeys: 5000}),
  benchmarkSubscribe({count: 10}),
  benchmarkSubscribe({count: 100}),
  benchmarkSubscribe({count: 1000}),
  benchmarkSubscribeSetup({count: 10}),
  benchmarkSubscribeSetup({count: 100}),
  benchmarkSubscribeSetup({count: 1000}),
];

for (let b of [benchmarkIDBRead, benchmarkIDBWrite]) {
  for (let numKeys of [1, 10, 100, 1000]) {
    const dataTypes = /** @type {import('./data').RandomDataType[]} */ (
      /** @type unknown */ (['string', 'object', 'arraybuffer'])
    );
    for (let dataType of dataTypes) {
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
      const group = dataType == 'arraybuffer' ? 'idb' : 'idb-extras';
      for (let valSize of sizes) {
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

/**
 * @param {string} name
 * @param {string} group
 * @return {Benchmark}
 */
function findBenchmark(name, group) {
  for (const b of benchmarks) {
    if (b.name === name && b.group === group) {
      return b;
    }
  }
  throw new Error(`No benchmark named "${name}" in group "${group}"`);
}

/**
 * @param {string} name
 * @param {string} group
 * @param {OutputFormat | undefined} format
 */
async function runBenchmarkByNameAndGroup(name, group, format = 'benchmarkJS') {
  const b = findBenchmark(name, group);
  try {
    return await runBenchmark(b, format);
  } catch (e) {
    return `${b.name}: Error: ${e}`;
  }
}

/**
 * @param {string[]} groups
 * @return {Benchmark[]}
 */
function findBenchmarks(groups) {
  return benchmarks.filter(b => groups.includes(b.group));
}

// @ts-ignore
window.benchmarks = benchmarks;
// @ts-ignore
window.findBenchmarks = findBenchmarks;
// @ts-ignore
window.runBenchmarkByNameAndGroup = runBenchmarkByNameAndGroup;

// @ts-ignore
window.runAll = async function (groups) {
  const out = /** @type {HTMLPreElement} */ (
    /** @type {unknown} */ document.getElementById('out')
  );
  const benchmarks = findBenchmarks(groups);
  for (const b of benchmarks) {
    const r = await runBenchmark(b, 'replicache');
    out.textContent += r + '\n';
  }
  out.textContent += 'Done!\n';
};
