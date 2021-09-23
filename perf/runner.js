/* eslint-env node, es2020 */

import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import * as playwright from 'playwright';
import {startDevServer} from '@web/dev-server';
import {esbuildPlugin} from '@web/dev-server-esbuild';
import getPort from 'get-port';
import * as os from 'os';
import * as path from 'path';
import {promises as fs} from 'fs';

const allBrowsers = ['chromium', 'webkit', 'firefox'];

function browser(arg) {
  arg = arg.toLowerCase();
  if (!['all', ...allBrowsers].includes(arg)) {
    const err = new Error(`Unknown browser ${arg}`);
    err.name = 'UNKNOWN_VALUE';
    err.value = arg;
    err.optionName = '--browsers';
    throw err;
  }
  return arg;
}

function browserName(browser) {
  let name = browser[0].toUpperCase() + browser.substr(1);
  if (name === 'Webkit') {
    name = 'WebKit';
  }
  return name;
}

function format(arg) {
  if (!['benchmarkJS', 'replicache'].includes(arg)) {
    const err = new Error(`Unknown format ${arg}`);
    err.name = 'UNKNOWN_VALUE';
    err.value = arg;
    err.optionName = '--format';
    throw err;
  }
  return arg;
}

async function main() {
  const optionDefinitions = [
    {
      name: 'verbose',
      alias: 'v',
      type: Boolean,
      defaultValue: false,
      description: 'Display additional information while running',
    },
    {
      name: 'format',
      alias: 'f',
      type: format,
      description:
        'Format for output, either benchmarkJS (default) or replicache',
    },
    {
      name: 'devtools',
      type: Boolean,
      description: 'Opens a browser to run benchmarks manually',
    },
    {
      name: 'groups',
      type: String,
      multiple: true,
      defaultValue: ['replicache'],
      description: 'Benchmark groups to run',
    },
    {
      name: 'browsers',
      type: browser,
      multiple: true,
      defaultValue: ['chromium'],
      description: `Browsers to run against, any of ${allBrowsers.join(
        ', ',
      )}, or all`,
    },
    {
      name: 'help',
      type: Boolean,
      description: 'Show this help message',
    },
  ];
  const options = commandLineArgs(optionDefinitions);
  if (options.browsers.length === 1 && options.browsers[0] === 'all') {
    options.browsers = allBrowsers;
  }
  if (options.devtools && options.browsers.length !== 1) {
    console.error('Exactly one browser may be specified with --devtools');
    process.exit(1);
  }

  if (options.help) {
    console.log(
      commandLineUsage([
        {content: 'Usage: perf [options...]'},
        {optionList: optionDefinitions},
      ]),
    );
    process.exit();
  }

  const port = await getPort();
  const server = await startDevServer({
    config: {
      nodeResolve: true,
      rootDir: process.cwd(),
      port,
      watch: false,
      plugins: [esbuildPlugin({ts: true, target: 'esnext'})],
    },
    readCliArgs: false,
    readFileConfig: false,
    logStartMessage: options.verbose,
  });

  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'replicache-playwright-'),
  );
  let first = true;
  for (const browser of options.browsers) {
    if (!first) {
      logLine('');
    }
    first = false;
    const context = await playwright[browser].launchPersistentContext(
      userDataDir,
      {devtools: options.devtools},
    );
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${port}/perf/index.html`);

    await runInBrowser(browser, page, options);

    // context.close does not terminate! Give it a second.
    await Promise.race([context.close(), wait(1000)]);
  }

  logLine('Done!');
  await fs.rm(userDataDir, {recursive: true});
  await server.stop();
}

async function runInBrowser(browser, page, options) {
  async function waitForBenchmarks() {
    await page.waitForFunction('typeof benchmarks !==  "undefined"', null, {
      // No need to wait 30s if failing to load
      timeout: 10000,
    });
  }

  await waitForBenchmarks();
  logLine(`Running benchmarks on ${browserName(browser)}...`);

  /** @type {{name: string, group: string}[]} */
  const benchmarks = await page.evaluate('benchmarks');

  if (options.devtools) {
    console.log(
      'Available benchmarks:',
      benchmarks.map(({name, group}) => ({name, group})),
    );
    console.log(
      'Run a single benchmark with `await runBenchmarkByNameAndGroup(name, group)`',
    );
    return;
  }

  const selectedBenchmarks = benchmarks.filter(({group}) =>
    options.groups.includes(group),
  );
  for (const benchmark of selectedBenchmarks) {
    const testResult = await page.evaluate(
      ({name, group, format}) =>
        // eslint-disable-next-line no-undef
        runBenchmarkByNameAndGroup(name, group, format),
      {format: options.format, ...benchmark},
    );
    if (testResult === undefined) {
      continue;
    }
    logLine(testResult);
    await page.reload();
    await waitForBenchmarks();
  }
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
