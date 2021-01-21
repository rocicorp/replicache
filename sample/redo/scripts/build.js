import esbuild from 'esbuild';
import fs from 'fs/promises';

/* eslint-env node */

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
    minify: process.env.NODE_ENV === 'production',
  }),
]);
