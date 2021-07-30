import {esbuildPlugin} from '@web/dev-server-esbuild';
import {playwrightLauncher} from '@web/test-runner-playwright';

const chromium = playwrightLauncher({product: 'chromium'});
const webkit = playwrightLauncher({product: 'webkit'});
const firefox = playwrightLauncher({product: 'firefox'});

export default {
  concurrentBrowsers: 3,
  nodeResolve: true,
  plugins: [esbuildPlugin({ts: true})],
  testFramework: {
    config: {
      ui: 'tdd',
      reporter: 'html',
      timeout: 30000,
    },
  },
  groups: [
    {
      name: 'Main',
      files: [
        'src/kv/*.test.ts',
        'src/{replicache,connection-loop,json,subscriptions,rwlock}.test.ts',
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
