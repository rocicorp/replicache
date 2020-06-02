module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  resolver: './jest.resolver.js',
  testRegex: '/src/.+\\.test\\.ts$',
  watchPathIgnorePatterns: ['/src/fixtures/.*$'],
};
