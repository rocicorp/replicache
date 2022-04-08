// @ts-check

import * as esbuild from 'esbuild';

const sharedOptions = {
  bundle: true,
  target: 'es2018',
  minify: true,
  mangleProps: /^_./,
  reserveProps: /^__.*__$/,
};

async function buildMJS() {
  await esbuild.build({
    ...sharedOptions,
    outfile: 'out/replicache.mjs',
    format: 'esm',
    entryPoints: ['src/mod.ts'],
    // We inject __DEV__ into the output so that esbuild does not replace this.
    banner: {js: 'const __DEV__=process.env.NODE_ENV!=="production";'},
  });
}

async function buildCJS() {
  await esbuild.build({
    ...sharedOptions,
    outfile: 'out/replicache.js',
    format: 'cjs',
    entryPoints: ['src/mod.ts'],
    banner: {js: 'const __DEV__=process.env.NODE_ENV!=="production";'},
  });
}

async function buildCLI() {
  await esbuild.build({
    ...sharedOptions,
    platform: 'node',
    external: ['node:*'],
    outfile: 'out/cli.cjs',
    entryPoints: ['tool/cli.ts'],
  });
}

Promise.all([buildMJS(), buildCJS(), buildCLI()]);
