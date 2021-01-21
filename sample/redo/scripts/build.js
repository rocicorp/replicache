import esbuild from 'esbuild';
import fs from 'fs/promises';

/* eslint-env node */

const isProd = process.env.NODE_ENV === 'production';

await Promise.all([
  fs.copyFile(
    'node_modules/replicache/out/replicache.wasm',
    'public/replicache.wasm',
  ),

  esbuild.build({
    entryPoints: ['src/index.tsx'],
    outdir: 'public',
    bundle: true,
    sourcemap: true,
    define: {
      ['process.env.NODE_ENV']: JSON.stringify(process.env.NODE_ENV || ''),
    },
    format: 'esm',
    minify: isProd,
    target: isProd ? 'es2018' : 'esnext',
  }),
]);
