module.exports = {
  webpack(config) {
    config.experiments = {
      asyncWebAssembly: true,
    };
    return config;
  },
};
