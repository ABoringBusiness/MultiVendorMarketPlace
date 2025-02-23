export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFiles: ['./tests/setup.js'],
  testMatch: ['**/tests/api/*.test.js']
};
