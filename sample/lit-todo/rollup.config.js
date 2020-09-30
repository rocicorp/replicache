import {nodeResolve} from '@rollup/plugin-node-resolve';

export default {
  input: 'main.js',
  output: {
    dir: 'output',
    format: 'cjs',
  },
  plugins: [nodeResolve()],
};
