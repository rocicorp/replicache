/* eslint-env node */

import esbuild from 'esbuild';
import {copyFileSync} from 'fs';

copyFileSync(
  './node_modules/replicache/out/replicache.wasm',
  'public/replicache.wasm',
);

const NODE_ENV = process.env.NODE_ENV ?? '';
const isDev = NODE_ENV !== 'production';

esbuild.buildSync({
  entryPoints: ['src/index.tsx'],
  define: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
  },
  outdir: 'public',
  format: 'esm',
  bundle: true,
  minify: !isDev,
  sourcemap: isDev,
});
