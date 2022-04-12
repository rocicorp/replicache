// @ts-check

import * as esbuild from 'esbuild';

const forBundleSizeDashboard = process.argv.includes('--bundle-sizes');
const perf = process.argv.includes('--perf');

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
    // Use neutral to remove the automatic define for process.env.NODE_ENV
    platform: 'neutral',
    outfile: 'out/replicache.' + ext,
    format,
    entryPoints: ['src/mod.ts'],
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

async function buildPerf() {
  await esbuild.build({
    ...sharedOptions,
    outfile: 'perf/index.js',
    entryPoints: ['perf/index.ts'],
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    sourcemap: true,
    format: 'esm',
    minify: true,
  });
}

if (perf) {
  await buildPerf();
} else if (forBundleSizeDashboard) {
  await Promise.all([
    buildMJS(false, 'mjs'),
    buildMJS(true, 'min.mjs'),
    buildCJS(false, 'js'),
    buildCJS(true, 'min.js'),
    buildCLI(),
  ]);
} else {
  await Promise.all([buildMJS(), buildCJS(), buildCLI()]);
}
