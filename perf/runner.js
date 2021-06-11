/* eslint-env node, es2020 */

import * as playwright from 'playwright';
import {startDevServer} from '@web/dev-server';
import getPort from 'get-port';
import * as os from 'os';
import * as path from 'path';
import {promises as fs} from 'fs';

async function main() {
  const verbose = process.argv.includes('--verbose');
  const devtools = process.argv.includes('--devtools');
  const port = await getPort();
  const server = await startDevServer({
    config: {
      rootDir: process.cwd(),
      port,
      watch: false,
    },
    readCliArgs: false,
    readFileConfig: false,
    logStartMessage: verbose,
  });

  const browserType = 'chromium';
  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'replicache-playwright-'),
  );
  const context = await playwright[browserType].launchPersistentContext(
    userDataDir,
    {devtools},
  );

  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${port}/perf/index.html`);
  await page.waitForFunction('typeof nextTest ===  "function"', null, {
    // No need to wait 30s if failing to load
    timeout: 1000,
  });
  logLine('Running benchmarks please wait...');

  if (devtools) {
    console.log('Enter `await nextTest()` in the devtools console');
    return;
  }

  for (;;) {
    const testResult = await page.evaluate('nextTest(["replicache"])');
    if (testResult === null) {
      break;
    }
    logLine(testResult);
  }

  logLine('Done!');

  await server.stop();

  await fs.rmdir(userDataDir, {recursive: true});

  // context.close does not terminate! Give it a second.
  Promise.race([context.close(), wait(1000)]);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

/** @param {string} s */
function logLine(s) {
  process.stdout.write(s + '\n');
}

/** @param {number} n */
function wait(n) {
  return new Promise(resolve => setTimeout(resolve, n));
}
