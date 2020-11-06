module.exports = {
  webpack(config) {
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/[hash][ext][query]',
      },
    });
    return config;
  },
};
