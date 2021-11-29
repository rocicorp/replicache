import {esbuildPlugin} from '@web/dev-server-esbuild';
import {playwrightLauncher} from '@web/test-runner-playwright';

const chromium = playwrightLauncher({product: 'chromium'});
// TODO(arv): Reenable webkit once it has been fixed upstream.
// https://github.com/modernweb-dev/web/issues/1797
// const webkit = playwrightLauncher({product: 'webkit'});
const firefox = playwrightLauncher({product: 'firefox'});

export default {
  concurrentBrowsers: 3,
  nodeResolve: true,
  plugins: [esbuildPlugin({ts: true, target: 'esnext'})],
  staticLogging: !!process.env.CI,
  testFramework: {
    config: {
      ui: 'tdd',
      reporter: 'html',
      timeout: 30000,
      retries: process.env.CI ? 3 : 0, // Firefox is flaky
    },
  },
  groups: [
    {
      name: 'Main',
      files: [
        'src/*.test.ts',
        'src/dag/*.test.ts',
        'src/db/*.test.ts',
        'src/kv/*.test.ts',
        'src/prolly/*.test.ts',
        'src/sync/*.test.ts',
        'src/migrate/*.test.ts',
        'src/btree/*.test.ts',
        // src/worker-tests/ intentionally excluded, see separate Worker group below
      ],
      browsers: [firefox, chromium],
    },
    {
      name: 'Worker',
      files: 'src/worker-tests/worker.test.ts',
      // Only Chrome supports modules in workers at the moment
      browsers: [chromium],
    },
  ],
};
