// @ts-check
/* eslint-disable @typescript-eslint/ban-ts-comment */

import playwright from 'playwright';

import {startDevServer} from '@web/dev-server';
import getPort from 'get-port';

async function main() {
  // eslint-disable-next-line no-undef
  const verbose = process.argv.includes('--verbose');
  const port = await getPort();
  const server = await startDevServer({
    config: {
      // eslint-disable-next-line no-undef
      rootDir: process.cwd(),
      port,
      watch: false,
    },
    readCliArgs: false,
    readFileConfig: false,
    logStartMessage: verbose,
  });

  const browserType = 'chromium';
  const browser = await playwright[browserType].launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`http://localhost:${port}/perf/`, {waitUntil: 'load'});
  console.log(await page.innerHTML('html'));
  logLine('Running benchmarks please wait...');

  for (;;) {
    // @ts-ignore
    // eslint-disable-next-line no-undef
    const testResult = await page.evaluate(() => nextTest());
    if (testResult === null) {
      break;
    }
    logLine(formatAsBenchmarkJS(testResult));
  }

  logLine('Done!');

  await browser.close();
  await server.stop();
}

main();

/** @param {string} s */
function logLine(s) {
  // eslint-disable-next-line no-undef
  process.stdout.write(s + '\n');
}

// TODO(arv): Use BenchmarkJS instead of our custom runner?
function formatAsBenchmarkJS({name, value, median}) {
  // Example:
  //   fib(20) x 11,465 ops/sec ±1.12% (91 runs sampled)
  //   createObjectBuffer with 200 comments x 81.61 ops/sec ±1.70% (69 runs sampled)
  return `${name} x ${value} ±0.0% (0 runs sampled)`;
}
