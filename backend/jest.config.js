export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  setupFilesAfterEnv: ['./tests/setup.js'],
  testMatch: ['**/tests/api/*.test.js'],
  verbose: true,
  testTimeout: 10000,
  moduleDirectories: ['node_modules', '<rootDir>'],
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  resolver: undefined,
  transformIgnorePatterns: [
    'node_modules/(?!@supabase)'
  ]
};
