// @ts-check

import * as esbuild from 'esbuild';

const forBundleSizeDashboard = process.argv.includes('--bundle-sizes');

const sharedOptions = {
  bundle: true,
  target: 'es2018',
  mangleProps: /^_./,
  reserveProps: /^__.*__$/,
};

/**
 * @param {"esm" | "cjs"} format
 * @param {boolean} minify
 * @param {string} ext
 */
async function buildReplicache(format, minify, ext) {
  await esbuild.build({
    ...sharedOptions,
    outfile: 'out/replicache.' + ext,
    format,
    entryPoints: ['src/mod.ts'],
    // We inject __DEV__ into the output so that esbuild does not replace this.
    banner: {js: 'const __DEV__=process.env.NODE_ENV!=="production";'},
    minify,
  });
}

async function buildMJS(minify = true, ext = 'mjs') {
  await buildReplicache('esm', minify, ext);
}

async function buildCJS(minify = true, ext = 'js') {
  await buildReplicache('cjs', minify, ext);
}

async function buildCLI() {
  await esbuild.build({
    ...sharedOptions,
    platform: 'node',
    external: ['node:*'],
    outfile: 'out/cli.cjs',
    entryPoints: ['tool/cli.ts'],
    minify: true,
  });
}

if (forBundleSizeDashboard) {
  Promise.all([
    buildMJS(false, 'mjs'),
    buildMJS(true, 'min.mjs'),
    buildCJS(false, 'js'),
    buildCJS(true, 'min.js'),
    buildCLI(),
  ]);
} else {
  Promise.all([buildMJS(), buildCJS(), buildCLI()]);
}
