import typescript from 'rollup-plugin-ts';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';

/* eslint-env node */

const dir = 'out';
const cjs = process.env.CJS !== undefined;
const format = cjs ? 'cjs' : 'es';
const ext = cjs ? 'js' : 'mjs';

export default {
  input: 'src/mod.ts',
  output: {
    file: `./${dir}/replicache.${ext}`,
    format,
  },
  plugins: [
    // Use replicache.wasm in same directory as replicache.js
    replace({
      ['./wasm/release/replicache_client_bg.wasm']: `'./replicache.wasm'`,
      delimiters: [`'`, `'`],
      include: 'src/repm-invoker.ts',
      preventAssignment: true,
    }),

    nodeResolve(),
    commonjs(),

    typescript(),

    // Copy wasm files to out directory
    copy({
      targets: [
        {
          src: `src/wasm/release/replicache_client_bg.wasm`,
          dest: `./${dir}/`,
          rename: `replicache.wasm`,
        },
        {
          src: `src/wasm/debug/replicache_client_bg.wasm`,
          dest: `./${dir}/`,
          rename: `replicache.dev.wasm`,
        },
      ],
    }),
  ],
};
