import {esbuildPlugin} from '@web/dev-server-esbuild';

export default {
  nodeResolve: true,
  plugins: [esbuildPlugin({ts: true})],
  testFramework: {
    config: {
      ui: 'tdd',
      timeout: 30000,
    },
  },
};
