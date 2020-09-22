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
  await page.goto(`http://localhost:${port}/perf/`);
  logLine('Running benchmarks please wait...');

  for (;;) {
    // @ts-ignore
    // eslint-disable-next-line no-undef
    const data = await page.evaluate(() => nextTest());
    if (data === null) {
      break;
    }
    logLine(data.join(' | '));
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
