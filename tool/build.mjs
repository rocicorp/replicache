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
 * @param {{
 *   format: "esm" | "cjs";
 *   minify: boolean;
 *   ext: string;
 *   sourcemap: boolean;
 * }} options
 */
async function buildReplicache(options) {
  const {ext, ...restOfOptions} = options;
  await esbuild.build({
    ...sharedOptions,
    ...restOfOptions,
    // Use neutral to remove the automatic define for process.env.NODE_ENV
    platform: 'neutral',
    outfile: 'out/replicache.' + ext,
    entryPoints: ['src/mod.ts'],
  });
}

async function buildMJS({minify = true, ext = 'mjs', sourcemap = false} = {}) {
  await buildReplicache({format: 'esm', minify, ext, sourcemap});
}

async function buildCJS({minify = true, ext = 'js', sourcemap = false} = {}) {
  await buildReplicache({format: 'cjs', minify, ext, sourcemap});
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
  // Same as what wev build for the npm package but we turn on sourcemaps.
  await buildMJS({sourcemap: true});
}

if (perf) {
  await buildPerf();
} else if (forBundleSizeDashboard) {
  await Promise.all([
    buildMJS({minify: false, ext: 'mjs'}),
    buildMJS({minify: true, ext: 'min.mjs'}),
    buildCJS({minify: false, ext: 'js'}),
    buildCJS({minify: true, ext: 'min.js'}),
    buildCLI(),
  ]);
} else {
  await Promise.all([buildMJS(), buildCJS(), buildCLI()]);
}
