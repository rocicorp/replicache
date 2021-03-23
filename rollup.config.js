import typescript from '@wessberg/rollup-plugin-ts';
import replace from '@rollup/plugin-replace';
import alias from '@rollup/plugin-alias';
import copy from 'rollup-plugin-copy';

/* eslint-env node */

const dev = !!process.env.DEV;
const part = dev ? '.dev' : '';
const variant = dev ? 'debug' : 'release';
const format = process.env.CJS ? 'cjs' : 'es';
const dir = process.env.CJS ? 'cjs' : '.';

export default {
  input: 'src/mod.ts',
  output: {
    file: `./${dir}/${dev ? 'dev' : 'index'}.js`,
    format,
  },
  plugins: [
    // When building dev version use wasm/debug/ instead of wasm/relese/
    alias({
      entries: [
        {
          find: /wasm\/release\/replicache_client\.js$/,
          replacement: `wasm/${variant}/replicache_client.js`,
        },
      ],
    }),

    // Use replicache.wasm in same directory as index.js
    replace({
      ['./wasm/release/replicache_client_bg.wasm']: `'./${dir}/replicache${part}.wasm'`,
      delimiters: [`'`, `'`],
      include: 'src/repm-invoker.ts',
    }),

    typescript(),

    // Copy wasm file to out directory
    copy({
      targets: [
        {
          src: `src/wasm/${variant}/replicache_client_bg.wasm`,
          dest: `./`,
          rename: `${dir}/replicache${part}.wasm`,
        },
      ],
    }),
  ],
};
