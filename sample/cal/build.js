/* eslint-env node, es6 */

import esbuild from 'esbuild';
import {copyFile} from 'fs/promises';

async function main() {
  const p1 = copyFile(
    './node_modules/replicache/out/replicache.wasm',
    'public/replicache.wasm',
  );

  const NODE_ENV = process.env.NODE_ENV ?? '';
  const isDev = NODE_ENV !== 'production';

  const p2 = esbuild.build({
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

  await Promise.all([p1, p2]);
}

main().catch(e => {
  console.error(e);
  process.exit(42);
});
