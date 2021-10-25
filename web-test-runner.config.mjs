import {esbuildPlugin} from '@web/dev-server-esbuild';
import {playwrightLauncher} from '@web/test-runner-playwright';

const chromium = playwrightLauncher({product: 'chromium'});
const webkit = playwrightLauncher({product: 'webkit'});
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
        // All but worker.test.ts
        'src/connection-loop.test.ts',
        'src/json.test.ts',
        'src/rw-lock.test.ts',
        'src/hash.test.ts',
        'src/replicache.test.ts',
        'src/hash.test.ts',
        'src/subscriptions.test.ts',
        'src/web-lock.test.ts',

        'src/dag/*.test.ts',
        'src/db/*.test.ts',
        'src/kv/*.test.ts',
        'src/prolly/*.test.ts',
        'src/sync/*.test.ts',
        'src/migrate/*.test.ts',
        'src/btree/*.test.ts',
      ],
      browsers: [firefox, chromium, webkit],
    },
    {
      name: 'Worker',
      files: 'src/worker.test.ts',
      // Only Chrome supports modules in workers at the moment
      browsers: [chromium],
    },
  ],
};
