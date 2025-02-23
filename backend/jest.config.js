/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  setupFilesAfterEnv: ['./tests/setup.js'],
  testMatch: ['**/tests/api/*.test.js'],
  verbose: true,
  testTimeout: 10000,
  moduleDirectories: ['node_modules', '<rootDir>']
};

export default config;
