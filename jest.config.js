module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  resolver: './jest.resolver.js',
  testRegex: '/src/.+\\.test\\.ts$',
  watchPathIgnorePatterns: ['/src/fixtures/.*$'],
  testTimeout: 10_000,
  transform: {
    "^.+\\.js?$": "babel-jest", // Adding this line solved the issue
    "^.+\\.ts?$": "ts-jest"
  },
};
