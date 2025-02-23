/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFilesAfterEnv: ['./tests/setup.js'],
  testMatch: ['**/tests/api/*.test.js'],
  verbose: true,
  testTimeout: 10000
};

export default config;
