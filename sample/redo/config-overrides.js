// through this file we can override the default cra configuration
// see: https://github.com/timarney/react-app-rewired
const path = require('path');

module.exports = function override(config, env) {
  const wasmExtensionRegExp = /\.wasm$/;

  config.resolve.extensions.push('.wasm');
  // make the file loader ignore wasm files
  let fileLoader = null;
  config.module.rules.forEach(rule => {
    (rule.oneOf || []).map(oneOf => {
      if (oneOf.loader && oneOf.loader.indexOf('file-loader') >= 0) {
        fileLoader = oneOf;
      }
    });
  });
  fileLoader.exclude.push(wasmExtensionRegExp);

  // Add a dedicated loader for them
  config.module.rules.push({
    test: wasmExtensionRegExp,
    include: '/',
    use: [{ loader: require.resolve('wasm-loader'), options: {} }],
  });
  return config;
};