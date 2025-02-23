/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'json', 'node'],
  testMatch: ['**/tests/api/*.test.js'],
  setupFilesAfterEnv: ['./tests/setup.js'],
  verbose: true,
  testTimeout: 10000,
  moduleDirectories: ['node_modules', '<rootDir>'],
  testEnvironmentOptions: {
    url: 'http://localhost'
  }
};
